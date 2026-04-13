import React, { useState } from "react";
import { entities, uploadFile, invokeLLM, generateImage, sendEmail, agentChat } from "@/api/supabaseHelpers";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import PrintableDocument from "../components/PrintableDocument";
import ConsentFormForm from "../components/ConsentFormForm";
import VersionHistory from "../components/forms/VersionHistory";
import TagManager from "../components/forms/TagManager";
import { usePermissions } from "../components/permissions/usePermissions";
import { toast } from "sonner";
import { Printer, ArrowLeft, Pencil, Star, FileText, Trash2, History, Tag, Copy, Save, Files, Undo2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const CHC_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695939a556b8082002a35a68/1e5584b38_goldwithlettersContemporary-health-center-logo-retina.png";

function safeParse(val, fallback = []) {
    if (val == null) return fallback;
    if (typeof val !== 'string') return val;
    try { return JSON.parse(val); } catch { return fallback; }
}

const PRINT_STYLES = `
@media print {
    @page { margin: 0.4in 0.5in 0.6in 0.5in; size: letter; }
    .print-page-number { display: block !important; position: fixed; bottom: 0; left: 0; width: 100%; text-align: center; font-size: 8pt; color: #999; font-family: Arial, sans-serif; }
    nav, header, footer, .no-print { display: none !important; height: 0 !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; line-height: 0 !important; font-size: 0 !important; border: 0 !important; }
    body, html, #root { margin: 0 !important; padding: 0 !important; }
    main { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
    body > div, #root > div { min-height: auto !important; padding: 0 !important; background: white !important; }
    .max-w-4xl { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
    .max-w-7xl { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
    .doc-page { box-shadow: none !important; border: none !important; background: white !important; padding: 0 !important; margin: 0 !important; border-radius: 0 !important; }
    .doc-page *:not(mark) { background-color: transparent !important; background-image: none !important; }
    .doc-page h1, .doc-page h2, .doc-page h3, .doc-page h4, .doc-page h5, .doc-page h6 { page-break-after: avoid; break-after: avoid; }
    .doc-page .print-section { page-break-inside: avoid; border: 1px solid #999 !important; padding: 10pt !important; margin: 10pt 0 !important; }
    .doc-page .print-avoid { page-break-inside: avoid; }
    .doc-page mark, .consent-content mark { background-color: #fef08a !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .consent-content { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}
`;

export default function ConsentFormDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const formId = urlParams.get('id');
    const autoPrint = urlParams.get('autoprint') === 'true';
    const [showEditForm, setShowEditForm] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showVersionHistory, setShowVersionHistory] = useState(false);
    const [showTagManager, setShowTagManager] = useState(false);
    const [showNewVersionDialog, setShowNewVersionDialog] = useState(false);
    const [previousVersion, setPreviousVersion] = useState(null);
    const [showUndoToast, setShowUndoToast] = useState(false);
    const undoTimerRef = React.useRef(null);
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { can } = usePermissions();

    const { data: forms = [] } = useQuery({
        queryKey: ['consentForms'],
        queryFn: () => entities.ConsentForm.list(),
    });

    const form = forms.find(f => f.id === formId);

    const handleSuccess = () => {
        // Save snapshot for undo before refreshing
        if (form) {
            const snapshot = { ...form };
            setPreviousVersion(snapshot);
            setShowUndoToast(true);
            if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
            undoTimerRef.current = setTimeout(() => {
                setShowUndoToast(false);
                setPreviousVersion(null);
            }, 10000);
        }
        queryClient.invalidateQueries({ queryKey: ['consentForms'] });
        setShowEditForm(false);
    };

    const handleUndo = async () => {
        if (!previousVersion) return;
        try {
            const { id, created_at, updated_at, created_date, updated_date, ...restoreData } = previousVersion;
            await entities.ConsentForm.update(previousVersion.id, restoreData);
            queryClient.invalidateQueries({ queryKey: ['consentForms'] });
            toast.success("Changes undone!");
        } catch (error) {
            toast.error("Failed to undo changes");
        }
        setShowUndoToast(false);
        setPreviousVersion(null);
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };

    const toggleFavorite = async () => {
        await entities.ConsentForm.update(form.id, { is_favorite: !form.is_favorite });
        queryClient.invalidateQueries({ queryKey: ['consentForms'] });
    };

    const deleteMutation = useMutation({
        mutationFn: (id) => entities.ConsentForm.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['consentForms'] });
            navigate(createPageUrl("Library"));
        }
    });

    const handleDelete = () => {
        deleteMutation.mutate(form.id);
        setShowDeleteDialog(false);
    };

    const createNewVersion = async () => {
        const newVersionNum = form.version ? `${parseFloat(form.version) + 0.1}` : "1.0";
        const newForm = { ...form, id: undefined, version: newVersionNum, parent_id: form.id, effective_date: new Date().toISOString().split('T')[0] };
        const created = await entities.ConsentForm.create(newForm);
        queryClient.invalidateQueries({ queryKey: ['consentForms'] });
        navigate(createPageUrl(`ConsentFormDetail?id=${created.id}`));
        setShowNewVersionDialog(false);
    };

    const handleSaveTags = async (tagsJson) => {
        await entities.ConsentForm.update(form.id, { tags: tagsJson });
        queryClient.invalidateQueries({ queryKey: ['consentForms'] });
    };

    const viewVersion = (version) => {
        navigate(createPageUrl(`ConsentFormDetail?id=${version.id}`));
    };

    const removeDocument = async () => {
        await entities.ConsentForm.update(form.id, { document_url: "" });
        queryClient.invalidateQueries({ queryKey: ['consentForms'] });
    };

    const saveAsTemplate = async () => {
        try {
            await entities.FormTemplate.create({
                template_name: form.form_name, template_type: "ConsentForm", category: form.form_type,
                description: `Template created from ${form.form_name}`, content: form.content,
                metadata: "{}", tags: form.tags || "[]", usage_count: 0, is_public: true
            });
            toast.success("Template created!");
        } catch (error) { toast.error("Failed to create template"); }
    };

    const duplicateForm = async () => {
        try {
            const duplicated = await entities.ConsentForm.create({
                ...form, id: undefined, form_name: `${form.form_name} (Copy)`,
                created_date: undefined, updated_date: undefined, parent_id: undefined
            });
            toast.success("Form duplicated!");
            navigate(createPageUrl(`ConsentFormDetail?id=${duplicated.id}`));
        } catch (error) { toast.error("Failed to duplicate"); }
    };

    React.useEffect(() => {
        if (form && autoPrint) {
            setTimeout(() => {
                const docEl = document.querySelector('.doc-page');
                if (!docEl) return;
                const content = docEl.innerHTML;
                const css = `@page { size: letter; margin: 0; } * { box-sizing: border-box; margin: 0; padding: 0; } html, body { width: 8.5in; height: 11in; overflow: hidden; background: white; font-family: Arial, sans-serif; font-size: 10pt; color: #1a1a1a; line-height: 1.4; } .page { width: 8.5in; min-height: 11in; padding: 0.4in 0.55in; overflow: hidden; } h1, h2, h3 { font-weight: 700; color: #5b21b6; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #ede9fe; padding-bottom: 3px; margin: 12px 0 7px; } p { margin-bottom: 6px; } ul, ol { margin: 3px 0 7px 18px; } li { margin-bottom: 3px; } * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }`;
                const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + (form.form_name || 'Print') + '</title><style>' + css + '</style></head><body><div class="page">' + content + '</div></body></html>';
                const win = window.open('', '', 'width=850,height=1100,menubar=no,toolbar=no,location=no,status=no,scrollbars=no');
                win.document.write(html);
                win.document.close();
                win.focus();
                setTimeout(function(){ win.print(); }, 600);
            }, 500);
        }
    }, [form, autoPrint]);

    if (!form) {
        return <div className="flex items-center justify-center py-20"><div className="animate-pulse text-gray-400 text-lg">Loading form...</div></div>;
    }

    const tags = safeParse(form.tags);

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
                        className={form.is_favorite ? "border-yellow-400 text-yellow-600 bg-yellow-50" : ""}>
                        <Star className={`w-4 h-4 mr-1.5 ${form.is_favorite ? 'fill-yellow-500' : ''}`} />
                    </Button>
                    {can("consent", "edit") && (
                        <>
                            <Button variant="outline" size="sm" onClick={duplicateForm}>
                                <Files className="w-4 h-4 mr-1.5" /> Duplicate
                            </Button>
                            <Button variant="outline" size="sm" onClick={saveAsTemplate}>
                                <Save className="w-4 h-4 mr-1.5" /> Template
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setShowTagManager(true)}>
                                <Tag className="w-4 h-4 mr-1.5" /> Tags
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setShowVersionHistory(true)}>
                                <History className="w-4 h-4 mr-1.5" /> History
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setShowNewVersionDialog(true)}>
                                <Copy className="w-4 h-4 mr-1.5" /> New Version
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setShowEditForm(true)}>
                                <Pencil className="w-4 h-4 mr-1.5" /> Edit
                            </Button>
                        </>
                    )}
                    {can("consent", "delete") && (
                        <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(true)} className="border-red-300 text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4 mr-1.5" />
                        </Button>
                    )}
                    <Button size="sm" onClick={() => {
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
                            table { width: 100%; border-collapse: collapse; margin: 4pt 0; }
                            td, th { border: 1px solid #ede9fe; padding: 3pt 6pt; }
                            mark { background-color: #fef08a !important; }
                            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        `;
                        const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + (form.form_name || 'Print') + '</title><style>' + css + '</style></head><body><div class="page">' + content + '</div></body></html>';
                        const win = window.open('', '', 'width=850,height=1100,menubar=no,toolbar=no,location=no,status=no,scrollbars=no');
                        win.document.write(html);
                        win.document.close();
                        win.focus();
                        setTimeout(function(){ win.print(); }, 600);
                    }} className="bg-purple-600 hover:bg-purple-700 text-white">
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
                        <div style={{ fontSize: '14pt', fontWeight: '700', color: '#5b21b6', fontFamily: 'Arial, sans-serif', lineHeight: '1.2' }}>{form.form_name}</div>
                        <div style={{ fontSize: '8pt', color: '#6b7280', fontFamily: 'Arial, sans-serif', marginTop: '2px' }}>Contemporary Health Center | Fort Myers, FL</div>
                    </div>
                </div>

                {/* Metadata - hidden from view/print */}

                {/* Form Content */}
                <div className="mb-6">
                    <div
                        className="consent-content"
                        style={{ fontSize: '10pt', lineHeight: '1.35' }}
                        dangerouslySetInnerHTML={{ __html: (() => {
                            let html = form.content || '';
                            // Strip duplicate header if content already includes CHC logo/header
                            // Remove leading logo/header div (matches the CHC logo block injected by batch import)
                            html = html.replace(/^<div[^>]*style="text-align:\s*center[^"]*"[^>]*>\s*<img[^>]*Contemporary[^>]*>[\s\S]*?<\/div>\s*/i, '');
                            // Remove leading h1/h2 that matches the form name (avoid double title)
                            const escapedName = form.form_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            html = html.replace(new RegExp('^\\s*<h[12][^>]*>[^<]*' + escapedName.substring(0, 20) + '[\\s\\S]*?<\\/h[12]>\\s*', 'i'), '');
                            return html;
                        })() }}
                    />
                </div>

                {/* Content Styling */}
                <style>{`
                    .consent-content h1, .consent-content h2, .consent-content h3 {
                        font-family: Arial, sans-serif;
                        font-weight: 700; color: #5b21b6; text-transform: uppercase;
                        letter-spacing: 0.5px; border-bottom: 1px solid #ede9fe;
                        padding-bottom: 3px; margin: 12px 0 7px;
                    }
                    .consent-content h1 { font-size: 11pt; }
                    .consent-content h2 { font-size: 10pt; }
                    .consent-content h3 { font-size: 9pt; }
                    .consent-content ul, .consent-content ol {
                        margin: 3px 0 7px 18px; padding-left: 0;
                    }
                    .consent-content li { margin-bottom: 3px; line-height: 1.4; }
                    .consent-content p { margin-bottom: 6px; }
                    .consent-content strong { font-weight: 700; }
                    .consent-content table { width: 100%; border-collapse: collapse; margin: 4pt 0; }
                    .consent-content td, .consent-content th { border: 1px solid #ede9fe; padding: 3pt 6pt; }
                `}</style>

                {/* Signature Lines - only show if content doesn't already have them */}
                {!/(signature|sign here|patient.*date|printed name)/i.test(form.content || '') && (
                <div style={{ marginTop: '16px' }} className="print-avoid">
                    <div style={{ fontSize: '10pt', fontWeight: '700', color: '#5b21b6', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #ede9fe', paddingBottom: '3px', marginBottom: '10px', fontFamily: 'Arial, sans-serif' }}>Signatures</div>
                    {[["Patient Signature", "Date"], ["Witness Signature", "Date"]].map(([left, right], i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '6px 16px', marginBottom: '12px', alignItems: 'end' }}>
                            <div>
                                <div style={{ borderBottom: '1.5px solid #374151', minHeight: '24px', marginBottom: '2px' }}>&nbsp;</div>
                                <div style={{ fontSize: '8pt', color: '#374151', fontWeight: '600', fontFamily: 'Arial, sans-serif' }}>{left}</div>
                            </div>
                            <div>
                                <div style={{ borderBottom: '1.5px solid #374151', minHeight: '24px', marginBottom: '2px' }}>&nbsp;</div>
                                <div style={{ fontSize: '8pt', color: '#374151', fontWeight: '600', fontFamily: 'Arial, sans-serif' }}>{right}</div>
                            </div>
                        </div>
                    ))}
                </div>
                )}

                {/* Footer */}
                <div style={{ marginTop: '14px', borderTop: '1px solid #e5e7eb', paddingTop: '5px', fontSize: '7.5pt', color: '#9ca3af', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
                    Contemporary Health Center &nbsp;|&nbsp; 6150 Diamond Center Court #400, Fort Myers, FL 33912 &nbsp;|&nbsp; Ph: 239-561-9191 &nbsp;|&nbsp; Fx: 239-561-9188
                </div>
            </div>

            {/* Print page number footer - shows on every printed page via position:fixed */}
            <div className="print-page-number" style={{ display: 'none' }}>
                {form.form_name} — Contemporary Health Center
            </div>

            {/* Attached Document */}
            {form.document_url && (
                <Card className="bg-slate-50 border-slate-200 mt-6 no-print">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <FileText className="w-6 h-6 text-slate-600" />
                                <div>
                                    <p className="font-semibold text-slate-900">Attached Document (PDF)</p>
                                    <p className="text-sm text-slate-600">View, print, or download</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <a href={form.document_url} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="sm"><Printer className="w-4 h-4 mr-2" /> Open PDF</Button>
                                </a>
                                <Button variant="outline" size="sm" onClick={removeDocument} className="text-red-600 hover:bg-red-50">
                                    <Trash2 className="w-4 h-4 mr-2" /> Remove
                                </Button>
                            </div>
                        </div>
                        <iframe src={form.document_url} className="w-full h-[600px] border-2 border-slate-300 rounded-lg" title="Document Preview" />
                    </CardContent>
                </Card>
            )}

            {form && (
                <>
                    <ConsentFormForm open={showEditForm} onOpenChange={setShowEditForm} onSuccess={handleSuccess} editForm={form} />
                    <VersionHistory open={showVersionHistory} onOpenChange={setShowVersionHistory} currentItem={form} entityName="ConsentForm" onViewVersion={viewVersion} />
                    <TagManager open={showTagManager} onOpenChange={setShowTagManager} currentTags={form.tags || "[]"} onSave={handleSaveTags} />
                </>
            )}

            <AlertDialog open={showNewVersionDialog} onOpenChange={setShowNewVersionDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Create New Version</AlertDialogTitle>
                        <AlertDialogDescription>This will create a new editable version while preserving this one in history.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={createNewVersion} className="bg-blue-600 hover:bg-blue-700">Create Version</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Consent Form?</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to delete "{form?.form_name}"? This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Undo Toast */}
            {showUndoToast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 no-print">
                    <div className="bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4">
                        <span className="text-sm">Form updated</span>
                        <button
                            onClick={handleUndo}
                            className="flex items-center gap-1.5 bg-white text-gray-900 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
                        >
                            <Undo2 className="w-3.5 h-3.5" /> Undo
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
