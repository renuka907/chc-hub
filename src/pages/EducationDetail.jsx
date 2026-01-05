import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import PrintableDocument from "../components/PrintableDocument";
import EducationTopicForm from "../components/EducationTopicForm";
import { openPrintWindow } from "../components/PrintHelper";
import { Printer, ArrowLeft, Calendar, ExternalLink, Pencil, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function EducationDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const topicId = urlParams.get('id');
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

    if (!topic) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Loading topic...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
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
                    <Button onClick={openPrintWindow} className="bg-blue-600 hover:bg-blue-700">
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
                        <div 
                            className="text-gray-800 leading-relaxed education-content"
                            dangerouslySetInnerHTML={{ __html: topic.content }}
                        />
                        <style>{`
                            .education-content ul {
                                background: linear-gradient(to right, #f0f9ff, #e0f2fe);
                                border-left: 4px solid #0ea5e9;
                                padding: 1.5rem;
                                border-radius: 0.5rem;
                                margin: 2rem 0;
                                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                            }
                            .education-content ol {
                                background: linear-gradient(to right, #faf5ff, #f3e8ff);
                                border-left: 4px solid #a855f7;
                                padding: 1.5rem;
                                border-radius: 0.5rem;
                                margin: 2rem 0;
                                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                            }
                            .education-content li {
                                margin: 0.75rem 0;
                                padding-left: 0.5rem;
                                line-height: 1.7;
                            }
                            .education-content h3 {
                                color: #1e293b;
                                font-size: 1.5rem;
                                font-weight: 700;
                                margin-top: 3rem;
                                margin-bottom: 1.25rem;
                                padding-bottom: 0.5rem;
                                border-bottom: 2px solid #e2e8f0;
                            }
                            .education-content h4 {
                                color: #334155;
                                font-size: 1.25rem;
                                font-weight: 600;
                                margin-top: 2rem;
                                margin-bottom: 1rem;
                            }
                            .education-content p {
                                margin-bottom: 1.5rem;
                                line-height: 1.8;
                                font-size: 1.05rem;
                            }
                            .education-content strong {
                                color: #1e293b;
                                font-weight: 600;
                            }
                        `}</style>
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