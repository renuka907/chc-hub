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
                            margin: 0.15in 0.5in 0.5in 0.5in;
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
                        .print-header-table,
                        .print-header-table * {
                            visibility: visible;
                        }
                        .printable-document,
                        .printable-document * {
                            visibility: visible;
                        }
                        .print-header-table {
                            display: table !important;
                            width: 100% !important;
                            position: static !important;
                        }
                        .print-header-table thead {
                            display: table-header-group !important;
                        }
                        .print-header-table tbody {
                            display: table-row-group !important;
                        }
                        .print-header-row {
                            text-align: center !important;
                            padding-bottom: 10pt !important;
                            padding-top: 8pt !important;
                            border-bottom: 1px solid #ccc !important;
                        }
                        .print-header-row img {
                            height: 40pt !important;
                            margin: 0 auto 6pt !important;
                            display: block !important;
                        }
                        .print-header-row .header-info {
                            font-size: 8pt !important;
                            color: #666 !important;
                            line-height: 1.3 !important;
                        }
                        .printable-document {
                            position: static !important;
                            width: 100% !important;
                            max-width: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            font-family: 'Times New Roman', serif !important;
                            font-size: 11pt !important;
                            line-height: 1.6 !important;
                            color: #000 !important;
                        }
                        .printable-document > div:first-child {
                            margin-top: 0 !important;
                            padding-top: 0 !important;
                        }
                        .printable-document > div > .mb-4:first-child {
                            display: none !important;
                        }
                        .printable-document img:first-of-type {
                            display: none !important;
                        }
                        .printable-document > div > .mb-6:first-child {
                            display: none !important;
                        }
                        .printable-document h1 {
                            font-size: 18pt !important;
                            font-weight: bold !important;
                            margin-top: 0 !important;
                            margin-bottom: 14pt !important;
                            page-break-after: avoid !important;
                            orphans: 3 !important;
                            widows: 3 !important;
                            text-align: center !important;
                            border-bottom: 2px solid #000 !important;
                            padding-bottom: 8pt !important;
                        }
                        .printable-document h2 {
                            font-size: 14pt !important;
                            font-weight: bold !important;
                            margin-top: 16pt !important;
                            margin-bottom: 10pt !important;
                            page-break-after: avoid !important;
                            orphans: 3 !important;
                            widows: 3 !important;
                        }
                        .printable-document h3 {
                            font-size: 12pt !important;
                            font-weight: bold !important;
                            margin-top: 12pt !important;
                            margin-bottom: 8pt !important;
                            page-break-after: avoid !important;
                            orphans: 3 !important;
                            widows: 3 !important;
                        }
                        .printable-document p {
                            margin-bottom: 10pt !important;
                            orphans: 3 !important;
                            widows: 3 !important;
                            text-align: justify !important;
                        }
                        .printable-document li {
                            margin-bottom: 6pt !important;
                            orphans: 2 !important;
                            widows: 2 !important;
                        }
                        .printable-document ul,
                        .printable-document ol {
                            margin-bottom: 10pt !important;
                            padding-left: 24pt !important;
                            page-break-inside: avoid !important;
                        }
                        .printable-document img {
                            max-width: 100% !important;
                            max-height: 3.5in !important;
                            page-break-inside: avoid !important;
                            page-break-before: auto !important;
                            page-break-after: auto !important;
                            display: block !important;
                            margin: 14pt auto !important;
                        }
                        .printable-document .bg-blue-50,
                        .printable-document .bg-slate-50 {
                            background: #f8f9fa !important;
                            border: 1px solid #ddd !important;
                            padding: 12pt !important;
                            margin: 10pt 0 !important;
                            page-break-inside: avoid !important;
                        }
                        .printable-document .card,
                        .printable-document [class*="Card"] {
                            border: 1px solid #ddd !important;
                            padding: 12pt !important;
                            margin: 10pt 0 !important;
                            page-break-inside: avoid !important;
                        }
                        .printable-document .badge,
                        .printable-document [class*="Badge"] {
                            border: 1px solid #000 !important;
                            padding: 2pt 6pt !important;
                            font-size: 9pt !important;
                        }
                        .no-print {
                            display: none !important;
                        }
                        .no-print-screen {
                            display: none;
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

            {/* Printable Content with repeating header */}
            <table className="print-header-table">
                <thead className="no-print">
                    <tr>
                        <th className="print-header-row">
                            <img 
                                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695939a556b8082002a35a68/1e5584b38_goldwithlettersContemporary-health-center-logo-retina.png"
                                alt="Contemporary Health Center Logo"
                            />
                            <div className="header-info">
                                <div style={{fontWeight: 600}}>6150 Diamond Center Court #400, Fort Myers, FL 33912</div>
                                <div style={{marginTop: '2pt'}}>Phone: 239-561-9191 | Fax: 239-561-9188</div>
                                <div style={{marginTop: '2pt'}}>contemporaryhealthcenter.com</div>
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
            <PrintableDocument title={topic.title} showLogo={false}>
                <div className="space-y-6">
                    {/* Metadata */}
                    {topic.last_reviewed && (
                        <div className="flex items-center text-sm text-gray-600 mb-4">
                            <Calendar className="w-4 h-4 mr-1" />
                            Last Reviewed: {new Date(topic.last_reviewed).toLocaleDateString()}
                        </div>
                    )}

                    {/* Summary */}
                    {topic.summary && (
                        <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="pt-6">
                                <p className="text-gray-800 font-medium">{topic.summary}</p>
                            </CardContent>
                        </Card>
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
                        <Card className="bg-slate-50 border-slate-200">
                            <CardContent className="pt-6">
                                <div className="flex items-start space-x-2">
                                    <ExternalLink className="w-5 h-5 text-slate-600 mt-1 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-semibold text-slate-900 mb-2">Medical References</h3>
                                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                            {topic.medical_references}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Disclaimer */}
                    <div className="text-xs text-gray-500 italic border-t pt-4 mt-8">
                        <p>This information is for educational purposes only and should not replace professional medical advice. Please consult with a healthcare provider for personalized medical guidance.</p>
                    </div>
                </div>
            </PrintableDocument>
                        </td>
                    </tr>
                </tbody>
            </table>

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