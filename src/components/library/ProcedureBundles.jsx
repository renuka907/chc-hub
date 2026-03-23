import React, { useState, useEffect } from "react";
import { entities } from "@/api/supabaseHelpers";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Printer, Pencil, Trash2, Package, FileText, BookOpen, Heart, ChevronDown, ChevronUp, Search } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "chc-procedure-bundles";

function loadBundles() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveBundles(bundles) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bundles));
}

const CHC_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695939a556b8082002a35a68/1e5584b38_goldwithlettersContemporary-health-center-logo-retina.png";

export default function ProcedureBundles() {
    const [bundles, setBundles] = useState(loadBundles);
    const [showCreate, setShowCreate] = useState(false);
    const [editingBundle, setEditingBundle] = useState(null);
    const [expandedBundle, setExpandedBundle] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    const { data: consentForms = [] } = useQuery({
        queryKey: ['consentForms'],
        queryFn: () => entities.ConsentForm.list('-form_name', 200),
    });
    const { data: educationTopics = [] } = useQuery({
        queryKey: ['educationTopics'],
        queryFn: () => entities.EducationTopic.list('-title', 200),
    });
    const { data: aftercareInstructions = [] } = useQuery({
        queryKey: ['aftercareInstructions'],
        queryFn: () => entities.AftercareInstruction.list('-procedure_name', 200),
    });

    useEffect(() => { saveBundles(bundles); }, [bundles]);

    const handleSave = (bundle) => {
        if (editingBundle) {
            setBundles(prev => prev.map(b => b.id === editingBundle.id ? { ...bundle, id: editingBundle.id } : b));
            toast.success("Bundle updated!");
        } else {
            setBundles(prev => [...prev, { ...bundle, id: Date.now().toString() }]);
            toast.success("Procedure bundle created!");
        }
        setShowCreate(false);
        setEditingBundle(null);
    };

    const handleDelete = (id) => {
        setBundles(prev => prev.filter(b => b.id !== id));
        toast.success("Bundle deleted");
    };

    const handlePrint = (bundle) => {
        const consents = consentForms.filter(f => bundle.consentIds?.includes(f.id));
        const education = educationTopics.filter(e => bundle.educationIds?.includes(e.id));
        const aftercare = aftercareInstructions.filter(a => bundle.aftercareIds?.includes(a.id));

        // Build print HTML
        const sections = [];

        consents.forEach(form => {
            let html = form.content || '';
            html = html.replace(/^<div[^>]*style="text-align:\s*center[^"]*"[^>]*>\s*<img[^>]*Contemporary[^>]*>[\s\S]*?<\/div>\s*/i, '');
            sections.push({ title: form.form_name, type: 'Consent Form', content: html });
        });

        education.forEach(topic => {
            sections.push({ title: topic.title, type: 'Patient Education', content: topic.content || '' });
        });

        aftercare.forEach(inst => {
            sections.push({ title: inst.procedure_name, type: 'Aftercare Instructions', content: inst.content || '' });
        });

        const printHtml = `<!DOCTYPE html><html><head>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', Georgia, serif; font-size: 10pt; line-height: 1.35; color: #1a1a1a; }
    @page { margin: 0.4in 0.5in 0.6in 0.5in; size: letter; }
    .section { page-break-before: always; }
    .section:first-child { page-break-before: auto; }
    .header { text-align: center; margin-bottom: 8pt; }
    .header img { height: 36px; }
    .contact { text-align: center; font-size: 8pt; color: #666; margin-bottom: 6pt; padding-bottom: 4pt; border-bottom: 1px solid #ccc; }
    .doc-title { text-align: center; font-size: 12pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5pt; margin: 8pt 0; padding-bottom: 6pt; border-bottom: 2px solid #1a1a1a; }
    .type-badge { text-align: center; margin-bottom: 6pt; }
    .type-badge span { background: #f0f0f0; color: #555; font-size: 8pt; padding: 2pt 8pt; border-radius: 4pt; }
    .content h1, .content h2, .content h3 { font-weight: bold; margin-top: 8pt; margin-bottom: 4pt; }
    .content h1 { font-size: 13pt; } .content h2 { font-size: 12pt; } .content h3 { font-size: 11pt; }
    .content p { margin-bottom: 4pt; }
    .content ul, .content ol { margin: 2pt 0; padding-left: 20pt; }
    .content li { margin-bottom: 1pt; line-height: 1.4; }
    .content table { width: 100%; border-collapse: collapse; margin: 4pt 0; }
    .content td, .content th { border: 1px solid #ccc; padding: 3pt 6pt; }
    mark { background-color: #fef08a !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .content { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .print-footer { position: fixed; bottom: 0; left: 0; width: 100%; text-align: center; font-size: 8pt; color: #999; font-family: Arial, sans-serif; }
</style></head><body>
${sections.map(s => `
<div class="section">
    <div class="header"><img src="${CHC_LOGO}" alt="CHC"></div>
    <div class="contact"><strong>6150 Diamond Center Court #400, Fort Myers, FL 33912</strong><br>Phone: 239-561-9191 | Fax: 239-561-9188 | contemporaryhealthcenter.com</div>
    <div class="type-badge"><span>${s.type}</span></div>
    <div class="doc-title">${s.title}</div>
    <div class="content">${s.content}</div>
</div>`).join('')}
<div class="print-footer">${bundle.name} — Contemporary Health Center</div>
</body></html>`;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printHtml);
            printWindow.document.close();
            setTimeout(() => { printWindow.print(); }, 500);
        }
    };

    const filtered = bundles.filter(b => 
        !searchQuery || b.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search procedures..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button onClick={() => { setEditingBundle(null); setShowCreate(true); }} className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Create Bundle
                </Button>
            </div>

            {filtered.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No procedure bundles yet</p>
                        <p className="text-gray-400 text-sm mt-1">Bundle consent forms, education, and aftercare together for easy printing</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filtered.map(bundle => {
                        const consentCount = bundle.consentIds?.length || 0;
                        const eduCount = bundle.educationIds?.length || 0;
                        const careCount = bundle.aftercareIds?.length || 0;
                        const totalDocs = consentCount + eduCount + careCount;
                        const isExpanded = expandedBundle === bundle.id;

                        return (
                            <div key={bundle.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                                <div className="p-4 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                                        <Package className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedBundle(isExpanded ? null : bundle.id)}>
                                        <h3 className="font-semibold text-gray-900 truncate">{bundle.name}</h3>
                                        <div className="flex gap-2 mt-1 flex-wrap">
                                            {consentCount > 0 && <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700"><FileText className="w-3 h-3 mr-1" />{consentCount} Consent</Badge>}
                                            {eduCount > 0 && <Badge variant="secondary" className="text-xs bg-green-50 text-green-700"><BookOpen className="w-3 h-3 mr-1" />{eduCount} Education</Badge>}
                                            {careCount > 0 && <Badge variant="secondary" className="text-xs bg-pink-50 text-pink-700"><Heart className="w-3 h-3 mr-1" />{careCount} Aftercare</Badge>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <Button size="sm" onClick={() => handlePrint(bundle)} className="bg-blue-600 hover:bg-blue-700 text-white">
                                            <Printer className="w-4 h-4 mr-1.5" /> Print All ({totalDocs})
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => { setEditingBundle(bundle); setShowCreate(true); }}>
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => handleDelete(bundle.id)} className="border-red-200 text-red-600 hover:bg-red-50">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                        <button onClick={() => setExpandedBundle(isExpanded ? null : bundle.id)} className="p-1">
                                            {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                        </button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="border-t px-4 py-3 bg-gray-50 space-y-2 text-sm">
                                        {bundle.consentIds?.map(id => {
                                            const f = consentForms.find(c => c.id === id);
                                            return f ? <div key={id} className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-blue-500" /><span>{f.form_name}</span><Badge className="text-xs bg-blue-50 text-blue-600">Consent</Badge></div> : null;
                                        })}
                                        {bundle.educationIds?.map(id => {
                                            const e = educationTopics.find(t => t.id === id);
                                            return e ? <div key={id} className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5 text-green-500" /><span>{e.title}</span><Badge className="text-xs bg-green-50 text-green-600">Education</Badge></div> : null;
                                        })}
                                        {bundle.aftercareIds?.map(id => {
                                            const a = aftercareInstructions.find(i => i.id === id);
                                            return a ? <div key={id} className="flex items-center gap-2"><Heart className="w-3.5 h-3.5 text-pink-500" /><span>{a.procedure_name}</span><Badge className="text-xs bg-pink-50 text-pink-600">Aftercare</Badge></div> : null;
                                        })}
                                        {totalDocs === 0 && <p className="text-gray-400 italic">No documents in this bundle yet</p>}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <BundleEditor
                open={showCreate}
                onOpenChange={(open) => { setShowCreate(open); if (!open) setEditingBundle(null); }}
                onSave={handleSave}
                editBundle={editingBundle}
                consentForms={consentForms}
                educationTopics={educationTopics}
                aftercareInstructions={aftercareInstructions}
            />
        </div>
    );
}

function BundleEditor({ open, onOpenChange, onSave, editBundle, consentForms, educationTopics, aftercareInstructions }) {
    const [name, setName] = useState("");
    const [consentIds, setConsentIds] = useState([]);
    const [educationIds, setEducationIds] = useState([]);
    const [aftercareIds, setAftercareIds] = useState([]);
    const [searchConsent, setSearchConsent] = useState("");
    const [searchEdu, setSearchEdu] = useState("");
    const [searchCare, setSearchCare] = useState("");

    useEffect(() => {
        if (open && editBundle) {
            setName(editBundle.name || "");
            setConsentIds(editBundle.consentIds || []);
            setEducationIds(editBundle.educationIds || []);
            setAftercareIds(editBundle.aftercareIds || []);
        } else if (open) {
            setName(""); setConsentIds([]); setEducationIds([]); setAftercareIds([]);
        }
        setSearchConsent(""); setSearchEdu(""); setSearchCare("");
    }, [open, editBundle]);

    const toggle = (arr, setArr, id) => {
        setArr(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleSave = () => {
        if (!name.trim()) { toast.error("Please enter a procedure name"); return; }
        onSave({ name: name.trim(), consentIds, educationIds, aftercareIds });
    };

    const filteredConsents = consentForms.filter(f => !searchConsent || f.form_name.toLowerCase().includes(searchConsent.toLowerCase()));
    const filteredEdu = educationTopics.filter(e => !searchEdu || e.title.toLowerCase().includes(searchEdu.toLowerCase()));
    const filteredCare = aftercareInstructions.filter(a => !searchCare || a.procedure_name.toLowerCase().includes(searchCare.toLowerCase()));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl w-[90vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editBundle ? "Edit" : "Create"} Procedure Bundle</DialogTitle>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    <div>
                        <Label className="text-sm font-semibold">Procedure Name *</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Botox Treatment, HRT Pellet Insertion..." className="mt-1" />
                    </div>

                    {/* Consent Forms */}
                    <div>
                        <Label className="text-sm font-semibold flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500" /> Consent Forms
                            {consentIds.length > 0 && <Badge className="bg-blue-100 text-blue-700">{consentIds.length}</Badge>}
                        </Label>
                        <Input placeholder="Search consent forms..." value={searchConsent} onChange={e => setSearchConsent(e.target.value)} className="mt-1 mb-2" />
                        <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
                            {filteredConsents.map(f => (
                                <label key={f.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-blue-50 cursor-pointer text-sm">
                                    <Checkbox checked={consentIds.includes(f.id)} onCheckedChange={() => toggle(consentIds, setConsentIds, f.id)} />
                                    <span className={consentIds.includes(f.id) ? "font-medium text-blue-700" : ""}>{f.form_name}</span>
                                </label>
                            ))}
                            {filteredConsents.length === 0 && <p className="text-gray-400 text-sm p-2">No consent forms found</p>}
                        </div>
                    </div>

                    {/* Education Topics */}
                    <div>
                        <Label className="text-sm font-semibold flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-green-500" /> Patient Education
                            {educationIds.length > 0 && <Badge className="bg-green-100 text-green-700">{educationIds.length}</Badge>}
                        </Label>
                        <Input placeholder="Search education topics..." value={searchEdu} onChange={e => setSearchEdu(e.target.value)} className="mt-1 mb-2" />
                        <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
                            {filteredEdu.map(e => (
                                <label key={e.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-green-50 cursor-pointer text-sm">
                                    <Checkbox checked={educationIds.includes(e.id)} onCheckedChange={() => toggle(educationIds, setEducationIds, e.id)} />
                                    <span className={educationIds.includes(e.id) ? "font-medium text-green-700" : ""}>{e.title}</span>
                                </label>
                            ))}
                            {filteredEdu.length === 0 && <p className="text-gray-400 text-sm p-2">No education topics found</p>}
                        </div>
                    </div>

                    {/* Aftercare */}
                    <div>
                        <Label className="text-sm font-semibold flex items-center gap-2">
                            <Heart className="w-4 h-4 text-pink-500" /> Aftercare Instructions
                            {aftercareIds.length > 0 && <Badge className="bg-pink-100 text-pink-700">{aftercareIds.length}</Badge>}
                        </Label>
                        <Input placeholder="Search aftercare..." value={searchCare} onChange={e => setSearchCare(e.target.value)} className="mt-1 mb-2" />
                        <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
                            {filteredCare.map(a => (
                                <label key={a.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-pink-50 cursor-pointer text-sm">
                                    <Checkbox checked={aftercareIds.includes(a.id)} onCheckedChange={() => toggle(aftercareIds, setAftercareIds, a.id)} />
                                    <span className={aftercareIds.includes(a.id) ? "font-medium text-pink-700" : ""}>{a.procedure_name}</span>
                                </label>
                            ))}
                            {filteredCare.length === 0 && <p className="text-gray-400 text-sm p-2">No aftercare instructions found</p>}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 text-white">
                        {editBundle ? "Update" : "Create"} Bundle
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
