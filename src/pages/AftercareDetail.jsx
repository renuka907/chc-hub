import React, { useState } from "react";
import { entities, uploadFile, invokeLLM, generateImage, sendEmail, agentChat } from "@/api/supabaseHelpers";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import AftercareForm from "../components/AftercareForm";
import { usePermissions } from "../components/permissions/usePermissions";
import { toast } from "sonner";
import { Printer, ArrowLeft, AlertTriangle, Clock, Calendar as CalendarIcon, Pencil, Star, FileText, Save, Files } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

const CHC_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695939a556b8082002a35a68/1e5584b38_goldwithlettersContemporary-health-center-logo-retina.png";

function safeParse(val, fallback = []) {
    if (val == null) return fallback;
    if (typeof val !== 'string') return val;
    try { return JSON.parse(val); } catch { return fallback; }
}

const PRINT_STYLES = `
@media print {
    @page { margin: 0.5in; size: letter; }
    nav, header, footer, .no-print { display: none !important; height: 0 !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; line-height: 0 !important; font-size: 0 !important; border: 0 !important; }
    body, html, #root { margin: 0 !important; padding: 0 !important; }
    main { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
    body > div, #root > div { min-height: auto !important; padding: 0 !important; background: white !important; }
    .max-w-4xl { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
    .max-w-7xl { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
    .doc-page { box-shadow: none !important; border: none !important; background: white !important; padding: 0 !important; margin: 0 !important; border-radius: 0 !important; }
    .doc-page * { background-color: transparent !important; background-image: none !important; }
    .doc-page h1, .doc-page h2, .doc-page h3, .doc-page h4, .doc-page h5, .doc-page h6 { page-break-after: avoid; break-after: avoid; }
    .doc-page .print-section { page-break-inside: avoid; border: 1px solid #999 !important; padding: 10pt !important; margin: 10pt 0 !important; }
    .doc-page .print-warning { page-break-inside: avoid; border: 2px solid #333 !important; padding: 10pt !important; margin: 10pt 0 !important; }
    .doc-page .print-avoid { page-break-inside: avoid; }
}
`;

