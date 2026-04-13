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

    const handlePrint = () => {
        const docEl = document.querySelector('.doc-page');
        if (!docEl) return;
        const content = docEl.innerHTML;
        const css = `
            @page { size: letter; margin: 0; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            html, body { width: 8.5in; height: 11in; overflow: hidden; background: white; font-family: Arial, sans-serif; font-size: 10pt; color: #1a1a1a; line-height: 1.4; }
            .page { width: 8.5in; min-height: 11in; padding: 0.4in 0.55in; overflow: hidden; }
            h1, h2, h3 { font-family: Arial, sans-serif; font-weight: 700; color: #5b21b6; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #ede9fe; padding-bottom: 3px; margin: 12px 0 7px; }
            h1 { font-size: 11pt; } h2 { font-size: 10pt; } h3 { font-size: 9pt; }
            p { margin-bottom: 6px; }
            ul, ol { margin: 3px 0 7px 18px; } li { margin-bottom: 3px; }
            strong { font-weight: 700; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        `;
        const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + (instruction.procedure_name || 'Print') + '</title><style>' + css + '</style></head><body><div class="page">' + content + '</div></body></html>';
        const win = window.open('', '', 'width=850,height=1100,menubar=no,toolbar=no,location=no,status=no,scrollbars=no');
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(function(){ win.print(); }, 600);
    };

    React.useEffect(() => {
        if (instruction && autoPrint) { setTimeout(() => handlePrint(), 500); }
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
                    <Button size="sm" onClick={handlePrint} className="bg-purple-600 hover:bg-purple-700 text-white">
                        <Printer className="w-4 h-4 mr-1.5" /> Print
                    </Button>
                </div>
            </div>

            {/* Document Page */}
            <div className="doc-page bg-white rounded-lg shadow-lg border border-gray-200" style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt', lineHeight: '1.4', color: '#1a1a1a', padding: '0.4in 0.55in' }}>

                {/* Header: logo left, title right, purple border */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #5b21b6', paddingBottom: '8px', marginBottom: '14px' }}>
                    <img src={CHC_LOGO} alt="CHC Logo" style={{ height: '44px' }} />
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14pt', fontWeight: '700', color: '#5b21b6', fontFamily: 'Arial, sans-serif', lineHeight: '1.2' }}>Aftercare: {instruction.procedure_name}</div>
                        <div style={{ fontSize: '8pt', color: '#6b7280', fontFamily: 'Arial, sans-serif', marginTop: '2px' }}>Contemporary Health Center | Fort Myers, FL</div>
                    </div>
                </div>

                {/* Category, Version & Tags */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '12px', fontSize: '8pt', color: '#6b7280', fontFamily: 'Arial, sans-serif', flexWrap: 'wrap' }}>
                    {instruction.category && <span style={{ background: '#f3f4f6', color: '#374151', padding: '1px 6px', borderRadius: '3px' }}>{instruction.category}</span>}
                    {instruction.version && <span>Version {instruction.version}</span>}
                    {instruction.updated_date && <span>Updated {new Date(instruction.updated_date).toLocaleDateString()}</span>}
                    {tags.length > 0 && tags.map(tag => <span key={tag} style={{ background: '#ede9fe', color: '#5b21b6', padding: '1px 6px', borderRadius: '3px' }}>{tag}</span>)}
                </div>

                {/* Recovery Duration */}
                {instruction.duration && (
                    <div style={{ border: '1px solid #ede9fe', borderRadius: '4px', padding: '6px 12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }} className="print-section">
                        <Clock className="w-4 h-4" style={{ color: '#5b21b6', flexShrink: 0 }} />
                        <div style={{ fontSize: '10pt' }}>
                            <strong>Expected Recovery:</strong> {instruction.duration}
                        </div>
                    </div>
                )}

                {/* Main Instructions */}
                <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '10pt', fontWeight: '700', color: '#5b21b6', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #ede9fe', paddingBottom: '3px', marginBottom: '7px', fontFamily: 'Arial, sans-serif' }}>
                        Post-Procedure Instructions
                    </div>
                    <div
                        className="aftercare-content"
                        style={{ fontSize: '10pt', lineHeight: '1.4' }}
                        dangerouslySetInnerHTML={{ __html: instruction.instructions }}
                    />
                </div>

                {/* Content Styling */}
                <style>{`
                    .aftercare-content h2, .aftercare-content h3 {
                        font-family: Arial, sans-serif; font-weight: 700; color: #5b21b6; text-transform: uppercase;
                        letter-spacing: 0.5px; border-bottom: 1px solid #ede9fe; padding-bottom: 3px; margin: 12px 0 7px;
                    }
                    .aftercare-content h2 { font-size: 10pt; }
                    .aftercare-content h3 { font-size: 9pt; }
                    .aftercare-content ul, .aftercare-content ol {
                        margin: 3px 0 7px 18px; padding-left: 0;
                    }
                    .aftercare-content li { margin-bottom: 3px; line-height: 1.4; }
                    .aftercare-content p { margin-bottom: 6px; }
                    .aftercare-content strong { font-weight: 700; }
                `}</style>

                {/* Warning Signs */}
                {instruction.warning_signs && (
                    <div style={{ border: '1.5px solid #d97706', borderRadius: '4px', padding: '8px 12px', marginBottom: '12px' }} className="print-warning">
                        <div style={{ fontSize: '10pt', fontWeight: '700', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontFamily: 'Arial, sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <AlertTriangle className="w-4 h-4" style={{ color: '#d97706' }} />
                            Warning Signs — Contact Us Immediately
                        </div>
                        <div
                            className="aftercare-content"
                            style={{ fontSize: '10pt', lineHeight: '1.4', color: '#92400e', fontWeight: '500' }}
                            dangerouslySetInnerHTML={{ __html: instruction.warning_signs }}
                        />
                    </div>
                )}

                {/* Follow-up */}
                {instruction.follow_up && (
                    <div style={{ border: '1px solid #ede9fe', borderRadius: '4px', padding: '8px 12px', marginBottom: '12px' }} className="print-section">
                        <div style={{ fontSize: '10pt', fontWeight: '700', color: '#5b21b6', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontFamily: 'Arial, sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CalendarIcon className="w-4 h-4" style={{ color: '#5b21b6' }} />
                            Follow-Up Appointment
                        </div>
                        <div
                            className="aftercare-content"
                            style={{ fontSize: '10pt', lineHeight: '1.4' }}
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
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '8px', marginBottom: '10px' }} className="print-avoid">
                    <p style={{ fontSize: '8pt', color: '#9ca3af', fontStyle: 'italic', lineHeight: '1.4', marginBottom: '0' }}>
                        <strong>Disclaimer:</strong> These aftercare instructions are general guidelines. Your provider may give you specific instructions that differ. Always follow your provider's personalized recommendations.
                    </p>
                </div>

                {/* Footer */}
                <div style={{ marginTop: '14px', borderTop: '1px solid #e5e7eb', paddingTop: '5px', fontSize: '7.5pt', color: '#9ca3af', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
                    Contemporary Health Center &nbsp;|&nbsp; 6150 Diamond Center Court #400, Fort Myers, FL 33912 &nbsp;|&nbsp; Ph: 239-561-9191 &nbsp;|&nbsp; Fx: 239-561-9188
                </div>
            </div>

            {instruction && (
                <AftercareForm open={showEditForm} onOpenChange={setShowEditForm} onSuccess={handleSuccess} editInstruction={instruction} />
            )}
        </div>
    );
}
