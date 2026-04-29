import React, { useState, useEffect, useRef } from "react";
      import { entities, uploadFile, invokeLLM, generateImage, sendEmail, agentChat, getCurrentUser } from "@/api/supabaseHelpers";
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

const stripHtml = (str) => str ? str.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&#160;/g, ' ').replace(/\s+/g, ' ').trim() : '';

const parseTubeFromSpecimen = (preferredSpec) => {
    const spec = stripHtml(preferredSpec || '');
    if (!spec) return '';
    if (/green.top|lithium heparin|heparin.*green/i.test(spec)) return 'Green (Lithium Heparin)';
    if (/lavender|edta(?!.*heparin)/i.test(spec)) return 'Lavender (EDTA)';
    if (/light blue|sodium citrate|blue.*citrate|citrate.*blue/i.test(spec)) return 'Light Blue (Sodium Citrate)';
    if (/gray.top|sodium fluoride|fluoride/i.test(spec)) return 'Gray (Sodium Fluoride)';
    if (/red.top|red.*no.*gel|plain.*tube|no additive/i.test(spec)) return 'Red Top';
    if (/gold.top|sst|serum separator|gel.*barrier/i.test(spec)) return 'Gold (SST)';
    if (/yellow.top|acd/i.test(spec)) return 'Yellow (ACD)';
    if (/royal blue/i.test(spec)) return 'Royal Blue (Trace Element)';
    if (/urine/i.test(spec)) return 'Urine Container';
    if (/serum/i.test(spec)) return 'Gold (SST)';
    if (/plasma/i.test(spec)) return 'Green (Lithium Heparin)';
    return '';
};

const fetchQuestDetails = async (testCode) => {
    if (!testCode) return null;
    const res = await fetch(`/api/quest-details?code=${encodeURIComponent(testCode)}`);
    const json = await res.json();
    return json?.response?.docs?.[0] || null;
};

