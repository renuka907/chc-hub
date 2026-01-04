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
            <PrintableDocument title="" showLogo={false}>
                <div className="whitespace-pre-wrap text-black text-sm leading-relaxed" style={{lineHeight: '1.6', fontFamily: 'Times New Roman, serif'}}>
                    {form.content}
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
                            src={`${form.document_url}#view=FitH&toolbar=1&navpanes=0`}
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