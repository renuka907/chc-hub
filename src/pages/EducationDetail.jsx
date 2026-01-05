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
                        .no-print {
                            display: none !important;
                        }
                        .printable-document h1 {
                            font-size: 18pt !important;
                            margin-bottom: 12pt !important;
                            page-break-after: avoid !important;
                        }
                        .printable-document h3 {
                            font-size: 14pt !important;
                            margin-bottom: 8pt !important;
                            margin-top: 12pt !important;
                            page-break-after: avoid !important;
                        }
                        .printable-document p {
                            margin-bottom: 8pt !important;
                            orphans: 3 !important;
                            widows: 3 !important;
                        }
                        .printable-document img {
                            max-width: 100% !important;
                            max-height: 4in !important;
                            page-break-inside: avoid !important;
                            display: block !important;
                            margin: 12pt auto !important;
                        }
                        .printable-document .bg-blue-50 {
                            background-color: #f0f4f8 !important;
                            border: 1px solid #ccc !important;
                            padding: 10pt !important;
                            margin-bottom: 12pt !important;
                            page-break-inside: avoid !important;
                        }
                        .printable-document .bg-slate-50 {
                            background-color: #f5f5f5 !important;
                            border: 1px solid #ccc !important;
                            padding: 10pt !important;
                            margin-top: 12pt !important;
                            page-break-inside: avoid !important;
                        }
                        .printable-document ul,
                        .printable-document ol {
                            margin-bottom: 8pt !important;
                            padding-left: 20pt !important;
                        }
                        .printable-document li {
                            margin-bottom: 4pt !important;
                        }
                        .printable-document .border-t {
                            border-top: 1px solid #ddd !important;
                            padding-top: 12pt !important;
                            margin-top: 12pt !important;
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

            {/* Printable Content */}
            <PrintableDocument title={topic.title}>
                <div className="space-y-6">
                    {/* Metadata */}
                    <div className="flex flex-wrap gap-3 items-center">
                        <Badge className={`${categoryColors[topic.category]} text-sm px-3 py-1`}>
                            {topic.category}
                        </Badge>
                        {topic.last_reviewed && (
                            <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="w-4 h-4 mr-1" />
                                Last Reviewed: {new Date(topic.last_reviewed).toLocaleDateString()}
                            </div>
                        )}
                    </div>

                    {/* Image */}
                    {topic.image_url && (
                        <div className="my-6">
                            <img 
                                src={topic.image_url} 
                                alt={topic.title}
                                className="w-full max-w-2xl mx-auto rounded-lg"
                            />
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