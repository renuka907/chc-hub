import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import PrintableDocument from "../components/PrintableDocument";
import EducationTopicForm from "../components/EducationTopicForm";
import { Printer, ArrowLeft, Calendar, ExternalLink, Pencil, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function EducationDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const topicId = urlParams.get('id');
    const autoPrint = urlParams.get('autoprint') === 'true';
    const [showEditForm, setShowEditForm] = useState(false);
    const queryClient = useQueryClient();

    const { data: topics = [] } = useQuery({
        queryKey: ['educationTopics'],
        queryFn: () => base44.entities.EducationTopic.list(),
    });

    const topic = topics.find(t => t.id === topicId);

    const handleSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['educationTopics'] });
    };

    const toggleFavorite = async () => {
        await base44.entities.EducationTopic.update(topic.id, { is_favorite: !topic.is_favorite });
        queryClient.invalidateQueries({ queryKey: ['educationTopics'] });
    };

    const categoryColors = {
        "Gynecology": "bg-pink-100 text-pink-800",
        "Hormone Replacement Therapy": "bg-purple-100 text-purple-800",
        "Mens Health": "bg-blue-100 text-blue-800",
        "Medication Education": "bg-green-100 text-green-800"
    };

    // Auto-trigger print when topic loads
    React.useEffect(() => {
        if (topic && autoPrint) {
            setTimeout(() => {
                window.print();
            }, 500);
        }
    }, [topic, autoPrint]);

    if (!topic) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Loading topic...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Print Styles */}
            <style>
                {`
                    @media print {
                        @page {
                            margin: 0.5in 0.5in 0.5in 0.5in;
                            size: letter;
                        }

                        body {
                            margin: 0;
                            padding: 0;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }

                        body * {
                            visibility: hidden;
                        }

                        .print-header,
                        .print-header * {
                            visibility: visible;
                        }

                        .print-content,
                        .print-content * {
                            visibility: visible;
                        }

                        .print-header {
                            position: fixed;
                            top: 0;
                            left: 0;
                            right: 0;
                            text-align: center;
                            padding: 12pt 0.5in;
                            background: white;
                            z-index: 9999;
                        }

                        .print-header img {
                            height: 36pt;
                            margin: 0 auto 4pt;
                            display: block;
                        }

                        .print-header .header-info {
                            font-size: 8pt;
                            color: #666;
                            line-height: 1.3;
                            font-family: 'Times New Roman', serif;
                        }

                        .print-content {
                            position: relative;
                            margin-top: 85pt;
                            font-family: 'Times New Roman', serif;
                            font-size: 11pt;
                            line-height: 1.6;
                            color: #000;
                        }

                        .print-content h1 {
                            font-size: 18pt;
                            font-weight: bold;
                            margin: 0 0 14pt 0;
                            text-align: center;
                            border-bottom: 2px solid #000;
                            padding-bottom: 8pt;
                            page-break-after: avoid;
                        }

                        .print-content h2 {
                            font-size: 14pt;
                            font-weight: bold;
                            margin: 16pt 0 10pt 0;
                            page-break-after: avoid;
                        }

                        .print-content h3 {
                            font-size: 12pt;
                            font-weight: bold;
                            margin: 12pt 0 8pt 0;
                            page-break-after: avoid;
                        }

                        .print-content p {
                            margin-bottom: 10pt;
                            text-align: justify;
                        }

                        .print-content ul,
                        .print-content ol {
                            margin-bottom: 10pt;
                            padding-left: 24pt;
                        }

                        .print-content li {
                            margin-bottom: 6pt;
                        }

                        .print-content .metadata {
                            font-size: 10pt;
                            margin-bottom: 12pt;
                        }

                        .print-content .summary-box {
                            background: #f8f9fa !important;
                            border: 1px solid #ddd !important;
                            padding: 12pt;
                            margin: 12pt 0;
                            page-break-inside: avoid;
                        }

                        .print-content .references-box {
                            background: #f8f9fa !important;
                            border: 1px solid #ddd !important;
                            padding: 12pt;
                            margin: 12pt 0;
                            page-break-inside: avoid;
                        }

                        .print-content .disclaimer {
                            font-size: 9pt;
                            color: #666;
                            border-top: 1px solid #ccc;
                            padding-top: 10pt;
                            margin-top: 20pt;
                        }

                        .no-print {
                            display: none !important;
                        }
                    }
                `}
            </style>

            {/* Action Bar */}
            <div className="flex items-center justify-between no-print">
                <Link to={createPageUrl("EducationLibrary")}>
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Library
                    </Button>
                </Link>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        onClick={toggleFavorite}
                        className={topic.is_favorite ? "border-yellow-500 text-yellow-600" : ""}
                    >
                        <Star className={`w-4 h-4 mr-2 ${topic.is_favorite ? 'fill-yellow-500' : ''}`} />
                        {topic.is_favorite ? 'Unfavorite' : 'Favorite'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowEditForm(true)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                    </Button>
                    <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700">
                        <Printer className="w-4 h-4 mr-2" />
                        Print / PDF
                    </Button>
                </div>
            </div>

            {/* Print Header (fixed position on print) */}
            <div className="print-header no-print-screen">
                <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695939a556b8082002a35a68/1e5584b38_goldwithlettersContemporary-health-center-logo-retina.png"
                    alt="Contemporary Health Center Logo"
                />
                <div className="header-info">
                    <div style={{fontWeight: 600}}>6150 Diamond Center Court #400, Fort Myers, FL 33912</div>
                    <div style={{marginTop: '2pt'}}>Phone: 239-561-9191 | Fax: 239-561-9188</div>
                    <div style={{marginTop: '2pt'}}>contemporaryhealthcenter.com</div>
                </div>
            </div>

            {/* Print Content */}
            <div className="print-content">
                <h1>{topic.title}</h1>

                {/* Metadata */}
                {topic.last_reviewed && (
                    <div className="metadata flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-1 no-print" />
                        Last Reviewed: {new Date(topic.last_reviewed).toLocaleDateString()}
                    </div>
                )}

                {/* Summary */}
                {topic.summary && (
                    <div className="summary-box">
                        <p className="text-gray-800 font-medium">{topic.summary}</p>
                    </div>
                )}

                {/* Main Content */}
                <div className="prose max-w-none">
                    {topic.content?.includes('<') ? (
                        <div 
                            className="text-gray-800 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: topic.content }}
                        />
                    ) : (
                        <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                            {topic.content}
                        </div>
                    )}
                </div>

                {/* Medical References */}
                {topic.medical_references && (
                    <div className="references-box">
                        <div className="flex items-start space-x-2">
                            <ExternalLink className="w-5 h-5 text-slate-600 mt-1 flex-shrink-0 no-print" />
                            <div>
                                <h3 className="font-semibold text-slate-900 mb-2">Medical References</h3>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                    {topic.medical_references}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Disclaimer */}
                <div className="disclaimer">
                    <p>This information is for educational purposes only and should not replace professional medical advice. Please consult with a healthcare provider for personalized medical guidance.</p>
                </div>
            </div>

            {topic && (
                <EducationTopicForm
                    open={showEditForm}
                    onOpenChange={setShowEditForm}
                    onSuccess={handleSuccess}
                    editTopic={topic}
                />
            )}
        </div>
    );
}