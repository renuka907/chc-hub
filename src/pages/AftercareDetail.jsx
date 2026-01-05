import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PrintableDocument from "../components/PrintableDocument";
import AftercareForm from "../components/AftercareForm";
import ShareFormDialog from "../components/forms/ShareFormDialog";
import { usePermissions } from "../components/permissions/usePermissions";
import { toast } from "sonner";
import { Printer, ArrowLeft, AlertTriangle, Clock, Calendar as CalendarIcon, Pencil, Star, FileText, Share2, Save, Files } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function AftercareDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const instructionId = urlParams.get('id');
    const [showEditForm, setShowEditForm] = useState(false);
    const [showShareDialog, setShowShareDialog] = useState(false);
    const queryClient = useQueryClient();
    const { can } = usePermissions();

    const { data: instructions = [] } = useQuery({
        queryKey: ['aftercareInstructions'],
        queryFn: () => base44.entities.AftercareInstruction.list(),
    });

    const instruction = instructions.find(i => i.id === instructionId);

    const handleSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['aftercareInstructions'] });
    };

    const toggleFavorite = async () => {
        await base44.entities.AftercareInstruction.update(instruction.id, { is_favorite: !instruction.is_favorite });
        queryClient.invalidateQueries({ queryKey: ['aftercareInstructions'] });
    };

    const saveAsTemplate = async () => {
        try {
            await base44.entities.FormTemplate.create({
                template_name: instruction.procedure_name,
                template_type: "AftercareInstruction",
                category: instruction.category,
                description: `Template created from ${instruction.procedure_name}`,
                content: instruction.instructions,
                metadata: JSON.stringify({
                    duration: instruction.duration,
                    warning_signs: instruction.warning_signs,
                    follow_up: instruction.follow_up
                }),
                tags: instruction.tags || "[]",
                usage_count: 0,
                is_public: true
            });
            toast.success("Template created successfully!");
        } catch (error) {
            toast.error("Failed to create template");
        }
    };

    const duplicateInstruction = async () => {
        try {
            const duplicated = await base44.entities.AftercareInstruction.create({
                ...instruction,
                id: undefined,
                procedure_name: `${instruction.procedure_name} (Copy)`,
                created_date: undefined,
                updated_date: undefined,
                parent_id: undefined
            });
            toast.success("Instruction duplicated successfully!");
            navigate(createPageUrl(`AftercareDetail?id=${duplicated.id}`));
        } catch (error) {
            toast.error("Failed to duplicate instruction");
        }
    };

    const categoryColors = {
        "Gynecology": "bg-pink-100 text-pink-800",
        "Hormone Therapy": "bg-purple-100 text-purple-800",
        "Mens Health": "bg-blue-100 text-blue-800",
        "General": "bg-gray-100 text-gray-800",
        "Provider Forms": "bg-orange-100 text-orange-800"
    };

    if (!instruction) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Loading instructions...</p>
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
                            margin: 0.3cm;
                        }
                        body * {
                            visibility: hidden;
                        }
                        .printable-document,
                        .printable-document * {
                            visibility: visible;
                            color: #000 !important;
                        }
                        .printable-document {
                            position: absolute !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 100%;
                            padding: 5px !important;
                            font-size: 11pt !important;
                            line-height: 1.4 !important;
                        }
                        .no-print {
                            display: none !important;
                        }
                        .printable-document .card-compact {
                            padding: 8px !important;
                            margin: 6px 0 !important;
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                            display: block !important;
                            overflow: visible !important;
                        }
                        .printable-document .card-compact-header {
                            padding: 6px !important;
                            margin-bottom: 4px !important;
                        }
                        .printable-document .card-compact-content {
                            padding: 8px !important;
                        }
                        .printable-document .bg-blue-50,
                        .printable-document .bg-amber-50,
                        .printable-document .bg-green-50,
                        .printable-document .bg-slate-100 {
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                            page-break-before: auto !important;
                            page-break-after: auto !important;
                            orphans: 4 !important;
                            widows: 4 !important;
                            display: block !important;
                            overflow: visible !important;
                            position: relative !important;
                        }
                        .printable-document .bg-amber-50 {
                            min-height: 100px !important;
                        }
                        .printable-document > div > * {
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                        }
                    }
                `}
            </style>

            {/* Action Bar */}
            <div className="flex items-center justify-between no-print">
                <Link to={createPageUrl("AftercareLibrary")}>
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Library
                    </Button>
                </Link>
                <div className="flex gap-2">
                    {can("aftercare", "share") && (
                        <Button variant="outline" onClick={() => setShowShareDialog(true)} className="border-blue-500 text-blue-600">
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                        </Button>
                    )}
                    <Button 
                        variant="outline" 
                        onClick={toggleFavorite}
                        className={instruction.is_favorite ? "border-yellow-500 text-yellow-600" : ""}
                    >
                        <Star className={`w-4 h-4 mr-2 ${instruction.is_favorite ? 'fill-yellow-500' : ''}`} />
                        {instruction.is_favorite ? 'Unfavorite' : 'Favorite'}
                    </Button>
                    {can("aftercare", "edit") && (
                        <>
                            <Button variant="outline" onClick={duplicateInstruction}>
                                <Files className="w-4 h-4 mr-2" />
                                Duplicate
                            </Button>
                            <Button variant="outline" onClick={saveAsTemplate}>
                                <Save className="w-4 h-4 mr-2" />
                                Save as Template
                            </Button>
                            <Button variant="outline" onClick={() => setShowEditForm(true)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                            </Button>
                        </>
                    )}
                    <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700">
                        <Printer className="w-4 h-4 mr-2" />
                        Print / PDF
                    </Button>
                </div>
            </div>

            {/* Printable Content */}
            <PrintableDocument title={`Aftercare Instructions: ${instruction.procedure_name}`}>
                <div className="space-y-6">
                    {/* Metadata */}
                    {instruction.category && (
                        <Badge className={`${categoryColors[instruction.category]} text-sm px-3 py-1 no-print`}>
                            {instruction.category}
                        </Badge>
                    )}

                    {/* Duration */}
                    {instruction.duration && (
                        <Card className="bg-blue-50 border-blue-200 card-compact">
                            <CardContent className="pt-6 card-compact-content">
                                <div className="flex items-center space-x-2">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                    <div>
                                        <span className="font-semibold text-blue-900">Expected Recovery: </span>
                                        <span className="text-blue-800">{instruction.duration}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Main Instructions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-bold uppercase tracking-wide border-b pb-2">Post-Procedure Instructions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div 
                                className="text-gray-900 text-base prose prose-sm max-w-none"
                                style={{lineHeight: '1.8', fontFamily: 'Times New Roman, serif'}}
                                dangerouslySetInnerHTML={{ __html: instruction.instructions }}
                            />
                        </CardContent>
                    </Card>

                    {/* Warning Signs */}
                    {instruction.warning_signs && (
                        <Card className="bg-amber-50 border-2 border-amber-400 card-compact">
                            <CardHeader className="card-compact-header">
                                <CardTitle className="flex items-center text-amber-900 text-lg font-bold uppercase tracking-wide">
                                    <AlertTriangle className="w-5 h-5 mr-2" />
                                    Warning Signs - Contact Us Immediately
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="card-compact-content">
                                <div 
                                    className="text-amber-900 text-base font-medium prose prose-sm max-w-none"
                                    style={{lineHeight: '1.8', fontFamily: 'Times New Roman, serif'}}
                                    dangerouslySetInnerHTML={{ __html: instruction.warning_signs }}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* Follow-up */}
                    {instruction.follow_up && (
                        <Card className="bg-green-50 border-green-200 card-compact">
                            <CardHeader className="card-compact-header">
                                <CardTitle className="flex items-center text-green-900">
                                    <CalendarIcon className="w-5 h-5 mr-2" />
                                    Follow-Up Appointment
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="card-compact-content">
                                <div 
                                    className="text-green-900 text-base prose prose-sm max-w-none"
                                    style={{lineHeight: '1.8', fontFamily: 'Times New Roman, serif'}}
                                    dangerouslySetInnerHTML={{ __html: instruction.follow_up }}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* Uploaded Document */}
                    {instruction.document_url && (
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
                                        href={instruction.document_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                    >
                                        <Button variant="outline" size="sm">
                                            <Printer className="w-4 h-4 mr-2" />
                                            Open PDF
                                        </Button>
                                    </a>
                                </div>
                                <embed 
                                    src={instruction.document_url}
                                    type="application/pdf"
                                    className="w-full h-[600px] border-2 border-slate-300 rounded-lg"
                                    title="Document Preview"
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* Contact Information */}
                    <Card className="bg-slate-100 border-2 border-slate-300 card-compact">
                        <CardContent className="pt-6 card-compact-content">
                            <div className="text-sm text-slate-900 leading-relaxed">
                                <p className="font-bold text-base mb-3 uppercase tracking-wide">Questions or Concerns?</p>
                                <p className="mb-3">Please contact our office if you have any questions about your recovery or if you experience any concerning symptoms.</p>
                                <div className="border-t border-slate-300 pt-3 mt-3">
                                    <p className="font-semibold">📞 Phone: 239-561-9191 (call or text)</p>
                                    <p className="font-semibold mt-1">📧 Email: office@contemporaryhealthcenter.com</p>
                                    <p className="font-semibold mt-1">🌐 Web: contemporaryhealthcenter.com</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </PrintableDocument>

            {instruction && (
                <AftercareForm
                    open={showEditForm}
                    onOpenChange={setShowEditForm}
                    onSuccess={handleSuccess}
                    editInstruction={instruction}
                />
            )}

            <ShareFormDialog
                open={showShareDialog}
                onOpenChange={setShowShareDialog}
                entityType="AftercareInstruction"
                entityId={instruction.id}
                formName={instruction.procedure_name}
            />
        </div>
    );
}