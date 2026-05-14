import React, { useState, useMemo } from "react";
import { entities, getCurrentUser } from "@/api/supabaseHelpers";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    FlaskConical, Search, Plus, Pencil, Trash2, CheckCircle2, AlertCircle,
    Beaker, Calendar, X, ChevronDown, ChevronUp, ExternalLink,
} from "lucide-react";

const LAB_COLORS = {
    "LabCorp": "bg-red-100 text-red-800 border-red-200",
    "Quest": "bg-blue-100 text-blue-800 border-blue-200",
    "Both": "bg-green-100 text-green-800 border-green-200",
    "Other": "bg-gray-100 text-gray-800 border-gray-200",
};

const FREQ_COLORS = {
    "Annual": "bg-blue-100 text-blue-700",
    "Every 2 years": "bg-purple-100 text-purple-700",
    "Every 3 years": "bg-indigo-100 text-indigo-700",
    "Every 5 years (screening)": "bg-pink-100 text-pink-700",
    "Every 5 years": "bg-pink-100 text-pink-700",
    "Every 10 years": "bg-rose-100 text-rose-700",
    "One-time (universal screening)": "bg-orange-100 text-orange-700",
    "As medically necessary": "bg-amber-100 text-amber-700",
    "Only with diagnosis": "bg-yellow-100 text-yellow-800",
};

