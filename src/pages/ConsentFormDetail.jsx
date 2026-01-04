import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PrintableDocument from "../components/PrintableDocument";
import ConsentFormForm from "../components/ConsentFormForm";
import { openPrintWindow } from "../components/PrintHelper";
import { Printer, ArrowLeft, Pencil, Star, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Card, CardContent } from "@/components/ui/card";

export default function ConsentFormDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const formId = urlParams.get('id');
    const [showEditForm, setShowEditForm] = useState(false);
    const queryClient = useQueryClient();

    const { data: forms = [] } = useQuery({
        queryKey: ['consentForms'],
        queryFn: () => base44.entities.ConsentForm.list(),
    });

    const form = forms.find(f => f.id === formId);

    const handleSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['consentForms'] });
    };

    const toggleFavorite = async () => {
        await base44.entities.ConsentForm.update(form.id, { is_favorite: !form.is_favorite });
        queryClient.invalidateQueries({ queryKey: ['consentForms'] });
    };

    const formTypeColors = {
        "Procedure": "bg-blue-100 text-blue-800",
        "Treatment": "bg-purple-100 text-purple-800",
        "General": "bg-gray-100 text-gray-800",
        "HIPAA": "bg-green-100 text-green-800",
        "Financial": "bg-amber-100 text-amber-800"
    };

    if (!form) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Loading form...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex items-center justify-between no-print">
                <Link to={createPageUrl("AftercareLibrary")}>
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Library
                    </Button>
                </Link>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        onClick={toggleFavorite}
                        className={form.is_favorite ? "border-yellow-500 text-yellow-600" : ""}
                    >
                        <Star className={`w-4 h-4 mr-2 ${form.is_favorite ? 'fill-yellow-500' : ''}`} />
                        {form.is_favorite ? 'Unfavorite' : 'Favorite'}
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
            <PrintableDocument title={form.form_name}>
                <div className="space-y-6">
                    {/* Metadata */}
                    <div className="flex flex-wrap gap-3 items-center">
                        <Badge className={`${formTypeColors[form.form_type]} text-sm px-3 py-1`}>
                            {form.form_type} Form
                        </Badge>
                        {form.version && (
                            <Badge variant="outline">Version {form.version}</Badge>
                        )}
                        {form.effective_date && (
                            <span className="text-sm text-gray-600">
                                Effective: {new Date(form.effective_date).toLocaleDateString()}
                            </span>
                        )}
                    </div>

                    {/* Image */}
                    {form.image_url && (
                        <div className="my-6">
                            <img 
                                src={form.image_url} 
                                alt={form.form_name}
                                className="w-full max-w-2xl mx-auto rounded-lg"
                            />
                        </div>
                    )}

                    {/* Form Content */}
                    <div className="whitespace-pre-wrap text-gray-900 leading-loose text-sm border-t-2 border-gray-300 pt-6" style={{lineHeight: '1.8'}}>
                        {form.content}
                    </div>

                    {/* Signature Section */}
                    <div className="border-t-2 border-gray-800 pt-8 mt-12 space-y-10">
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <label className="text-xs text-gray-700 font-semibold uppercase tracking-wide block mb-2">Patient Name (Print)</label>
                                <div className="border-b-2 border-gray-800 h-8"></div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-700 font-semibold uppercase tracking-wide block mb-2">Date of Birth</label>
                                <div className="border-b-2 border-gray-800 h-8"></div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-gray-700 font-semibold uppercase tracking-wide block mb-2">Patient Signature</label>
                            <div className="border-b-2 border-gray-800 h-12 mb-2"></div>
                            <div className="text-xs text-gray-600">Date: _____________________</div>
                        </div>

                        <div>
                            <label className="text-xs text-gray-700 font-semibold uppercase tracking-wide block mb-2">Witness/Staff Signature</label>
                            <div className="border-b-2 border-gray-800 h-12 mb-2"></div>
                            <div className="text-xs text-gray-600">Date: _____________________</div>
                        </div>
                    </div>
                </div>
            </PrintableDocument>

            {/* Uploaded Document - Outside printable section, at the very bottom */}
            {form.document_url && (
                <Card className="bg-slate-50 border-slate-200 no-print">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <FileText className="w-6 h-6 text-slate-600" />
                                <div>
                                    <p className="font-semibold text-slate-900">Attached Document (PDF)</p>
                                    <p className="text-sm text-slate-600">View, print, or download the full document</p>
                                </div>
                            </div>
                            <a 
                                href={form.document_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                            >
                                <Button variant="outline" size="sm">
                                    <Printer className="w-4 h-4 mr-2" />
                                    Open PDF
                                </Button>
                            </a>
                        </div>
                        <iframe 
                            src={form.document_url}
                            className="w-full h-96 border-2 border-slate-300 rounded-lg"
                            title="Document Preview"
                        />
                    </CardContent>
                </Card>
            )}

            {form && (
                <ConsentFormForm
                    open={showEditForm}
                    onOpenChange={setShowEditForm}
                    onSuccess={handleSuccess}
                    editForm={form}
                />
            )}
        </div>
    );
}