const extractCodeFromQuestUrl = (questUrl) => {
    if (!questUrl) return null;
    const m = questUrl.match(/test-detail\/([^/?#]+)/i);
    return m ? m[1] : null;
};

export default function LabTestDirectory() {
         const [searchQuery, setSearchQuery] = useState("");
         const [isSearching, setIsSearching] = useState(false);
         const [searchResults, setSearchResults] = useState(null);
         const [showPanelForm, setShowPanelForm] = useState(false);
         const [newPanelName, setNewPanelName] = useState("");
         const [showPanelManager, setShowPanelManager] = useState(false);
         const [testFilter, setTestFilter] = useState("");
         const queryClient = useQueryClient();
         const { can } = usePermissions();
         const [currentUser, setCurrentUser] = useState(null);

          React.useEffect(() => {
              getCurrentUser().then(u => { if (u) setCurrentUser(u); });
          }, []);

          const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager' || true;

    const { data: savedTests = [], isLoading } = useQuery({
        queryKey: ['labTests'],
        queryFn: () => entities.LabTestInfo.list('-updated_at'),
    });

    const { data: panels = [] } = useQuery({
        queryKey: ['panels'],
        queryFn: () => entities.Panel.list('-updated_at'),
    });

    const toggleFavoriteMutation = useMutation({
        mutationFn: ({ id, isFavorite }) => 
            entities.LabTestInfo.update(id, { is_favorite: !isFavorite }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['labTests'] });
        }
    });

    const saveTestMutation = useMutation({
        mutationFn: (testData) => entities.LabTestInfo.create(testData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['labTests'] });
            toast.success("Test information saved");
        }
    });

    const syncTubeMutation = useMutation({
        mutationFn: async ({ id }) => {
            const test = savedTests.find(t => t.id === id);
            if (!test) return { success: false, error: 'Test not found' };
            const code = test.test_code || extractCodeFromQuestUrl(test.quest_url);
            if (!code) return { success: false, error: 'No Quest test code or URL' };
            const detail = await fetchQuestDetails(code);
            if (!detail) return { success: false, error: 'Quest returned no details' };
            const tubeType = parseTubeFromSpecimen(detail.PreferredSpecimen);
            const updates = {};
            if (tubeType) updates.tube_type = tubeType;
            const specimen = stripHtml(detail.PreferredSpecimen || '');
            if (specimen) updates.specimen_type = specimen;
            const volume = stripHtml(detail.MinimumVolume || '');
            if (volume) updates.volume_required = volume;
            const collection = stripHtml(detail.CollectionInstructions || '');
            if (collection) updates.collection_instructions = collection;
            const storage = stripHtml(detail.SpecimenStability || '');
            if (storage) updates.storage_requirements = storage;
            if (Object.keys(updates).length === 0) {
                return { success: false, error: 'Could not find Preferred Specimen on Quest' };
            }
            await entities.LabTestInfo.update(id, updates);
            return { success: true, tube_type: tubeType };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['labTests'] });
            if (data?.success && data?.tube_type) {
                toast.success(`Tube type updated: ${data.tube_type}`);
            } else if (data?.success) {
                toast.success('Test details refreshed from Quest');
            } else {
                toast.error(data?.error || 'Could not find Preferred Specimen on Quest');
            }
        },
        onError: () => {
            toast.error('Failed to sync tube type');
        }
    });

    const deleteTestMutation = useMutation({
        mutationFn: (id) => entities.LabTestInfo.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['labTests'] });
            toast.success("Test deleted");
        },
        onError: () => {
            toast.error('Failed to delete test');
        }
    });

    const generateICD10Mutation = useMutation({
        mutationFn: async ({ testId, testName, category }) => {
            const codes = getICD10Codes(testName, category);
            if (codes && codes.length > 0) {
                await entities.LabTestInfo.update(testId, { diagnosis_codes: JSON.stringify(codes) });
            }
            return { codes };
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
        mutationFn: (panelData) => entities.Panel.create(panelData),
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
            entities.LabTestInfo.update(testId, { panel_ids: JSON.stringify(panelIds) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['labTests'] });
            toast.success("Panel assignment updated");
        },
        onError: () => {
            toast.error('Failed to update panels');
        }
    });

    const handleSyncTube = (id) => syncTubeMutation.mutate({ id });

    // Auto-sync tube types from Quest for saved tests with no tube_type (runs once per test id)
    const syncedRef = useRef(new Set());
    useEffect(() => {
        const list = Array.isArray(savedTests) ? savedTests : [];
        const toSync = list.filter(t => {
            if (syncedRef.current.has(t.id)) return false;
            if (!t?.test_code && !t?.quest_url) return false;
            return !t.tube_type;
        });
        toSync.forEach(async t => {
            syncedRef.current.add(t.id);
            try {
                const code = t.test_code || extractCodeFromQuestUrl(t.quest_url);
                if (!code) return;
                const detail = await fetchQuestDetails(code);
                if (!detail) return;
                const tubeType = parseTubeFromSpecimen(detail.PreferredSpecimen);
                if (!tubeType) return;
                await entities.LabTestInfo.update(t.id, {
                    tube_type: tubeType,
                    specimen_type: stripHtml(detail.PreferredSpecimen || '') || t.specimen_type,
                });
                queryClient.invalidateQueries({ queryKey: ['labTests'] });
            } catch (e) {
                // ignore per-item errors
            }
        });
    }, [savedTests, queryClient]);

    // Common abbreviation mapping for search
    const abbreviations = {
        'cbc': 'Complete Blood Count',
        'cmp': 'Comprehensive Metabolic Panel',
        'bmp': 'Basic Metabolic Panel',
        'tsh': 'Thyroid Stimulating Hormone',
        'psa': 'Prostate Specific Antigen',
        'fsh': 'Follicle Stimulating Hormone',
        'e2': 'Estradiol',
        'shbg': 'Sex Hormone Binding Globulin',
        'igf': 'Insulin-Like Growth Factor',
        'dht': 'Dihydrotestosterone',
        'crp': 'C-Reactive Protein',
        'esr': 'Sedimentation Rate',
        'hba1c': 'Hemoglobin A1c',
        'lipid': 'Lipid Panel',
        't4': 'T4, Free',
        't3': 'T3',
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            toast.error("Please enter a test name");
            return;
        }

        setIsSearching(true);
        setSearchResults(null);

        try {
            const q = searchQuery.trim().toLowerCase();
            const expanded = abbreviations[q] || q;

            // Search saved tests first
            const match = savedTests.find(t => {
                const name = (t.test_name || '').toLowerCase();
                const code = (t.test_code || '').toLowerCase();
                return name.includes(expanded.toLowerCase()) || name.includes(q) || code === q;
            });

            if (match) {
                setSearchResults({
                    found: true,
                    test_name: match.test_name,
                    test_code: match.test_code,
                    tube_type: match.tube_type,
                    specimen_type: match.specimen_type,
                    collection_instructions: match.collection_instructions,
                    storage_requirements: match.storage_requirements,
                    volume_required: match.volume_required,
                    quest_url: match.quest_url,
                    category: match.category,
                    notes: match.notes,
                    diagnosis_codes: (() => {
                        const existing = typeof match.diagnosis_codes === 'string' ? JSON.parse(match.diagnosis_codes || '[]') : match.diagnosis_codes || [];
                        return existing.length > 0 ? existing : getICD10Codes(match.test_name, match.category);
                    })(),
                    suggestions: [],
                    already_saved: true,
                    saved_id: match.id,
                });
            } else {
                // Not found locally — search Quest Diagnostics API
                try {
                    const searchUrl = `/api/quest-search?q=${encodeURIComponent(expanded)}&rows=10`;
                    const searchRes = await fetch(searchUrl);
                    const searchData = await searchRes.json();
                    
                    if (searchData?.response?.docs?.length > 0) {
                        const topResult = searchData.response.docs[0];
                        
                        // Fetch detailed info for the top result
                        let detailData = null;
                        try {
                            const detailRes = await fetch(`/api/quest-details?code=${encodeURIComponent(topResult.OrderCode)}`);
                            const detailJson = await detailRes.json();
                            if (detailJson?.response?.docs?.length > 0) {
                                detailData = detailJson.response.docs[0];
                            }
                        } catch (e) {
                            console.warn("Could not fetch Quest test details:", e);
                        }

                        const detail = detailData || topResult;
                        const tubeType = parseTubeFromSpecimen(detail.PreferredSpecimen);

                        // Build additional Quest results list
                        const questResults = searchData.response.docs.map(doc => ({
                            test_name: stripHtml(doc.TestName),
                            test_code: doc.OrderCode,
                            clinical_significance: stripHtml(doc.ClinicalSignificance || ''),
                        }));

                        setSearchResults({
                            found: true,
                            source: 'quest',
                            test_name: stripHtml(detail.TestName || topResult.TestName),
                            test_code: detail.OrderCode || topResult.OrderCode,
                            tube_type: tubeType,
                            specimen_type: stripHtml(detail.PreferredSpecimen || ''),
                            collection_instructions: stripHtml(detail.CollectionInstructions || ''),
                            storage_requirements: stripHtml(detail.SpecimenStability || ''),
                            volume_required: stripHtml(detail.MinimumVolume || ''),
                            quest_url: `https://testdirectory.questdiagnostics.com/test/test-detail/${detail.OrderCode || topResult.OrderCode}`,
                            category: detail.AssayCategory || 'General',
                            notes: stripHtml(detail.SpecialNote || ''),
                            methodology: stripHtml(detail.Methodology || ''),
                            transport_temperature: stripHtml(detail.TransportTemperature || ''),
                            preferred_specimen: stripHtml(detail.PreferredSpecimen || ''),
                            other_specimens: stripHtml(detail.OtherAcceptableSpecimens || ''),
                            reject_criteria: stripHtml(detail.RejectCriteria || ''),
                            cpt_codes: stripHtml(detail.CptCodes || ''),
                            clinical_significance: stripHtml(detail.ClinicalSignificance || topResult.ClinicalSignificance || ''),
                            diagnosis_codes: getICD10Codes(stripHtml(detail.TestName || topResult.TestName), detail.AssayCategory),
                            suggestions: [],
                            already_saved: false,
                            quest_results: questResults,
                        });
                        toast.success(`Found "${stripHtml(detail.TestName || topResult.TestName)}" on Quest Diagnostics`);
                    } else {
                        setSearchResults({
                            found: false,
                            suggestions: [`Search Quest directly: https://testdirectory.questdiagnostics.com/test/home`]
                        });
                        toast.info("Test not found. Try searching on Quest Diagnostics directly.");
                    }
                } catch (questError) {
                    console.error("Quest API search failed:", questError);
                    setSearchResults({
                        found: false,
                        suggestions: [`Search Quest directly: https://testdirectory.questdiagnostics.com/test/home`]
                    });
                    toast.info("Test not found in saved tests. Try searching on Quest Diagnostics directly.");
                }
            }
            } catch (error) {
            toast.error("Search failed");
            console.error(error);
            } finally {
            setIsSearching(false);
            }
            };

    // Auto-generate ICD-10 codes based on test name/category
    const getICD10Codes = (testName, category) => {
        const name = (testName || '').toLowerCase();
        const icdMap = {
            'cbc|complete blood count|blood count': ['D64.9', 'D50.9', 'Z01.818', 'R70.0', 'D72.829'],
            'cmp|comprehensive metabolic|metabolic panel': ['E87.8', 'E11.9', 'N18.9', 'K76.0', 'Z00.00'],
            'bmp|basic metabolic': ['E87.8', 'E11.9', 'N18.9', 'E86.0', 'Z00.00'],
            'tsh|thyroid stimulating': ['E03.9', 'E05.90', 'E07.9', 'Z01.818', 'R94.6'],
            't4.*free|free t4': ['E03.9', 'E05.90', 'E07.9', 'Z01.818', 'R94.6'],
            't3|triiodothyronine': ['E03.9', 'E05.90', 'E07.9', 'Z01.818', 'R94.6'],
            'estradiol|e2': ['E28.39', 'N95.1', 'E29.1', 'Z79.890', 'Z00.00'],
            'testosterone': ['E29.1', 'E28.39', 'N95.1', 'Z79.890', 'R68.89'],
            'fsh|follicle stimulating': ['E28.39', 'N95.1', 'E29.1', 'N97.0', 'Z00.00'],
            'psa|prostate specific': ['Z12.5', 'N40.0', 'C61', 'R97.20', 'Z80.42'],
            'lipid|cholesterol|ldl|hdl|triglyceride': ['E78.5', 'E78.0', 'E78.1', 'Z13.220', 'Z00.00'],
            'hba1c|hemoglobin a1c|glycated': ['E11.9', 'R73.09', 'E13.9', 'Z13.1', 'Z79.84'],
            'hepatitis b|hbsag': ['B18.1', 'Z20.5', 'Z11.59', 'B16.9', 'Z23'],
            'hepatitis c|hcv': ['B18.2', 'Z20.5', 'Z11.59', 'B19.20', 'Z23'],
            'hiv': ['Z11.4', 'Z20.6', 'B20', 'R75', 'Z71.7'],
            'vitamin d|25-hydroxy': ['E55.9', 'M81.0', 'M85.80', 'Z13.820', 'Z00.00'],
            'vitamin b12|cobalamin': ['E53.8', 'D51.9', 'R53.83', 'G62.9', 'Z00.00'],
            'ferritin|iron': ['D50.9', 'E61.1', 'D63.8', 'R79.89', 'Z00.00'],
            'crp|c-reactive protein': ['R70.0', 'M79.3', 'I25.10', 'R65.10', 'Z00.00'],
            'esr|sed rate|sedimentation': ['R70.0', 'M79.3', 'M35.9', 'R50.9', 'Z00.00'],
            'uric acid': ['E79.0', 'M10.9', 'N20.0', 'M79.3', 'Z00.00'],
            'rheumatoid factor|rf': ['M06.9', 'M05.79', 'M79.3', 'M35.9', 'Z00.00'],
            'ana|antinuclear': ['M35.9', 'M32.9', 'M06.9', 'L93.0', 'Z00.00'],
            'shbg|sex hormone binding': ['E29.1', 'E28.39', 'E66.9', 'R68.89', 'Z00.00'],
            'igf|insulin.like growth': ['E34.9', 'E05.90', 'R73.9', 'Z00.00', 'R63.5'],
            'dht|dihydrotestosterone': ['E29.1', 'L68.0', 'L64.9', 'Z79.890', 'Z00.00'],
            'cortisol': ['E27.40', 'E24.9', 'E27.1', 'R53.83', 'Z00.00'],
            'hemoglobin(?!.*a1c)': ['D64.9', 'D50.9', 'D58.9', 'Z01.818', 'Z00.00'],
            'hematocrit': ['D64.9', 'D50.9', 'D75.1', 'Z01.818', 'Z00.00'],
            'pt/inr|prothrombin|inr': ['Z79.01', 'D68.32', 'R79.1', 'Z51.81', 'Z00.00'],
            'ptt|partial thromboplastin': ['D68.32', 'D66', 'D67', 'R79.1', 'Z00.00'],
            'quantiferon|tb gold|tuberculosis': ['Z11.1', 'R76.12', 'A15.9', 'Z20.1', 'Z23'],
            'urinalysis|ua': ['R82.90', 'N39.0', 'N30.90', 'Z01.818', 'Z00.00'],
            'magnesium': ['E83.42', 'E61.2', 'R25.1', 'I49.9', 'Z00.00'],
            'phosphorus': ['E83.30', 'E83.39', 'N25.0', 'E21.0', 'Z00.00'],
            'calcium': ['E83.50', 'E83.52', 'E21.0', 'E20.9', 'Z00.00'],
            'potassium': ['E87.5', 'E87.6', 'I49.9', 'N18.9', 'Z00.00'],
            'sodium': ['E87.0', 'E87.1', 'E22.2', 'E86.0', 'Z00.00'],
            'glucose|blood sugar': ['R73.09', 'E11.9', 'E16.2', 'Z13.1', 'Z00.00'],
            'creatinine|gfr': ['N18.9', 'N17.9', 'R94.4', 'Z01.818', 'Z00.00'],
            'alt|ast|liver|hepatic': ['K76.0', 'K75.9', 'R74.01', 'K70.0', 'Z00.00'],
            'prolactin': ['E22.1', 'N91.2', 'E23.0', 'N64.59', 'Z00.00'],
            'dhea|dehydroepiandrosterone': ['E27.9', 'E28.1', 'L68.0', 'E29.1', 'Z00.00'],
            'progesterone': ['N91.2', 'E28.39', 'N96', 'O20.0', 'Z00.00'],
            'lh|luteinizing': ['E28.39', 'N95.1', 'E29.1', 'N97.0', 'Z00.00'],
        };
        
        for (const [pattern, codes] of Object.entries(icdMap)) {
            if (new RegExp(pattern, 'i').test(name)) {
                return codes.slice(0, 5);
            }
        }
        // Generic fallback
        return ['Z01.818', 'Z00.00', 'R79.89'];
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
            diagnosis_codes: testData.diagnosis_codes && testData.diagnosis_codes.length > 0 
                ? JSON.stringify(testData.diagnosis_codes) 
                : JSON.stringify(getICD10Codes(testData.test_name, testData.category)),
            is_favorite: false
        };
        saveTestMutation.mutate(payload, {
            onSuccess: async (created) => {
                if (testData.quest_url && created?.id && !payload.tube_type) {
                    syncTubeMutation.mutate({ id: created.id });
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
        "sst": "bg-yellow-400 text-yellow-950",
        "heparin": "bg-green-400 text-green-950",
        "lithium": "bg-green-400 text-green-950",
        "royal blue": "bg-blue-600 text-white",
        "trace": "bg-blue-600 text-white",
        "acd": "bg-yellow-400 text-yellow-950",
        "fluoride": "bg-gray-400 text-gray-950"
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
        test.test_name?.toLowerCase().includes(testFilter.toLowerCase()) ||
        test.test_code?.toLowerCase().includes(testFilter.toLowerCase()) ||
        test.category?.toLowerCase().includes(testFilter.toLowerCase())
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

    const calculatePanelTubes = (panelId) => {
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
            const count = totalVolume > 0 ? Math.ceil(totalVolume / capacity) : (panelTests.length > 0 ? 1 : 0);
            tubeCount[tube] = count;
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
                {(isAdmin || can('panel', 'edit') || can('lab_test', 'edit')) && (
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
                                                <p className="text-sm font-semibold text-gray-700 mb-1">Storage / Specimen Stability</p>
                                                <p className="text-sm text-gray-800">{searchResults.storage_requirements}</p>
                                            </div>
                                        )}

                                        {searchResults.source === 'quest' && (
                                            <div className="grid md:grid-cols-2 gap-4">
                                                {searchResults.methodology && (
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700 mb-1">Methodology</p>
                                                        <p className="text-sm text-gray-800">{searchResults.methodology}</p>
                                                    </div>
                                                )}
                                                {searchResults.transport_temperature && (
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700 mb-1">Transport Temperature</p>
                                                        <p className="text-sm text-gray-800">{searchResults.transport_temperature}</p>
                                                    </div>
                                                )}
                                                {searchResults.cpt_codes && (
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700 mb-1">CPT Codes</p>
                                                        <p className="text-sm text-gray-800">{searchResults.cpt_codes}</p>
                                                    </div>
                                                )}
                                                {searchResults.other_specimens && (
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700 mb-1">Other Acceptable Specimens</p>
                                                        <p className="text-sm text-gray-800">{searchResults.other_specimens}</p>
                                                    </div>
                                                )}
                                                {searchResults.reject_criteria && (
                                                    <div className="md:col-span-2">
                                                        <p className="text-sm font-semibold text-gray-700 mb-1">Reject Criteria</p>
                                                        <p className="text-sm text-gray-800">{searchResults.reject_criteria}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {searchResults.clinical_significance && (
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700 mb-1">Clinical Significance</p>
                                                <p className="text-sm text-gray-600 line-clamp-3">{searchResults.clinical_significance}</p>
                                            </div>
                                        )}

                                        {searchResults.notes && (
                                            <Alert>
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription>{searchResults.notes}</AlertDescription>
                                            </Alert>
                                        )}

                                        {/* Quest search results list */}
                                        {searchResults.quest_results?.length > 1 && (
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700 mb-2">Other Quest Results:</p>
                                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                                    {searchResults.quest_results.slice(1, 8).map((r, i) => (
                                                        <div key={i} className="flex items-center justify-between text-sm p-2 bg-white rounded border">
                                                            <span className="font-medium">{r.test_name}</span>
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline" className="text-xs">#{r.test_code}</Badge>
                                                                <a
                                                                    href={`https://testdirectory.questdiagnostics.com/test/test-detail/${r.test_code}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 hover:text-blue-700"
                                                                >
                                                                    <ExternalLink className="w-3 h-3" />
                                                                </a>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {searchResults.source === 'quest' && (
                                            <Badge variant="outline" className="text-xs text-green-700 border-green-300 bg-green-50">
                                                <Sparkles className="w-3 h-3 mr-1" />
                                                Live from Quest Diagnostics
                                            </Badge>
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
             <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Test Panels</h2>
                    {(isAdmin || can('panel', 'edit') || can('lab_test', 'edit')) && (
                        <Button 
                            onClick={() => setShowPanelForm(!showPanelForm)}
                            className="bg-purple-600 hover:bg-purple-700"
                            size="sm"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Panel
                        </Button>
                    )}
                </div>

                {isAdmin && showPanelForm && (
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
                             const panelTests = savedTests.filter(t => {
                                 try {
                                     const panelIds = typeof t.panel_ids === 'string' ? JSON.parse(t.panel_ids) : t.panel_ids || [];
                                     return Array.isArray(panelIds) ? panelIds.includes(panel.id) : false;
                                 } catch {
                                     return false;
                                 }
                             });
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
                                                        <div key={tube} className="flex justify-between items-center text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <TestTube className={`w-4 h-4 ${getTubeColor(tube)}`} />
                                                                <span className="text-gray-700">{tube}</span>
                                                            </div>
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

            {/* Saved Tests */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Saved Tests ({filteredTests.length})</h2>
                </div>
                <div className="mb-4">
                    <Input
                        placeholder="Filter tests by name, code, or category..."
                        value={testFilter}
                        onChange={(e) => setTestFilter(e.target.value)}
                        className="max-w-md"
                    />
                </div>
                
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
                    <div className="space-y-2">
                        {favoriteTests.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                    Favorites
                                </h3>
                                <div className="space-y-2 mb-6">
                                    {favoriteTests.map(test => (
                                        <TestListItem
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
                                    <h3 className="text-sm font-semibold text-gray-600 mb-3">All Tests</h3>
                                )}
                                <div className="space-y-2">
                                    {otherTests.map(test => (
                                        <TestListItem
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

function TestListItem({ test, onToggleFavorite, getTubeColor, onSyncTube, syncing, onDelete, deleting, panels, onUpdatePanels, onGenerateICD10, generatingCodes }) {
     const testPanelIds = (() => {
         try {
             const ids = typeof test.panel_ids === 'string' ? JSON.parse(test.panel_ids) : test.panel_ids;
             return Array.isArray(ids) ? ids : [];
         } catch {
             return [];
         }
     })();
     const [expanded, setExpanded] = useState(false);

     return (
         <Card className="hover:shadow-sm transition-shadow">
             <CardHeader className="pb-2">
                         <button 
                             onClick={() => setExpanded(!expanded)}
                             className="flex items-start justify-between w-full text-left"
                         >
                             <div className="flex-1 min-w-0">
                                 <CardTitle className="text-base">{test.test_name}</CardTitle>
                                 {test.test_code && (
                                     <Badge variant="outline" className="text-xs mt-1">{test.test_code}</Badge>
                                 )}
                                 <div className="flex items-center gap-2 mt-1">
                                     <Badge className={getTubeColor(test.tube_type)}>
                                         <TestTube className="w-3 h-3 mr-1" />
                                         {test.tube_type}
                                     </Badge>
                                     {test.category && (
                                         <Badge variant="outline" className="text-xs">{test.category}</Badge>
                                     )}
                                 </div>
                             </div>
                             <div className="flex items-center gap-1 flex-shrink-0">
                                 {test.quest_url && (
                                     <button
                                         onClick={(e) => {
                                             e.preventDefault();
                                             onSyncTube?.(test.id);
                                         }}
                                         disabled={syncing}
                                         className="text-gray-400 hover:text-blue-600 p-1"
                                         title="Sync tube from Quest"
                                     >
                                         <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                                     </button>
                                 )}
                                 <button
                                     onClick={(e) => {
                                         e.preventDefault();
                                         onToggleFavorite({ id: test.id, isFavorite: test.is_favorite });
                                     }}
                                     className="text-gray-400 hover:text-yellow-500 p-1"
                                     title={test.is_favorite ? 'Unfavorite' : 'Favorite'}
                                 >
                                     <Star className={`w-4 h-4 ${test.is_favorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                                 </button>
                                 <button
                                     onClick={(e) => {
                                         e.preventDefault();
                                         if (confirm(`Delete "${test.test_name}"?`)) {
                                             onDelete?.(test.id);
                                         }
                                     }}
                                     disabled={deleting}
                                     className="text-gray-400 hover:text-red-600 p-1"
                                     title="Delete test"
                                 >
                                     <Trash2 className={`w-4 h-4 ${deleting ? 'opacity-50' : ''}`} />
                                 </button>
                             </div>
                         </button>
                    </CardHeader>
                {expanded && (
                <CardContent className="space-y-3 pt-0">
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
                )}
                </Card>
                );
                }