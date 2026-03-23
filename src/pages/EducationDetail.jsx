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

    React.useEffect(() => {
        if (topic && autoPrint) { setTimeout(() => window.print(), 500); }
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
                    Patient Education: {topic.title}
                </h1>

                {/* Category & Version */}
                <div className="flex items-center justify-center gap-3 mb-6 text-xs text-gray-500">
                    {topic.category && <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{topic.category}</span>}
                    {topic.version && <span>Version {topic.version}</span>}
                    {topic.updated_date && <span>Updated {new Date(topic.updated_date).toLocaleDateString()}</span>}
                </div>

                {/* Summary */}
                {topic.summary && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded px-5 py-4 mb-6 print-section">
                        <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-1">Summary</h2>
                        <p className="text-emerald-900" style={{ fontSize: '11pt' }}>{topic.summary}</p>
                    </div>
                )}

                {/* Image */}
                {topic.image_url && (
                    <div className="text-center mb-6">
                        <img src={topic.image_url} alt={topic.title} className="max-h-72 mx-auto rounded border border-gray-200" />
                    </div>
                )}

                {/* Main Content */}
                <div className="mb-6">
                    {topic.content?.includes('<') ? (
                        <div
                            className="education-content"
                            style={{ fontSize: '11pt', lineHeight: '1.8' }}
                            dangerouslySetInnerHTML={{ __html: topic.content }}
                        />
                    ) : (
                        <div className="whitespace-pre-wrap" style={{ fontSize: '11pt', lineHeight: '1.8' }}>{topic.content}</div>
                    )}
                </div>

                {/* Content Styling */}
                <style>{`
                    .education-content h2, .education-content h3 {
                        font-size: 14pt; font-weight: bold; margin-top: 18pt; margin-bottom: 8pt;
                        padding-bottom: 4pt; border-bottom: 1px solid #ddd;
                    }
                    .education-content h3 { font-size: 13pt; }
                    .education-content ul, .education-content ol {
                        margin: 8pt 0; padding-left: 24pt;
                    }
                    .education-content li { margin-bottom: 6pt; line-height: 1.8; }
                    .education-content p { margin-bottom: 8pt; }
                    .education-content strong { font-weight: 700; }
                `}</style>

                {/* Medical References */}
                {topic.medical_references && (
                    <div className="border border-gray-200 rounded px-5 py-4 mb-6 bg-gray-50 print-section">
                        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <ExternalLink className="w-3.5 h-3.5 no-print" /> Medical References
                        </h2>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap" style={{ lineHeight: '1.7' }}>
                            {topic.medical_references}
                        </p>
                    </div>
                )}

                {/* Disclaimer */}
                <div className="border-t border-gray-300 pt-4 mb-6 print-avoid">
                    <p className="text-xs text-gray-500 italic leading-relaxed">
                        <strong>Disclaimer:</strong> This information is for educational purposes only and should not replace professional medical advice. Please consult with a healthcare provider for personalized medical guidance.
                    </p>
                </div>

                {/* Contact Section */}
                <div className="bg-slate-50 border border-slate-200 rounded px-5 py-4 print-section">
                    <h3 className="font-bold text-sm uppercase tracking-wider mb-2">Questions or Want to Learn More?</h3>
                    <p className="text-sm text-slate-600 mb-3">Our medical team is here to help answer any questions about this topic or discuss treatment options.</p>
                    <div className="border-t border-slate-200 pt-3 space-y-1 text-sm font-semibold text-slate-700">
                        <p>📞 Phone: 239-561-9191 (call or text)</p>
                        <p>📧 Email: office@contemporaryhealthcenter.com</p>
                        <p>🌐 Web: contemporaryhealthcenter.com</p>
                    </div>
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
