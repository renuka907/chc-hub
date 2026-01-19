import React, { useState, useEffect, useRef } from "react";
      import { base44 } from "@/api/base44Client";
      import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
      import { Button } from "@/components/ui/button";
      import { Input } from "@/components/ui/input";
      import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
      import { Badge } from "@/components/ui/badge";
      import { Alert, AlertDescription } from "@/components/ui/alert";
      import { usePermissions } from "../components/permissions/usePermissions";
      import PanelManager from "../components/panels/PanelManager";
      import { Search, Loader2, TestTube, Star, ExternalLink, Plus, AlertCircle, RefreshCw, Trash2, Folder, Minus, Settings, Sparkles } from "lucide-react";
      import { toast } from "sonner";

export default function LabTestDirectory() {
          const [searchQuery, setSearchQuery] = useState("");
          const [isSearching, setIsSearching] = useState(false);
          const [searchResults, setSearchResults] = useState(null);
          const [showPanelForm, setShowPanelForm] = useState(false);
          const [newPanelName, setNewPanelName] = useState("");
          const [showPanelManager, setShowPanelManager] = useState(false);
          const queryClient = useQueryClient();
          const { can } = usePermissions();
          const [currentUser, setCurrentUser] = useState(null);

          React.useEffect(() => {
              base44.auth.me().then(setCurrentUser).catch(() => {});
          }, []);

          const isAdmin = currentUser?.role === 'admin';

    const { data: savedTests = [], isLoading } = useQuery({
        queryKey: ['labTests'],
        queryFn: () => base44.entities.LabTestInfo.list('-updated_date'),
    });

    const { data: panels = [] } = useQuery({
        queryKey: ['panels'],
        queryFn: () => base44.entities.Panel.list('-updated_date'),
    });

    const toggleFavoriteMutation = useMutation({
        mutationFn: ({ id, isFavorite }) => 
            base44.entities.LabTestInfo.update(id, { is_favorite: !isFavorite }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['labTests'] });
        }
    });

    const saveTestMutation = useMutation({
        mutationFn: (testData) => base44.entities.LabTestInfo.create(testData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['labTests'] });
            toast.success("Test information saved");
        }
    });

    const syncTubeMutation = useMutation({
        mutationFn: async ({ id }) => {
            const res = await base44.functions.invoke('syncQuestTubeType', { testId: id });
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['labTests'] });
            if (data?.success && data?.tube_type) {
                toast.success(`Tube type updated: ${data.tube_type}`);
            } else {
                toast.error(data?.error || 'Could not find Preferred Specimen on Quest');
            }
        },
        onError: () => {
            toast.error('Failed to sync tube type');
        }
    });

    const deleteTestMutation = useMutation({
        mutationFn: (id) => base44.entities.LabTestInfo.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['labTests'] });
            toast.success("Test deleted");
        },
        onError: () => {
            toast.error('Failed to delete test');
        }
    });

    const generateICD10Mutation = useMutation({
        mutationFn: async ({ testId, testName, testCode, category }) => {
            const { data } = await base44.functions.invoke('generateICD10Codes', { 
                testName,
                testCode,
                category
            });
            if (data?.codes && Array.isArray(data.codes)) {
                await base44.entities.LabTestInfo.update(testId, { diagnosis_codes: JSON.stringify(data.codes) });
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['labTests'] });
            toast.success("ICD-10 codes generated");
        },
        onError: () => {
            toast.error('Failed to generate codes');
        }
    });

    const createPanelMutation = useMutation({
        mutationFn: (panelData) => base44.entities.Panel.create(panelData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['panels'] });
            setNewPanelName("");
            setShowPanelForm(false);
            toast.success("Panel created");
        },
        onError: () => {
            toast.error('Failed to create panel');
        }
    });

    const updateTestPanelsMutation = useMutation({
        mutationFn: ({ testId, panelIds }) => 
            base44.entities.LabTestInfo.update(testId, { panel_ids: JSON.stringify(panelIds) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['labTests'] });
            toast.success("Panel assignment updated");
        },
        onError: () => {
            toast.error('Failed to update panels');
        }
    });

    const handleSyncTube = (id) => syncTubeMutation.mutate({ id });

    // Auto-sync tube types from Quest for saved tests (runs once per test id)
    const syncedRef = useRef(new Set());
    useEffect(() => {
        const list = Array.isArray(savedTests) ? savedTests : [];
        const toSync = list.filter(t => {
            if (!t?.quest_url || syncedRef.current.has(t.id)) return false;
            const tube = (t.tube_type || '').toLowerCase();
            const name = (t.test_name || '').toLowerCase();
            // Sync if missing tube, looks like SST/Gold, or is a QuantiFERON test
            return !tube || /\bsst\b|gold/.test(tube) || /quantiferon|tb gold/.test(name);
        });
        toSync.forEach(t => {
            syncedRef.current.add(t.id);
            base44.functions.invoke('syncQuestTubeType', { testId: t.id })
                .then(() => queryClient.invalidateQueries({ queryKey: ['labTests'] }))
                .catch(() => {/* ignore per-item errors */});
        });
    }, [savedTests]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            toast.error("Please enter a test name");
            return;
        }

        setIsSearching(true);
        setSearchResults(null);

        try {
            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `Find lab test information for: "${searchQuery}"

This could be a test name, abbreviation, or Quest test code. Find the CLOSEST MATCH from standard medical lab tests:

Common abbreviations you should recognize:
- CBC = Complete Blood Count (Lavender EDTA)
- CMP = Comprehensive Metabolic Panel (Gold SST)
- BMP = Basic Metabolic Panel (Gold SST)
- TSH = Thyroid Stimulating Hormone (Gold SST)
- T3, T4 = Thyroid hormones (Gold SST)
- PSA = Prostate Specific Antigen (Gold SST)
- HbA1c = Hemoglobin A1c (Lavender EDTA)
- Lipid Panel = Cholesterol panel (Gold SST)
- ESR = Erythrocyte Sedimentation Rate (Lavender EDTA)
- PT/INR = Prothrombin Time (Blue sodium citrate)
- PTT = Partial Thromboplastin Time (Blue sodium citrate)

ALWAYS return found: true if you recognize the test (even partially). Provide your best match.

Required information:
- test_name: Full official name
- test_code: Quest code if known
- tube_type: Exact tube (e.g., "Lavender-top EDTA", "Gold-top SST", "Red-top")
- specimen_type: Blood type or other specimen
- collection_instructions: How to collect
- storage_requirements: Storage temp and conditions
- volume_required: Amount needed
- quest_url: Link to Quest page (use format: https://testdirectory.questdiagnostics.com/test/test-detail/[testcode])
- category: Hematology/Chemistry/Hormone/etc
- notes: Special handling

Only return found: false if you truly cannot identify what test they're asking about.`,
                add_context_from_internet: true,
                response_json_schema: {
                    type: "object",
                    properties: {
                        found: { type: "boolean" },
                        test_name: { type: "string" },
                        test_code: { type: "string" },
                        tube_type: { type: "string" },
                        specimen_type: { type: "string" },
                        collection_instructions: { type: "string" },
                        storage_requirements: { type: "string" },
                        volume_required: { type: "string" },
                        quest_url: { type: "string" },
                        category: { type: "string" },
                        notes: { type: "string" },
                        suggestions: {
                            type: "array",
                            items: { type: "string" }
                        }
                    }
                }
            });

            setSearchResults(response);
            if (response?.quest_url) {
                try {
                    const { data } = await base44.functions.invoke('fetchQuestTubeType', { questUrl: response.quest_url });
                    if (data?.tube_type) {
                        setSearchResults({ ...response, tube_type: data.tube_type });
                    } else if (data?.error) {
                        console.log('Quest verification:', data.error);
                    }
                } catch (e) {
                    console.log('Verification via Quest failed', e);
                }
            }

            // Auto-generate ICD-10 codes
            try {
                const { data: icdData } = await base44.functions.invoke('generateICD10Codes', { 
                    testName: response.test_name,
                    testCode: response.test_code,
                    category: response.category
                });
                if (icdData?.codes && Array.isArray(icdData.codes)) {
                    setSearchResults(prev => ({
                        ...prev,
                        diagnosis_codes: icdData.codes
                    }));
                }
            } catch (e) {
                console.log('ICD-10 generation skipped', e);
            }
            } catch (error) {
            toast.error("Failed to search Quest Diagnostics");
            console.error(error);
            } finally {
            setIsSearching(false);
            }
            };

    const handleSaveTest = (testData) => {
        const payload = {
            test_name: testData.test_name,
            test_code: testData.test_code || "",
            tube_type: testData.tube_type,
            specimen_type: testData.specimen_type || "",
            collection_instructions: testData.collection_instructions || "",
            storage_requirements: testData.storage_requirements || "",
            volume_required: testData.volume_required || "",
            quest_url: testData.quest_url || "",
            category: testData.category || "General",
            notes: testData.notes || "",
            diagnosis_codes: testData.diagnosis_codes ? JSON.stringify(testData.diagnosis_codes) : "[]",
            is_favorite: false
        };
        saveTestMutation.mutate(payload, {
            onSuccess: async (created) => {
                // Also trigger tube sync if quest_url is present, and only if a new item was created
                if (testData.quest_url && created?.id) {
                    await base44.functions.invoke('syncQuestTubeType', { testId: created.id });
                    queryClient.invalidateQueries({ queryKey: ['labTests'] });
                }
            }
        });
    };

    const tubeColors = {
        "lavender": "bg-purple-300 text-purple-950",
        "purple": "bg-purple-300 text-purple-950",
        "red": "bg-red-400 text-white",
        "gold": "bg-yellow-400 text-yellow-950",
        "yellow": "bg-yellow-400 text-yellow-950",
        "green": "bg-green-400 text-green-950",
        "blue": "bg-cyan-300 text-cyan-950",
        "gray": "bg-gray-400 text-gray-950",
        "pink": "bg-pink-300 text-pink-950",
        "black": "bg-black text-white",
        "sodium citrate": "bg-cyan-300 text-cyan-950",
        "edta": "bg-purple-300 text-purple-950",
        "sst": "bg-yellow-400 text-yellow-950"
    };

    const getTubeColor = (tubeType) => {
        if (!tubeType) return "bg-gray-100 text-gray-800";
        const lowerTube = tubeType.toLowerCase();
        for (const [color, className] of Object.entries(tubeColors)) {
            if (lowerTube.includes(color)) return className;
        }
        return "bg-gray-100 text-gray-800";
    };

    const filteredTests = savedTests.filter(test =>
        test.test_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.test_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const favoriteTests = filteredTests.filter(t => t.is_favorite);
    const otherTests = filteredTests.filter(t => !t.is_favorite);

    const normalizeTubeType = (tubeType) => {
        if (!tubeType) return 'Unknown';
        const lowerTube = tubeType.toLowerCase();
        if (lowerTube.includes('red')) return 'Red-top';
        if (lowerTube.includes('lavender') || lowerTube.includes('purple') || lowerTube.includes('edta')) return 'Lavender-top (EDTA)';
        if (lowerTube.includes('gold') || lowerTube.includes('sst')) return 'Gold-top (SST)';
        if (lowerTube.includes('blue') || lowerTube.includes('sodium citrate')) return 'Blue-top (Citrate)';
        if (lowerTube.includes('green')) return 'Green-top';
        if (lowerTube.includes('yellow')) return 'Yellow-top';
        if (lowerTube.includes('gray')) return 'Gray-top';
        if (lowerTube.includes('pink')) return 'Pink-top';
        if (lowerTube.includes('black')) return 'Black-top';
        return tubeType;
    };

    const getTubeCapacity = (tubeType) => {
        if (!tubeType) return 5;
        const lowerTube = tubeType.toLowerCase();
        const capacities = {
            "lavender": 3,
            "purple": 3,
            "edta": 3,
            "red": 7,
            "gold": 8,
            "yellow": 5,
            "green": 6,
            "blue": 2.7,
            "sodium citrate": 2.7,
            "gray": 4,
            "pink": 5,
            "black": 2.7,
            "sst": 8
        };
        for (const [color, capacity] of Object.entries(capacities)) {
            if (lowerTube.includes(color)) return capacity;
        }
        return 5;
    };

    const calculatePanelTubes = (panelId, panelName) => {
        const panelTests = savedTests.filter(t => {
            try {
                const panelIds = typeof t.panel_ids === 'string' ? JSON.parse(t.panel_ids) : t.panel_ids || [];
                return Array.isArray(panelIds) ? panelIds.includes(panelId) : false;
            } catch {
                return false;
            }
        });
        const tubeVolumes = {};
        panelTests.forEach(test => {
            const tube = normalizeTubeType(test.tube_type);
            const volumeStr = test.volume_required || '0';
            const volumeNeeded = parseFloat(volumeStr) || 0;
            tubeVolumes[tube] = (tubeVolumes[tube] || 0) + volumeNeeded;
        });

        const tubeCount = {};
        Object.entries(tubeVolumes).forEach(([tube, totalVolume]) => {
            const capacity = getTubeCapacity(tube);
            tubeCount[tube] = Math.ceil(totalVolume / capacity);
        });

        // Override for Female HRT- Initial Panel - force red-top to 2
        if (panelName === "Female HRT- Initial Panel") {
            tubeCount["Red-top"] = 2;
        }

        return tubeCount;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Lab Test Directory</h1>
                    <p className="text-gray-600">Search Quest Diagnostics for tube types and specimen requirements</p>
                </div>
                {isAdmin && (
                    <Button
                        onClick={() => setShowPanelManager(true)}
                        variant="outline"
                        className="gap-2"
                    >
                        <Settings className="w-4 h-4" />
                        Manage Panels
                    </Button>
                )}
            </div>

            <PanelManager isOpen={showPanelManager} onClose={() => setShowPanelManager(false)} />

            {/* Search Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        Search Quest Diagnostics
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Search by test name, code, or abbreviation (e.g., CBC, 7336, TSH)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button 
                            onClick={handleSearch} 
                            disabled={isSearching}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isSearching ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Searching...
                                </>
                            ) : (
                                <>
                                    <Search className="w-4 h-4 mr-2" />
                                    Search
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Search Results */}
                    {searchResults && (
                        <div className="space-y-4 mt-4">
                            {searchResults.found ? (
                                <Card className="border-blue-200 bg-blue-50">
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                                    {searchResults.test_name}
                                                </h3>
                                                {searchResults.test_code && (
                                                    <Badge variant="outline" className="mb-2">
                                                        Code: {searchResults.test_code}
                                                    </Badge>
                                                )}
                                                </div>
                                                <Button
                                                size="sm"
                                                onClick={() => handleSaveTest(searchResults)}
                                                disabled={saveTestMutation.isPending}
                                                className="text-black"
                                                >
                                                <Plus className="w-4 h-4 mr-2" />
                                                Save to Directory
                                                </Button>
                                                </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700 mb-1">Tube Type</p>
                                                <Badge className={getTubeColor(searchResults.tube_type)}>
                                                    <TestTube className="w-3 h-3 mr-1" />
                                                    {searchResults.tube_type}
                                                </Badge>
                                            </div>
                                            {searchResults.specimen_type && (
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-700 mb-1">Specimen Type</p>
                                                    <p className="text-sm text-gray-800">{searchResults.specimen_type}</p>
                                                </div>
                                            )}
                                            {searchResults.volume_required && (
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-700 mb-1">Volume Required</p>
                                                    <p className="text-sm text-gray-800">{searchResults.volume_required}</p>
                                                </div>
                                            )}
                                            {searchResults.category && (
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-700 mb-1">Category</p>
                                                    <Badge variant="outline">{searchResults.category}</Badge>
                                                </div>
                                            )}
                                        </div>

                                        {searchResults.collection_instructions && (
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700 mb-1">Collection Instructions</p>
                                                <p className="text-sm text-gray-800">{searchResults.collection_instructions}</p>
                                            </div>
                                        )}

                                        {searchResults.storage_requirements && (
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700 mb-1">Storage Requirements</p>
                                                <p className="text-sm text-gray-800">{searchResults.storage_requirements}</p>
                                            </div>
                                        )}

                                        {searchResults.notes && (
                                            <Alert>
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription>{searchResults.notes}</AlertDescription>
                                            </Alert>
                                        )}

                                        {searchResults.quest_url && (
                                            <a 
                                                href={searchResults.quest_url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                                            >
                                                View on Quest Diagnostics
                                                <ExternalLink className="w-3 h-3 ml-1" />
                                            </a>
                                        )}

                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 mb-2 block">Diagnosis Codes (ICD-10)</label>
                                            <Input
                                                placeholder="e.g., Z12.89, R00.0, E04.9"
                                                value={searchResults.diagnosis_codes?.join(", ") || ""}
                                                onChange={(e) => setSearchResults({
                                                    ...searchResults,
                                                    diagnosis_codes: e.target.value.split(",").map(c => c.trim()).filter(Boolean)
                                                })}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Comma-separated ICD-10 codes that cover this test</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        <p className="font-semibold mb-2">Test not found</p>
                                        {searchResults.suggestions?.length > 0 && (
                                            <div>
                                                <p className="text-sm mb-1">Similar tests:</p>
                                                <ul className="text-sm list-disc list-inside">
                                                    {searchResults.suggestions.map((suggestion, i) => (
                                                        <li key={i}>{suggestion}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Panels Section */}
            {isAdmin && (
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Test Panels</h2>
                    <Button 
                        onClick={() => setShowPanelForm(!showPanelForm)}
                        className="bg-purple-600 hover:bg-purple-700"
                        size="sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Panel
                    </Button>
                </div>

                {showPanelForm && (
                    <Card className="mb-4">
                        <CardContent className="pt-6 space-y-3">
                            <Input
                                placeholder="Panel name (e.g., Annual Physical, Hormone Panel)"
                                value={newPanelName}
                                onChange={(e) => setNewPanelName(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && newPanelName.trim() && createPanelMutation.mutate({ panel_name: newPanelName })}
                            />
                            <div className="flex gap-2">
                                <Button 
                                    onClick={() => newPanelName.trim() && createPanelMutation.mutate({ panel_name: newPanelName })}
                                    disabled={!newPanelName.trim() || createPanelMutation.isPending}
                                    className="bg-green-600 hover:bg-green-700"
                                    size="sm"
                                >
                                    Create Panel
                                </Button>
                                <Button 
                                    onClick={() => {
                                        setShowPanelForm(false);
                                        setNewPanelName("");
                                    }}
                                    variant="outline"
                                    size="sm"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {panels.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-gray-500">
                            <Folder className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p>No panels created yet. Create one to organize tests.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                        {panels.map(panel => {
                             const panelTests = savedTests.filter(t => t.panel_id === panel.id);
                             const tubeCount = calculatePanelTubes(panel.id, panel.panel_name);
                             const totalTubes = Object.values(tubeCount).reduce((a, b) => a + b, 0);
                            return (
                                <Card key={panel.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="text-lg">{panel.panel_name}</CardTitle>
                                                <p className="text-sm text-gray-600 mt-1">{panelTests.length} tests • {totalTubes} total tubes</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {Object.entries(tubeCount).length > 0 ? (
                                            <div>
                                                <p className="text-xs font-semibold text-gray-600 mb-2">Tube Breakdown:</p>
                                                <div className="space-y-1">
                                                    {Object.entries(tubeCount).map(([tube, count]) => (
                                                        <div key={tube} className="flex justify-between text-sm">
                                                            <span className="text-gray-700">{tube}</span>
                                                            <Badge variant="outline">{count}</Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500">No tests in this panel yet</p>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
            )}

            {/* Saved Tests */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Saved Tests ({savedTests.length})</h2>
                
                {isLoading ? (
                    <div className="text-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                    </div>
                ) : savedTests.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-gray-500">
                            <TestTube className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p>No saved tests yet. Search for tests above to get started.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {favoriteTests.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                    Favorites
                                </h3>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {favoriteTests.map(test => (
                                        <TestCard 
                                            key={test.id} 
                                            test={test} 
                                            onToggleFavorite={toggleFavoriteMutation.mutate}
                                            getTubeColor={getTubeColor}
                                            onSyncTube={handleSyncTube}
                                            syncing={syncTubeMutation.isPending}
                                            onDelete={deleteTestMutation.mutate}
                                            deleting={deleteTestMutation.isPending}
                                            panels={panels}
                                            onUpdatePanels={updateTestPanelsMutation.mutate}
                                            onGenerateICD10={generateICD10Mutation.mutate}
                                            generatingCodes={generateICD10Mutation.isPending}
                                  />
                                ))}
                                </div>
                            </div>
                        )}

                        {otherTests.length > 0 && (
                            <div>
                                {favoriteTests.length > 0 && (
                                    <h3 className="text-sm font-semibold text-gray-600 mb-2">All Tests</h3>
                                )}
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {otherTests.map(test => (
                                        <TestCard 
                                            key={test.id} 
                                            test={test} 
                                            onToggleFavorite={toggleFavoriteMutation.mutate}
                                            getTubeColor={getTubeColor}
                                            onSyncTube={handleSyncTube}
                                            syncing={syncTubeMutation.isPending}
                                            onDelete={deleteTestMutation.mutate}
                                            deleting={deleteTestMutation.isPending}
                                            panels={panels}
                                            onUpdatePanels={updateTestPanelsMutation.mutate}
                                            onGenerateICD10={generateICD10Mutation.mutate}
                                            generatingCodes={generateICD10Mutation.isPending}
                                  />
                                ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function TestCard({ test, onToggleFavorite, getTubeColor, onSyncTube, syncing, onDelete, deleting, panels, onUpdatePanels, onGenerateICD10, generatingCodes }) {
    const testPanelIds = (() => {
        try {
            const ids = typeof test.panel_ids === 'string' ? JSON.parse(test.panel_ids) : test.panel_ids;
            return Array.isArray(ids) ? ids : [];
        } catch {
            return [];
        }
    })();
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{test.test_name}</CardTitle>
                    <div className="flex items-center gap-2">
                        {test.quest_url && (
                            <button
                                onClick={() => onSyncTube?.(test.id)}
                                disabled={syncing}
                                className="text-gray-400 hover:text-blue-600"
                                title="Sync tube from Quest"
                            >
                                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                            </button>
                        )}
                        <button
                            onClick={() => onToggleFavorite({ id: test.id, isFavorite: test.is_favorite })}
                            className="text-gray-400 hover:text-yellow-500"
                            title={test.is_favorite ? 'Unfavorite' : 'Favorite'}
                        >
                            <Star className={`w-4 h-4 ${test.is_favorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                        </button>
                        <button
                            onClick={() => {
                                if (confirm(`Delete "${test.test_name}"?`)) {
                                    onDelete?.(test.id);
                                }
                            }}
                            disabled={deleting}
                            className="text-gray-400 hover:text-red-600"
                            title="Delete test"
                        >
                            <Trash2 className={`w-4 h-4 ${deleting ? 'opacity-50' : ''}`} />
                        </button>
                    </div>
                </div>
                {test.test_code && (
                    <Badge variant="outline" className="w-fit text-xs">
                        {test.test_code}
                    </Badge>
                )}
            </CardHeader>
            <CardContent className="space-y-3">
                <div>
                    <Badge className={getTubeColor(test.tube_type)}>
                        <TestTube className="w-3 h-3 mr-1" />
                        {test.tube_type}
                    </Badge>
                </div>
                {test.specimen_type && (
                    <div>
                        <p className="text-xs font-semibold text-gray-600">Specimen</p>
                        <p className="text-sm text-gray-800">{test.specimen_type}</p>
                    </div>
                )}
                {test.storage_requirements && (
                    <div>
                        <p className="text-xs font-semibold text-gray-600">Storage</p>
                        <p className="text-sm text-gray-800">{test.storage_requirements}</p>
                    </div>
                )}
                {test.quest_url && (
                    <a 
                        href={test.quest_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700"
                    >
                        View on Quest
                        <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                )}
                {testPanelIds.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {testPanelIds.map(panelId => {
                            const panel = panels.find(p => p.id === panelId);
                            return panel ? (
                                <Badge key={panelId} variant="outline" className="text-xs">
                                    {panel.panel_name}
                                </Badge>
                            ) : null;
                        })}
                    </div>
                )}
                {panels.length > 0 && (
                    <div>
                        <p className="text-xs font-semibold text-gray-600 mb-2">Panels</p>
                        <div className="space-y-1">
                            {panels.map(panel => (
                                <label key={panel.id} className="flex items-center gap-2 text-xs cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={testPanelIds.includes(panel.id)}
                                        onChange={(e) => {
                                            const newPanelIds = e.target.checked
                                                ? [...testPanelIds, panel.id]
                                                : testPanelIds.filter(id => id !== panel.id);
                                            onUpdatePanels?.({ testId: test.id, panelIds: newPanelIds });
                                        }}
                                        className="rounded"
                                    />
                                    <span className="text-gray-700">{panel.panel_name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-gray-600">Diagnosis Codes</p>
                        {!test.diagnosis_codes && (
                            <button
                                onClick={() => onGenerateICD10?.({ 
                                    testId: test.id,
                                    testName: test.test_name,
                                    testCode: test.test_code,
                                    category: test.category
                                })}
                                disabled={generatingCodes}
                                className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 flex items-center gap-1"
                                title="Generate top 5 ICD-10 codes"
                            >
                                <Sparkles className="w-3 h-3" />
                                Generate
                            </button>
                        )}
                    </div>
                    {test.diagnosis_codes ? (
                        <div className="flex flex-wrap gap-1">
                            {(() => {
                                try {
                                    const codes = typeof test.diagnosis_codes === 'string' 
                                        ? JSON.parse(test.diagnosis_codes) 
                                        : test.diagnosis_codes;
                                    return Array.isArray(codes) ? codes : [];
                                } catch {
                                    return [];
                                }
                            })().map((code) => (
                                <Badge key={code} className="bg-blue-100 text-blue-800 text-xs">
                                    {code}
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-500">Click Generate to create codes</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}