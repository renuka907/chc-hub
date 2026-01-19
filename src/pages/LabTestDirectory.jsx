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
      import { Search, Loader2, TestTube, Star, ExternalLink, Plus, AlertCircle, RefreshCw, Trash2, Folder, Minus, Settings } from "lucide-react";
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

    const assignTestToPanelMutation = useMutation({
        mutationFn: ({ testId, panelId }) => 
            base44.entities.LabTestInfo.update(testId, { panel_id: panelId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['labTests'] });
            toast.success("Test assigned to panel");
        },
        onError: () => {
            toast.error('Failed to assign test');
        }
    });

    const removeTestFromPanelMutation = useMutation({
        mutationFn: (testId) => 
            base44.entities.LabTestInfo.update(testId, { panel_id: null }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['labTests'] });
            toast.success("Test removed from panel");
        },
        onError: () => {
            toast.error('Failed to remove test');
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

    const calculatePanelTubes = (panelId) => {
        const panelTests = savedTests.filter(t => t.panel_id === panelId);
        const tubeCount = {};
        panelTests.forEach(test => {
            const tube = test.tube_type || 'Unknown';
            tubeCount[tube] = (tubeCount[tube] || 0) + 1;
        });
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
                            const tubeCount = calculatePanelTubes(panel.id);
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
                                            onRemoveFromPanel={removeTestFromPanelMutation.mutate}
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
                                            onRemoveFromPanel={removeTestFromPanelMutation.mutate}
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

function TestCard({ test, onToggleFavorite, getTubeColor, onSyncTube, syncing, onDelete, deleting, panels, onAssignToPanel, onRemoveFromPanel }) {
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
                {test.panel_id && (
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                            {panels.find(p => p.id === test.panel_id)?.panel_name}
                        </Badge>
                        {onRemoveFromPanel && (
                            <button
                                onClick={() => onRemoveFromPanel?.(test.id)}
                                className="text-gray-400 hover:text-red-600"
                                title="Remove from panel"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                )}
                {test.diagnosis_codes && (
                    <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Diagnosis Codes</p>
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
                    </div>
                )}
            </CardContent>
        </Card>
    );
}