export default function AftercareDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const instructionId = urlParams.get('id');
    const autoPrint = urlParams.get('autoprint') === 'true';
    const [showEditForm, setShowEditForm] = useState(false);
    const queryClient = useQueryClient();
    const { can } = usePermissions();

    const { data: instructions = [] } = useQuery({
        queryKey: ['aftercareInstructions'],
        queryFn: () => entities.AftercareInstruction.list(),
    });

    const instruction = instructions.find(i => i.id === instructionId);

    const handleSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['aftercareInstructions'] });
    };

    const toggleFavorite = async () => {
        await entities.AftercareInstruction.update(instruction.id, { is_favorite: !instruction.is_favorite });
        queryClient.invalidateQueries({ queryKey: ['aftercareInstructions'] });
    };

    const saveAsTemplate = async () => {
        try {
            await entities.FormTemplate.create({
                template_name: instruction.procedure_name,
                template_type: "AftercareInstruction",
                category: instruction.category,
                description: `Template created from ${instruction.procedure_name}`,
                content: instruction.instructions,
                metadata: JSON.stringify({ duration: instruction.duration, warning_signs: instruction.warning_signs, follow_up: instruction.follow_up }),
                tags: instruction.tags || "[]",
                usage_count: 0,
                is_public: true
            });
            toast.success("Template created successfully!");
        } catch (error) { toast.error("Failed to create template"); }
    };

    const duplicateInstruction = async () => {
        try {
            const duplicated = await entities.AftercareInstruction.create({
                ...instruction, id: undefined,
                procedure_name: `${instruction.procedure_name} (Copy)`,
                created_date: undefined, updated_date: undefined, parent_id: undefined
            });
            toast.success("Instruction duplicated!");
            window.location.href = createPageUrl(`AftercareDetail?id=${duplicated.id}`);
        } catch (error) { toast.error("Failed to duplicate"); }
    };

    React.useEffect(() => {
        if (instruction && autoPrint) { setTimeout(() => window.print(), 500); }
    }, [instruction, autoPrint]);

    if (!instruction) {
        return <div className="flex items-center justify-center py-20"><div className="animate-pulse text-gray-400 text-lg">Loading instructions...</div></div>;
    }

    const tags = safeParse(instruction.tags);

    return (
        <div className="max-w-4xl mx-auto">
            <style>{PRINT_STYLES}</style>

            {/* Action Bar */}
            <div className="flex items-center justify-between mb-4 no-print">
                <Link to={createPageUrl("Library")}>
                    <Button variant="outline" size="sm" className="gap-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Library
                    </Button>
                </Link>
                <div className="flex gap-2 flex-wrap justify-end">
                    <Button variant="outline" size="sm" onClick={toggleFavorite}
                        className={instruction.is_favorite ? "border-yellow-400 text-yellow-600 bg-yellow-50" : ""}>
                        <Star className={`w-4 h-4 mr-1.5 ${instruction.is_favorite ? 'fill-yellow-500' : ''}`} />
                    </Button>
                    {can("aftercare", "edit") && (
                        <>
                            <Button variant="outline" size="sm" onClick={duplicateInstruction}>
                                <Files className="w-4 h-4 mr-1.5" /> Duplicate
                            </Button>
                            <Button variant="outline" size="sm" onClick={saveAsTemplate}>
                                <Save className="w-4 h-4 mr-1.5" /> Template
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setShowEditForm(true)}>
                                <Pencil className="w-4 h-4 mr-1.5" /> Edit
                            </Button>
                        </>
                    )}
                    <Button size="sm" onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Printer className="w-4 h-4 mr-1.5" /> Print
                    </Button>
                </div>
            </div>

            {/* Document Page */}
            <div className="doc-page bg-white rounded-lg shadow-lg border border-gray-200 px-12 py-10" style={{ fontFamily: "'Times New Roman', Georgia, serif", fontSize: '12pt', lineHeight: '1.7', color: '#1a1a1a' }}>

                {/* Logo */}
                <div className="text-center mb-2">
                    <img src={CHC_LOGO} alt="Contemporary Health Center" className="h-14 mx-auto" />
                </div>

                {/* Contact Info */}
                <div className="text-center text-xs text-gray-600 mb-3 pb-3 border-b border-gray-300">
                    <div className="font-semibold">6150 Diamond Center Court #400, Fort Myers, FL 33912</div>
                    <div>Phone: 239-561-9191 | Fax: 239-561-9188 | contemporaryhealthcenter.com</div>
                </div>

                {/* Title */}
                <h1 className="text-center text-xl font-bold uppercase tracking-wide my-4 pb-3 border-b-2 border-gray-900">
                    Aftercare Instructions: {instruction.procedure_name}
                </h1>

                {/* Category, Version & Tags */}
                <div className="flex items-center justify-center gap-3 mb-6 text-xs text-gray-500 flex-wrap">
                    {instruction.category && <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{instruction.category}</span>}
                    {instruction.version && <span>Version {instruction.version}</span>}
                    {instruction.updated_date && <span>Updated {new Date(instruction.updated_date).toLocaleDateString()}</span>}
                    {tags.length > 0 && tags.map(tag => <span key={tag} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{tag}</span>)}
                </div>

                {/* Recovery Duration */}
                {instruction.duration && (
                    <div className="bg-blue-50 border border-blue-200 rounded px-5 py-3 mb-6 flex items-center gap-3 print-section">
                        <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <div>
                            <span className="font-bold">Expected Recovery:</span> {instruction.duration}
                        </div>
                    </div>
                )}

                {/* Main Instructions */}
                <div className="mb-6">
                    <h2 className="text-base font-bold uppercase tracking-wider mb-3 pb-2 border-b border-gray-300">
                        Post-Procedure Instructions
                    </h2>
                    <div
                        className="aftercare-content"
                        style={{ fontSize: '11pt', lineHeight: '1.8' }}
                        dangerouslySetInnerHTML={{ __html: instruction.instructions }}
                    />
                </div>

                {/* Content Styling */}
                <style>{`
                    .aftercare-content h2, .aftercare-content h3 {
                        font-size: 14pt; font-weight: bold; margin-top: 18pt; margin-bottom: 8pt;
                        padding-bottom: 4pt; border-bottom: 1px solid #ddd;
                    }
                    .aftercare-content h3 { font-size: 13pt; }
                    .aftercare-content ul, .aftercare-content ol {
                        margin: 8pt 0; padding-left: 24pt;
                    }
                    .aftercare-content li { margin-bottom: 6pt; line-height: 1.8; }
                    .aftercare-content p { margin-bottom: 8pt; }
                    .aftercare-content strong { font-weight: 700; }
                `}</style>

                {/* Warning Signs */}
                {instruction.warning_signs && (
                    <div className="bg-amber-50 border-2 border-amber-400 rounded px-5 py-4 mb-6 print-warning">
                        <h2 className="text-base font-bold uppercase tracking-wider mb-2 text-amber-900 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                            Warning Signs — Contact Us Immediately
                        </h2>
                        <div
                            className="aftercare-content text-amber-900 font-medium"
                            style={{ fontSize: '11pt', lineHeight: '1.8' }}
                            dangerouslySetInnerHTML={{ __html: instruction.warning_signs }}
                        />
                    </div>
                )}

                {/* Follow-up */}
                {instruction.follow_up && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded px-5 py-4 mb-6 print-section">
                        <h2 className="text-base font-bold uppercase tracking-wider mb-2 text-emerald-900 flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-emerald-600" />
                            Follow-Up Appointment
                        </h2>
                        <div
                            className="aftercare-content"
                            style={{ fontSize: '11pt', lineHeight: '1.8' }}
                            dangerouslySetInnerHTML={{ __html: instruction.follow_up }}
                        />
                    </div>
                )}

                {/* Attached Document */}
                {instruction.document_url && (
                    <Card className="bg-slate-50 border-slate-200 mb-6 no-print">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-6 h-6 text-slate-600" />
                                    <div>
                                        <p className="font-semibold text-slate-900">Attached Document (PDF)</p>
                                        <p className="text-sm text-slate-600">View, print, or download the full document</p>
                                    </div>
                                </div>
                                <a href={instruction.document_url} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="sm"><Printer className="w-4 h-4 mr-2" /> Open PDF</Button>
                                </a>
                            </div>
                            <embed src={instruction.document_url} type="application/pdf" className="w-full h-[600px] border-2 border-slate-300 rounded-lg" title="Document Preview" />
                        </CardContent>
                    </Card>
                )}

                {/* Disclaimer */}
                <div className="border-t border-gray-300 pt-4 mb-6 print-avoid">
                    <p className="text-xs text-gray-500 italic leading-relaxed">
                        <strong>Disclaimer:</strong> These aftercare instructions are general guidelines. Your provider may give you specific instructions that differ. Always follow your provider's personalized recommendations.
                    </p>
                </div>

                {/* Contact Section */}
                <div className="bg-slate-50 border border-slate-200 rounded px-5 py-4 print-section">
                    <h3 className="font-bold text-sm uppercase tracking-wider mb-2">Questions or Concerns?</h3>
                    <p className="text-sm text-slate-600 mb-3">Please contact our office if you have any questions about your recovery or experience any concerning symptoms.</p>
                    <div className="border-t border-slate-200 pt-3 space-y-1 text-sm font-semibold text-slate-700">
                        <p>📞 Phone: 239-561-9191 (call or text)</p>
                        <p>📧 Email: office@contemporaryhealthcenter.com</p>
                        <p>🌐 Web: contemporaryhealthcenter.com</p>
                    </div>
                </div>
            </div>

            {instruction && (
                <AftercareForm open={showEditForm} onOpenChange={setShowEditForm} onSuccess={handleSuccess} editInstruction={instruction} />
            )}
        </div>
    );
}
