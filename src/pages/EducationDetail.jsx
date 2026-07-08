import React, { useState } from "react";
import { entities, uploadFile, invokeLLM, generateImage, sendEmail, agentChat, getCurrentUser } from "@/api/supabaseHelpers";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EducationTopicForm from "../components/EducationTopicForm";
import EducationPrintDialog from "../components/library/EducationPrintDialog";
import EducationVersionHistory from "../components/education/EducationVersionHistory";
import { Printer, ArrowLeft, ExternalLink, Pencil, Star, History, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { stripDuplicateChcBranding } from "../utils/printSanitizer";

const CHC_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695939a556b8082002a35a68/1e5584b38_goldwithlettersContemporary-health-center-logo-retina.png";

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

export default function EducationDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const topicId = urlParams.get('id');
    const autoPrint = urlParams.get('autoprint') === 'true';
    const [showEditForm, setShowEditForm] = useState(false);
    const [showPrintDialog, setShowPrintDialog] = useState(false);
    const [showVersionHistory, setShowVersionHistory] = useState(false);
    const queryClient = useQueryClient();

    const { data: topics = [] } = useQuery({
        queryKey: ['educationTopics'],
        queryFn: () => entities.EducationTopic.list(),
    });

    const { data: currentUser } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => getCurrentUser()
    });

    const topic = topics.find(t => t.id === topicId);
    const isAdmin = currentUser?.role === 'admin';

    const handleSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['educationTopics'] });
        queryClient.invalidateQueries({ queryKey: ['education-topics'] });
    };

    const handleRestoreVersion = async (version) => {
        const restoredData = {
            ...version,
            parent_id: topic.id,
            version: topic.version ? `${parseFloat(topic.version) + 0.1}` : "1.1",
            change_summary: `Restored from version ${version.version || 'previous'}`,
            is_favorite: topic.is_favorite
        };
        delete restoredData.id;
        delete restoredData.created_date;
        delete restoredData.updated_date;
        await entities.EducationTopic.create(restoredData);
        queryClient.invalidateQueries({ queryKey: ['educationTopics'] });
    };

    const toggleFavorite = async () => {
        await entities.EducationTopic.update(topic.id, { is_favorite: !topic.is_favorite });
        queryClient.invalidateQueries({ queryKey: ['educationTopics'] });
    };

    const handleDelete = async () => {
        if (!isAdmin) { alert('Only administrators can delete education topics'); return; }
        if (confirm(`Are you sure you want to delete "${topic.title}"? This action cannot be undone.`)) {
            await entities.EducationTopic.delete(topic.id);
            queryClient.invalidateQueries({ queryKey: ['educationTopics'] });
            window.location.href = createPageUrl('Library');
        }
    };

    const handlePrint = () => {
        const docEl = document.querySelector('.doc-page');
        if (!docEl) return;
        const content = stripDuplicateChcBranding(docEl.innerHTML, { keepFirstLogo: true });
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
        const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + (topic.title || 'Print') + '</title><style>' + css + '</style></head><body><div class="page">' + content + '</div></body></html>';
        const win = window.open('', '', 'width=850,height=1100,menubar=no,toolbar=no,location=no,status=no,scrollbars=no');
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(function(){ win.print(); }, 600);
    };

    React.useEffect(() => {
        if (topic && autoPrint) { setTimeout(() => handlePrint(), 500); }
    }, [topic, autoPrint]);

    if (!topic) {
        return <div className="flex items-center justify-center py-20"><div className="animate-pulse text-gray-400 text-lg">Loading topic...</div></div>;
    }

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
                        className={topic.is_favorite ? "border-yellow-400 text-yellow-600 bg-yellow-50" : ""}>
                        <Star className={`w-4 h-4 mr-1.5 ${topic.is_favorite ? 'fill-yellow-500' : ''}`} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowVersionHistory(true)}>
                        <History className="w-4 h-4 mr-1.5" /> Versions
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowEditForm(true)}>
                        <Pencil className="w-4 h-4 mr-1.5" /> Edit
                    </Button>
                    {isAdmin && (
                        <Button variant="destructive" size="sm" onClick={handleDelete}>
                            <Trash2 className="w-4 h-4 mr-1.5" /> Delete
                        </Button>
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
                        <div style={{ fontSize: '14pt', fontWeight: '700', color: '#5b21b6', fontFamily: 'Arial, sans-serif', lineHeight: '1.2' }}>Patient Education: {topic.title}</div>
                        <div style={{ fontSize: '8pt', color: '#6b7280', fontFamily: 'Arial, sans-serif', marginTop: '2px' }}>Contemporary Health Center | Fort Myers, FL</div>
                    </div>
                </div>

                {/* Category & Version */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '12px', fontSize: '8pt', color: '#6b7280', fontFamily: 'Arial, sans-serif' }}>
                    {topic.category && <span style={{ background: '#f3f4f6', color: '#374151', padding: '1px 6px', borderRadius: '3px' }}>{topic.category}</span>}
                    {topic.version && <span>Version {topic.version}</span>}
                    {topic.updated_date && <span>Updated {new Date(topic.updated_date).toLocaleDateString()}</span>}
                </div>

                {/* Summary */}
                {topic.summary && (
                    <div style={{ border: '1px solid #ede9fe', borderRadius: '4px', padding: '8px 12px', marginBottom: '12px' }} className="print-section">
                        <div style={{ fontSize: '9pt', fontWeight: '700', color: '#5b21b6', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontFamily: 'Arial, sans-serif' }}>Summary</div>
                        <p style={{ fontSize: '10pt', marginBottom: '0', color: '#1a1a1a' }}>{topic.summary}</p>
                    </div>
                )}

                {/* Image */}
                {topic.image_url && (
                    <div className="text-center mb-6">
                        <img src={topic.image_url} alt={topic.title} className="max-h-72 mx-auto rounded border border-gray-200" />
                    </div>
                )}

                {/* Main Content */}
                <div style={{ marginBottom: '12px' }}>
                    {topic.content?.includes('<') ? (
                        <div
                            className="education-content"
                            style={{ fontSize: '10pt', lineHeight: '1.4' }}
                            dangerouslySetInnerHTML={{ __html: topic.content }}
                        />
                    ) : (
                        <div style={{ fontSize: '10pt', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>{topic.content}</div>
                    )}
                </div>

                {/* Content Styling */}
                <style>{`
                    .education-content h2, .education-content h3 {
                        font-family: Arial, sans-serif; font-weight: 700; color: #5b21b6; text-transform: uppercase;
                        letter-spacing: 0.5px; border-bottom: 1px solid #ede9fe; padding-bottom: 3px; margin: 12px 0 7px;
                    }
                    .education-content h2 { font-size: 10pt; }
                    .education-content h3 { font-size: 9pt; }
                    .education-content ul, .education-content ol {
                        margin: 3px 0 7px 18px; padding-left: 0;
                    }
                    .education-content li { margin-bottom: 3px; line-height: 1.4; }
                    .education-content p { margin-bottom: 6px; }
                    .education-content strong { font-weight: 700; }
                `}</style>

                {/* Medical References */}
                {topic.medical_references && (
                    <div style={{ border: '1px solid #ede9fe', borderRadius: '4px', padding: '8px 12px', marginBottom: '12px' }} className="print-section">
                        <div style={{ fontSize: '9pt', fontWeight: '700', color: '#5b21b6', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontFamily: 'Arial, sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ExternalLink className="w-3.5 h-3.5 no-print" /> Medical References
                        </div>
                        <p style={{ fontSize: '9pt', color: '#6b7280', whiteSpace: 'pre-wrap', lineHeight: '1.4', marginBottom: '0' }}>
                            {topic.medical_references}
                        </p>
                    </div>
                )}

                {/* Disclaimer */}
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '8px', marginBottom: '10px' }} className="print-avoid">
                    <p style={{ fontSize: '8pt', color: '#9ca3af', fontStyle: 'italic', lineHeight: '1.4', marginBottom: '0' }}>
                        <strong>Disclaimer:</strong> This information is for educational purposes only and should not replace professional medical advice. Please consult with a healthcare provider for personalized medical guidance.
                    </p>
                </div>

                {/* Footer */}
                <div style={{ marginTop: '14px', borderTop: '1px solid #e5e7eb', paddingTop: '5px', fontSize: '7.5pt', color: '#9ca3af', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
                    Contemporary Health Center &nbsp;|&nbsp; 6150 Diamond Center Court #400, Fort Myers, FL 33912 &nbsp;|&nbsp; Ph: 239-561-9191 &nbsp;|&nbsp; Fx: 239-561-9188
                </div>
            </div>

            {topic && (
                <>
                    <EducationTopicForm open={showEditForm} onOpenChange={setShowEditForm} onSuccess={handleSuccess} editTopic={topic} />
                    <EducationPrintDialog open={showPrintDialog} onOpenChange={setShowPrintDialog} topic={topic} onSuccess={handleSuccess} />
                    <EducationVersionHistory open={showVersionHistory} onOpenChange={setShowVersionHistory} topicId={topic.id} onRestore={handleRestoreVersion} />
                </>
            )}
        </div>
    );
}
