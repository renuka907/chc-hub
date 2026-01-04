import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PrintableDocument from "../components/PrintableDocument";
import ConsentFormForm from "../components/ConsentFormForm";
import { openPrintWindow } from "../components/PrintHelper";
import { Printer, ArrowLeft, Pencil, Star, FileText, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function ConsentFormDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const formId = urlParams.get('id');
    const [showEditForm, setShowEditForm] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { data: forms = [] } = useQuery({
        queryKey: ['consentForms'],
        queryFn: () => base44.entities.ConsentForm.list(),
    });

    const form = forms.find(f => f.id === formId);

    const handleSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['consentForms'] });
        setShowEditForm(false);
    };

    const toggleFavorite = async () => {
        await base44.entities.ConsentForm.update(form.id, { is_favorite: !form.is_favorite });
        queryClient.invalidateQueries({ queryKey: ['consentForms'] });
    };

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.ConsentForm.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['consentForms'] });
            navigate(createPageUrl("AftercareLibrary"));
        }
    });

    const handleDelete = () => {
        deleteMutation.mutate(form.id);
        setShowDeleteDialog(false);
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
                    <Button variant="outline" onClick={() => setShowDeleteDialog(true)} className="border-red-300 text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                    </Button>
                    <Button onClick={openPrintWindow} className="bg-blue-600 hover:bg-blue-700">
                        <Printer className="w-4 h-4 mr-2" />
                        Print / PDF
                    </Button>
                </div>
            </div>

            {/* Printable Content */}
            <PrintableDocument title="" showLogo={false}>
                <div 
                    className="text-black"
                    style={{
                        fontSize: '11pt',
                        fontFamily: 'Times New Roman, serif',
                        lineHeight: '1.4',
                        textAlign: 'left'
                    }}
                    dangerouslySetInnerHTML={{ __html: form.content }}
                />
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
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(form.document_url, '_blank')}
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                Print PDF
                            </Button>
                        </div>
                        <embed 
                            src={form.document_url}
                            type="application/pdf"
                            className="w-full h-[600px] border-2 border-slate-300 rounded-lg"
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

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Consent Form?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{form?.form_name}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            </div>
            );
            }