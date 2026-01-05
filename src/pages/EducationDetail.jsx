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
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg print:bg-blue-50">
                            <h3 className="font-semibold text-blue-900 mb-3 text-lg">Overview</h3>
                            <p className="text-gray-800 leading-relaxed">{topic.summary}</p>
                        </div>
                    )}

                    {/* Main Content */}
                    <div className="bg-white border-l-4 border-gray-300 p-6 rounded-lg print:bg-white">
                        <h3 className="font-semibold text-gray-900 mb-4 text-lg">Detailed Information</h3>
                        <div 
                            className="prose max-w-none text-gray-800 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: topic.content }}
                        />
                    </div>

                    {/* Medical References */}
                    {topic.medical_references && (
                        <div className="bg-slate-50 border-l-4 border-slate-400 p-6 rounded-lg print:bg-slate-50">
                            <div className="flex items-start space-x-2">
                                <ExternalLink className="w-5 h-5 text-slate-600 mt-1 flex-shrink-0" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-slate-900 mb-3 text-lg">Medical References</h3>
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                        {topic.medical_references}
                                    </p>
                                </div>
                            </div>
                        </div>
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