export default function LabNetworkLookup() {
    const [tab, setTab] = useState("lookup"); // 'lookup' | 'tests' | 'plans'
    const [carrierQuery, setCarrierQuery] = useState("");
    const [planTypeFilter, setPlanTypeFilter] = useState("all");
    const [testQuery, setTestQuery] = useState("");
    const [carrierFilter, setCarrierFilter] = useState("all");
    const [currentUser, setCurrentUser] = useState(null);
    const [planForm, setPlanForm] = useState(null);     // null | {id?, ...}
    const [testForm, setTestForm] = useState(null);
    const [deletePlan, setDeletePlan] = useState(null);
    const [deleteTest, setDeleteTest] = useState(null);
    const [expandedPlanId, setExpandedPlanId] = useState(null);
    const [expandedTestId, setExpandedTestId] = useState(null);
    const queryClient = useQueryClient();

    React.useEffect(() => { getCurrentUser().then(u => { if (u) setCurrentUser(u); }); }, []);
    const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'manager';

    const { data: plans = [], isLoading: loadingPlans } = useQuery({
        queryKey: ['insuranceLabNetworks'],
        queryFn: () => entities.InsuranceLabNetwork.list('carrier', 500),
    });

    const { data: tests = [], isLoading: loadingTests } = useQuery({
        queryKey: ['labTestFrequencies'],
        queryFn: () => entities.LabTestFrequency.list('test_name', 500),
    });

    const carriers = useMemo(() => {
        const set = new Set();
        plans.forEach(p => p.carrier && set.add(p.carrier));
        tests.forEach(t => t.carrier && set.add(t.carrier));
        return Array.from(set).sort();
    }, [plans, tests]);

    const planTypes = useMemo(() => {
        const set = new Set();
        plans.forEach(p => p.plan_type && set.add(p.plan_type));
        return Array.from(set).sort();
    }, [plans]);

    // -------- Lookup tab: filter plans by carrier search + plan type --------
    const matchedPlans = useMemo(() => {
        const q = carrierQuery.trim().toLowerCase();
        if (!q && planTypeFilter === "all") return [];
        return plans.filter(p => {
            if (p.status === 'inactive') return false;
            if (q && !p.carrier.toLowerCase().includes(q)) return false;
            if (planTypeFilter !== "all" && p.plan_type !== planTypeFilter) return false;
            return true;
        });
    }, [plans, carrierQuery, planTypeFilter]);

    // -------- Tests tab filter --------
    const filteredTests = useMemo(() => {
        const q = testQuery.trim().toLowerCase();
        return tests.filter(t => {
            if (t.status === 'inactive') return false;
            if (q && !t.test_name.toLowerCase().includes(q) && !(t.test_codes || '').toLowerCase().includes(q)) return false;
            if (carrierFilter !== "all" && t.carrier !== carrierFilter) return false;
            return true;
        });
    }, [tests, testQuery, carrierFilter]);

    // -------- Plans tab filter --------
    const filteredPlans = useMemo(() => {
        const q = carrierQuery.trim().toLowerCase();
        return plans.filter(p => {
            if (q && !p.carrier.toLowerCase().includes(q) && !(p.plan_type || '').toLowerCase().includes(q)) return false;
            if (planTypeFilter !== "all" && p.plan_type !== planTypeFilter) return false;
            return true;
        });
    }, [plans, carrierQuery, planTypeFilter]);

    // -------- Mutations --------
    const savePlan = useMutation({
        mutationFn: async (data) => {
            const payload = { ...data, last_verified: data.last_verified || new Date().toISOString().slice(0, 10) };
            if (data.id) {
                const { id, ...updates } = payload;
                return entities.InsuranceLabNetwork.update(id, updates);
            }
            return entities.InsuranceLabNetwork.create(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['insuranceLabNetworks'] });
            setPlanForm(null);
        },
    });

    const removePlan = useMutation({
        mutationFn: (id) => entities.InsuranceLabNetwork.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['insuranceLabNetworks'] });
            setDeletePlan(null);
        },
    });

    const saveTest = useMutation({
        mutationFn: async (data) => {
            const payload = { ...data, last_verified: data.last_verified || new Date().toISOString().slice(0, 10) };
            // coerce numeric fields
            ['interval_months', 'age_min', 'age_max'].forEach(k => {
                if (payload[k] === '' || payload[k] == null) payload[k] = null;
                else payload[k] = Number(payload[k]);
            });
            if (data.id) {
                const { id, ...updates } = payload;
                return entities.LabTestFrequency.update(id, updates);
            }
            return entities.LabTestFrequency.create(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['labTestFrequencies'] });
            setTestForm(null);
        },
    });

    const removeTest = useMutation({
        mutationFn: (id) => entities.LabTestFrequency.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['labTestFrequencies'] });
            setDeleteTest(null);
        },
    });

    return (
        <div className="max-w-5xl mx-auto space-y-5 p-5">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-md">
                    <FlaskConical className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Lab Network &amp; Coverage Lookup</h1>
                    <p className="text-xs text-gray-500">Find the in-network lab for any insurance + check test frequency rules</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-200">
                <TabButton active={tab === 'lookup'} onClick={() => setTab('lookup')} icon={Search}>Quick Lookup</TabButton>
                <TabButton active={tab === 'tests'} onClick={() => setTab('tests')} icon={Beaker}>Test Frequencies</TabButton>
                <TabButton active={tab === 'plans'} onClick={() => setTab('plans')} icon={FlaskConical}>Manage Plans</TabButton>
            </div>

            {/* QUICK LOOKUP TAB */}
            {tab === 'lookup' && (
                <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                        <Label className="text-sm font-semibold">Enter patient's insurance</Label>
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Type carrier name (e.g. Aetna, Florida Blue, UHC)"
                                    value={carrierQuery}
                                    onChange={(e) => setCarrierQuery(e.target.value)}
                                    className="pl-9"
                                    autoFocus
                                />
                            </div>
                            <select
                                value={planTypeFilter}
                                onChange={(e) => setPlanTypeFilter(e.target.value)}
                                className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white md:w-48"
                            >
                                <option value="all">Any plan type</option>
                                {planTypes.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                            </select>
                        </div>
                        {carrierQuery.trim() === "" && planTypeFilter === "all" && (
                            <p className="text-xs text-gray-500">💡 Tip: Start typing the carrier to see in-network lab recommendations.</p>
                        )}
                    </div>

                    {matchedPlans.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-600">{matchedPlans.length} match{matchedPlans.length === 1 ? '' : 'es'}</p>
                            {matchedPlans.map(p => <LookupResultCard key={p.id} plan={p} />)}
                        </div>
                    )}

                    {(carrierQuery.trim() !== "" || planTypeFilter !== "all") && matchedPlans.length === 0 && !loadingPlans && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-semibold text-amber-900">No match in the database yet</p>
                                <p className="text-amber-800 mt-1">
                                    Verify directly with the payer or check{' '}
                                    <a href="https://www.labcorp.com/insurance-coverage" target="_blank" rel="noopener noreferrer" className="underline">
                                        LabCorp insurance coverage tool
                                    </a>{' '}/{' '}
                                    <a href="https://www.questdiagnostics.com/our-company/patients/billing/insurance" target="_blank" rel="noopener noreferrer" className="underline">
                                        Quest insurance lookup
                                    </a>.
                                </p>
                                {canEdit && (
                                    <Button size="sm" variant="outline" className="mt-2" onClick={() => setPlanForm({ carrier: carrierQuery, state: 'FL', preferred_lab: 'LabCorp', status: 'active' })}>
                                        <Plus className="w-3.5 h-3.5 mr-1" /> Add this plan to the database
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TEST FREQUENCIES TAB */}
            {tab === 'tests' && (
                <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search test name or CPT code (e.g. Lipid, HbA1c, 80061)"
                                value={testQuery}
                                onChange={(e) => setTestQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <select
                            value={carrierFilter}
                            onChange={(e) => setCarrierFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white md:w-44"
                        >
                            <option value="all">All carriers</option>
                            {carriers.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {canEdit && (
                            <Button size="sm" onClick={() => setTestForm({ test_name: '', carrier: 'All', plan_type: 'All', frequency: 'Annual', interval_months: 12, gender: 'Any', status: 'active' })}>
                                <Plus className="w-4 h-4 mr-1" /> Add test rule
                            </Button>
                        )}
                    </div>

                    {filteredTests.length === 0 && !loadingTests && (
                        <p className="text-sm text-gray-500 text-center py-8">No test rules match your search.</p>
                    )}

                    <div className="space-y-2">
                        {filteredTests.map(t => (
                            <TestRuleRow
                                key={t.id}
                                test={t}
                                expanded={expandedTestId === t.id}
                                onToggle={() => setExpandedTestId(expandedTestId === t.id ? null : t.id)}
                                canEdit={canEdit}
                                onEdit={() => setTestForm(t)}
                                onDelete={() => setDeleteTest(t)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* MANAGE PLANS TAB */}
            {tab === 'plans' && (
                <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search by carrier or plan type"
                                value={carrierQuery}
                                onChange={(e) => setCarrierQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <select
                            value={planTypeFilter}
                            onChange={(e) => setPlanTypeFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white md:w-44"
                        >
                            <option value="all">All plan types</option>
                            {planTypes.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                        </select>
                        {canEdit && (
                            <Button size="sm" onClick={() => setPlanForm({ carrier: '', plan_type: 'PPO', state: 'FL', preferred_lab: 'LabCorp', status: 'active' })}>
                                <Plus className="w-4 h-4 mr-1" /> Add plan
                            </Button>
                        )}
                    </div>

                    <p className="text-xs text-gray-500">{filteredPlans.length} plans</p>

                    <div className="space-y-2">
                        {filteredPlans.map(p => (
                            <PlanRow
                                key={p.id}
                                plan={p}
                                expanded={expandedPlanId === p.id}
                                onToggle={() => setExpandedPlanId(expandedPlanId === p.id ? null : p.id)}
                                canEdit={canEdit}
                                onEdit={() => setPlanForm(p)}
                                onDelete={() => setDeletePlan(p)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Plan form dialog */}
            {planForm && (
                <PlanFormDialog
                    initial={planForm}
                    onCancel={() => setPlanForm(null)}
                    onSave={(data) => savePlan.mutate(data)}
                    saving={savePlan.isPending}
                />
            )}

            {/* Test form dialog */}
            {testForm && (
                <TestFormDialog
                    initial={testForm}
                    onCancel={() => setTestForm(null)}
                    onSave={(data) => saveTest.mutate(data)}
                    saving={saveTest.isPending}
                />
            )}

            {/* Delete confirmations */}
            <AlertDialog open={!!deletePlan} onOpenChange={(open) => !open && setDeletePlan(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this plan mapping?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deletePlan?.carrier} {deletePlan?.plan_type ? `(${deletePlan.plan_type})` : ''} will be removed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removePlan.mutate(deletePlan.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!deleteTest} onOpenChange={(open) => !open && setDeleteTest(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this test rule?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteTest?.test_name} ({deleteTest?.carrier}) will be removed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removeTest.mutate(deleteTest.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// =================================================================
// Sub-components
// =================================================================
function TabButton({ active, onClick, icon: Icon, children }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${active ? 'border-purple-500 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
            <Icon className="w-4 h-4" />
            {children}
        </button>
    );
}

function LookupResultCard({ plan }) {
    const labColor = LAB_COLORS[plan.preferred_lab] || LAB_COLORS.Other;
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900">{plan.carrier}</h3>
                        {plan.plan_type && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{plan.plan_type}</span>}
                        {plan.state && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{plan.state}</span>}
                    </div>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border ${labColor}`}>
                    <CheckCircle2 className="w-4 h-4" />
                    {plan.preferred_lab}
                </div>
            </div>
            {plan.secondary_lab && (
                <p className="text-xs text-gray-500 mt-2">Backup option: <span className="font-medium text-gray-700">{plan.secondary_lab}</span></p>
            )}
            {plan.notes && (
                <p className="text-sm text-gray-700 mt-2 bg-gray-50 rounded-md p-2.5">{plan.notes}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-2.5">
                {plan.last_verified && <span>✓ Verified {plan.last_verified}</span>}
                {plan.source_url && <a href={plan.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 underline hover:text-gray-600"><ExternalLink className="w-3 h-3" /> Source</a>}
            </div>
        </div>
    );
}

function PlanRow({ plan, expanded, onToggle, canEdit, onEdit, onDelete }) {
    const labColor = LAB_COLORS[plan.preferred_lab] || LAB_COLORS.Other;
    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={onToggle} className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 text-left">
                <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                    <span className="font-semibold text-gray-900 truncate">{plan.carrier}</span>
                    {plan.plan_type && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 shrink-0">{plan.plan_type}</span>}
                    <span className="text-xs text-gray-400 shrink-0">{plan.state}</span>
                </div>
                <div className={`text-xs font-semibold px-2 py-1 rounded-full border ${labColor} shrink-0`}>{plan.preferred_lab}</div>
                {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
            </button>
            {expanded && (
                <div className="px-4 pb-3 pt-1 border-t bg-gray-50 space-y-2">
                    {plan.secondary_lab && <p className="text-xs text-gray-600">Backup: <span className="font-medium">{plan.secondary_lab}</span></p>}
                    {plan.notes && <p className="text-sm text-gray-700">{plan.notes}</p>}
                    {plan.last_verified && <p className="text-xs text-gray-400">Verified {plan.last_verified}</p>}
                    {canEdit && (
                        <div className="flex gap-2 pt-2">
                            <Button size="sm" variant="outline" onClick={onEdit}><Pencil className="w-3.5 h-3.5 mr-1" />Edit</Button>
                            <Button size="sm" variant="outline" onClick={onDelete} className="text-red-600 hover:text-red-700"><Trash2 className="w-3.5 h-3.5 mr-1" />Delete</Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function TestRuleRow({ test, expanded, onToggle, canEdit, onEdit, onDelete }) {
    const freqColor = FREQ_COLORS[test.frequency] || "bg-gray-100 text-gray-700";
    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={onToggle} className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 text-left">
                <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                    <span className="font-semibold text-gray-900 truncate">{test.test_name}</span>
                    {test.carrier && test.carrier !== 'All' && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 shrink-0">{test.carrier}</span>}
                    {test.gender && test.gender !== 'Any' && <span className="text-xs px-1.5 py-0.5 rounded bg-pink-50 text-pink-700 shrink-0">{test.gender}</span>}
                </div>
                <div className={`text-xs font-medium px-2 py-1 rounded-full ${freqColor} shrink-0 flex items-center gap-1`}>
                    <Calendar className="w-3 h-3" />
                    {test.frequency}
                </div>
                {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
            </button>
            {expanded && (
                <div className="px-4 pb-3 pt-2 border-t bg-gray-50 space-y-1.5 text-sm">
                    {test.test_codes && <div><span className="text-xs font-semibold text-gray-500">CPT:</span> <span className="text-gray-700 font-mono text-xs">{test.test_codes}</span></div>}
                    {(test.age_min != null || test.age_max != null) && (
                        <div className="text-xs text-gray-600">
                            <span className="font-semibold">Age:</span> {test.age_min ?? 'any'}–{test.age_max ?? 'any'}
                        </div>
                    )}
                    {test.conditions && <div className="text-gray-700"><span className="text-xs font-semibold text-gray-500">When:</span> {test.conditions}</div>}
                    {test.diagnosis_required && <div className="text-gray-700"><span className="text-xs font-semibold text-gray-500">Dx required:</span> <span className="font-mono text-xs">{test.diagnosis_required}</span></div>}
                    {test.notes && <p className="text-gray-700 bg-amber-50 border border-amber-200 rounded p-2 text-xs">⚠️ {test.notes}</p>}
                    {test.last_verified && <p className="text-xs text-gray-400">Verified {test.last_verified}</p>}
                    {canEdit && (
                        <div className="flex gap-2 pt-2">
                            <Button size="sm" variant="outline" onClick={onEdit}><Pencil className="w-3.5 h-3.5 mr-1" />Edit</Button>
                            <Button size="sm" variant="outline" onClick={onDelete} className="text-red-600 hover:text-red-700"><Trash2 className="w-3.5 h-3.5 mr-1" />Delete</Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function PlanFormDialog({ initial, onCancel, onSave, saving }) {
    const [form, setForm] = useState(initial);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const isEdit = !!initial.id;
    return (
        <Dialog open={true} onOpenChange={(o) => !o && onCancel()}>
            <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>{isEdit ? 'Edit' : 'Add'} insurance plan</DialogTitle></DialogHeader>
                <div className="space-y-3">
                    <Field label="Carrier *" value={form.carrier || ''} onChange={(v) => set('carrier', v)} placeholder="Aetna, Florida Blue, UnitedHealthcare..." />
                    <div className="grid grid-cols-2 gap-2">
                        <SelectField label="Plan type" value={form.plan_type || ''} onChange={(v) => set('plan_type', v)}
                            options={['', 'PPO', 'HMO', 'EPO', 'POS', 'Medicare Advantage', 'Medicaid', 'Medicaid MMA', 'Marketplace', 'Tricare', 'BlueMedicare', 'Original']} />
                        <Field label="State" value={form.state || 'FL'} onChange={(v) => set('state', v)} placeholder="FL or ALL" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <SelectField label="Preferred lab *" value={form.preferred_lab || 'LabCorp'} onChange={(v) => set('preferred_lab', v)}
                            options={['LabCorp', 'Quest', 'Both', 'Other']} />
                        <SelectField label="Secondary lab" value={form.secondary_lab || ''} onChange={(v) => set('secondary_lab', v)}
                            options={['', 'LabCorp', 'Quest', 'Both', 'Other']} />
                    </div>
                    <TextareaField label="Notes" value={form.notes || ''} onChange={(v) => set('notes', v)} placeholder="Contract details, exceptions, caveats..." />
                    <Field label="Source URL" value={form.source_url || ''} onChange={(v) => set('source_url', v)} placeholder="https://..." />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button onClick={() => onSave(form)} disabled={!form.carrier || saving}>{saving ? 'Saving...' : 'Save'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function TestFormDialog({ initial, onCancel, onSave, saving }) {
    const [form, setForm] = useState(initial);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const isEdit = !!initial.id;
    return (
        <Dialog open={true} onOpenChange={(o) => !o && onCancel()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{isEdit ? 'Edit' : 'Add'} test frequency rule</DialogTitle></DialogHeader>
                <div className="space-y-3">
                    <Field label="Test name *" value={form.test_name || ''} onChange={(v) => set('test_name', v)} placeholder="Lipid Panel, HbA1c, Pap Smear..." />
                    <Field label="CPT codes" value={form.test_codes || ''} onChange={(v) => set('test_codes', v)} placeholder="80061, 82465..." />
                    <div className="grid grid-cols-2 gap-2">
                        <SelectField label="Carrier" value={form.carrier || 'All'} onChange={(v) => set('carrier', v)}
                            options={['All', 'Medicare', 'Medicaid', 'Aetna', 'Florida Blue', 'UnitedHealthcare', 'Cigna', 'Humana', 'Tricare']} />
                        <SelectField label="Plan type scope" value={form.plan_type || 'All'} onChange={(v) => set('plan_type', v)}
                            options={['All', 'Medicare', 'Commercial', 'Medicaid', 'Tricare']} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Field label="Frequency *" value={form.frequency || ''} onChange={(v) => set('frequency', v)} placeholder="Annual, Every 2 years..." />
                        <Field label="Interval months (numeric)" type="number" value={form.interval_months ?? ''} onChange={(v) => set('interval_months', v)} placeholder="12" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <Field label="Age min" type="number" value={form.age_min ?? ''} onChange={(v) => set('age_min', v)} />
                        <Field label="Age max" type="number" value={form.age_max ?? ''} onChange={(v) => set('age_max', v)} />
                        <SelectField label="Gender" value={form.gender || 'Any'} onChange={(v) => set('gender', v)}
                            options={['Any', 'F', 'M']} />
                    </div>
                    <TextareaField label="When covered (conditions)" value={form.conditions || ''} onChange={(v) => set('conditions', v)} placeholder="Diabetes diagnosis required, etc." />
                    <Field label="Diagnosis required (ICD-10)" value={form.diagnosis_required || ''} onChange={(v) => set('diagnosis_required', v)} placeholder="E11.9, E10.9" />
                    <TextareaField label="Notes" value={form.notes || ''} onChange={(v) => set('notes', v)} placeholder="Caveats, denial patterns..." />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button onClick={() => onSave(form)} disabled={!form.test_name || !form.frequency || saving}>{saving ? 'Saving...' : 'Save'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
    return (
        <div>
            <Label className="text-xs font-medium text-gray-600">{label}</Label>
            <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1" />
        </div>
    );
}

function TextareaField({ label, value, onChange, placeholder }) {
    return (
        <div>
            <Label className="text-xs font-medium text-gray-600">{label}</Label>
            <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1 min-h-[60px]" />
        </div>
    );
}

function SelectField({ label, value, onChange, options }) {
    return (
        <div>
            <Label className="text-xs font-medium text-gray-600">{label}</Label>
            <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white">
                {options.map(o => <option key={o} value={o}>{o || '— none —'}</option>)}
            </select>
        </div>
    );
}
