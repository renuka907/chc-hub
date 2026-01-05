import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Star, Printer, Clock, Package, Wrench, Loader2, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import ProcedureForm from "../components/procedures/ProcedureForm";
import PrintableDocument from "../components/PrintableDocument";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { usePermissions } from "../components/permissions/usePermissions";

export default function ProcedureDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const procedureId = urlParams.get("id");
    const [showEditForm, setShowEditForm] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const queryClient = useQueryClient();
    const { can } = usePermissions();

    const { data: procedures = [], isLoading } = useQuery({
        queryKey: ['procedures'],
        queryFn: () => base44.entities.Procedure.list(),
    });

    const procedure = procedures.find(p => p.id === procedureId);

    const toggleFavoriteMutation = useMutation({
        mutationFn: () =>
            base44.entities.Procedure.update(procedureId, { 
                is_favorite: !procedure.is_favorite 
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['procedures'] });
            toast.success(procedure.is_favorite ? "Removed from favorites" : "Added to favorites");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => base44.entities.Procedure.delete(procedureId),
        onSuccess: () => {
            toast.success("Procedure deleted");
            window.location.href = createPageUrl("ProceduresManagement");
        },
        onError: () => {
            toast.error("Failed to delete procedure");
        }
    });

    const handlePrint = () => {
        window.print();
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    if (!procedure) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Procedure not found</p>
                <Button asChild className="mt-4">
                    <Link to={createPageUrl("ProceduresManagement")}>
                        Back to Procedures
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <style>
                {`
                    @media print {
                        .no-print {
                            display: none !important;
                        }
                        body * {
                            visibility: hidden;
                        }
                        .printable-document, .printable-document * {
                            visibility: visible;
                        }
                        .printable-document {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                        }
                    }
                `}
            </style>

            {/* Action Bar */}
            <div className="flex justify-between items-center no-print">
                <Button variant="outline" asChild>
                    <Link to={createPageUrl("ProceduresManagement")}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Procedures
                    </Link>
                </Button>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => toggleFavoriteMutation.mutate()}
                        disabled={toggleFavoriteMutation.isPending}
                    >
                        <Star className={`w-4 h-4 ${procedure.is_favorite ? 'fill-current text-yellow-500' : ''}`} />
                    </Button>
                    {can('aftercare', 'edit') && (
                        <Button variant="outline" onClick={() => setShowEditForm(true)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Button>
                    )}
                    {can('aftercare', 'delete') && (
                        <Button 
                            variant="outline" 
                            onClick={() => setShowDeleteDialog(true)}
                            className="text-red-600 hover:bg-red-50"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                        </Button>
                    )}
                    <Button onClick={handlePrint} className="bg-purple-600 hover:bg-purple-700">
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                    </Button>
                </div>
            </div>

            {/* Procedure Details */}
            <PrintableDocument title={procedure.procedure_name}>
                <Card className="mb-4">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-2xl">{procedure.procedure_name}</CardTitle>
                                <div className="flex gap-2 mt-2">
                                    {procedure.category && (
                                        <Badge variant="secondary">{procedure.category}</Badge>
                                    )}
                                    {procedure.estimated_time && (
                                        <Badge variant="outline" className="gap-1">
                                            <Clock className="w-3 h-3" />
                                            {procedure.estimated_time}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {procedure.pre_procedure_prep && (
                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle className="text-lg">Pre-Procedure Prep (Staff Instructions)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div 
                                className="prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: procedure.pre_procedure_prep }}
                            />
                        </CardContent>
                    </Card>
                )}

                {procedure.patient_education && (
                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle className="text-lg">Patient Education</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div 
                                className="prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: procedure.patient_education }}
                            />
                        </CardContent>
                    </Card>
                )}

                {procedure.required_supplies && (
                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Package className="w-5 h-5" />
                                Required Supplies
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <pre className="whitespace-pre-wrap font-sans text-sm">{procedure.required_supplies}</pre>
                        </CardContent>
                    </Card>
                )}

                {procedure.required_tools && (
                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Wrench className="w-5 h-5" />
                                Required Tools & Equipment
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <pre className="whitespace-pre-wrap font-sans text-sm">{procedure.required_tools}</pre>
                        </CardContent>
                    </Card>
                )}

                {procedure.procedure_steps && (
                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle className="text-lg">Procedure Steps</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div 
                                className="prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: procedure.procedure_steps }}
                            />
                        </CardContent>
                    </Card>
                )}

                {procedure.post_procedure_notes && (
                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle className="text-lg">Post-Procedure Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div 
                                className="prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: procedure.post_procedure_notes }}
                            />
                        </CardContent>
                    </Card>
                )}

                {procedure.notes && (
                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle className="text-lg">Additional Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{procedure.notes}</p>
                        </CardContent>
                    </Card>
                )}
            </PrintableDocument>

            {/* Edit Form */}
            <ProcedureForm
                open={showEditForm}
                onOpenChange={setShowEditForm}
                procedure={procedure}
                onSuccess={() => {
                    setShowEditForm(false);
                    queryClient.invalidateQueries({ queryKey: ['procedures'] });
                }}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Procedure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{procedure.procedure_name}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteMutation.mutate()}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}