import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PrintableDocument from "../components/PrintableDocument";
import AftercareForm from "../components/AftercareForm";

import { usePermissions } from "../components/permissions/usePermissions";
import { toast } from "sonner";
import { Printer, ArrowLeft, AlertTriangle, Clock, Calendar as CalendarIcon, Pencil, Star, FileText, Save, Files } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function AftercareDetail() {
    // Enhanced print styling
    const urlParams = new URLSearchParams(window.location.search);
    const instructionId = urlParams.get('id');
    const [showEditForm, setShowEditForm] = useState(false);
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
                            margin: 0.5in 0.5in 0.75in 0.5in;
                            size: letter;
                        }
                        
                        body {
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        
                        body * {
                            visibility: hidden;
                        }
                        
                        .print-container,
                        .print-container * {
                            visibility: visible;
                        }
                        
                        .print-container {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            font-family: 'Times New Roman', serif;
                            font-size: 11pt;
                            line-height: 1.6;
                            color: #000;
                        }
                        
                        .print-logo {
                            text-align: center;
                            margin-bottom: 8pt;
                        }
                        
                        .print-logo img {
                            height: 50px;
                            width: auto;
                        }
                        
                        .print-contact {
                            text-align: center;
                            font-size: 9pt;
                            margin-bottom: 12pt;
                            padding-bottom: 8pt;
                            border-bottom: 1px solid #ccc;
                        }
                        
                        .print-title {
                            font-size: 18pt;
                            font-weight: bold;
                            text-align: center;
                            margin: 12pt 0;
                            padding-bottom: 8pt;
                            border-bottom: 2px solid #000;
                            text-transform: uppercase;
                        }
                        
                        .print-container h2 {
                            font-size: 14pt;
                            font-weight: bold;
                            margin-top: 14pt;
                            margin-bottom: 8pt;
                        }
                        
                        .print-container p {
                            margin-bottom: 8pt;
                            text-align: justify;
                        }
                        
                        .print-container ul,
                        .print-container ol {
                            margin-bottom: 8pt;
                            padding-left: 24pt;
                        }
                        
                        .print-container li {
                            margin-bottom: 4pt;
                        }
                        
                        .print-section {
                            background: #f8f9fa;
                            border: 1px solid #ddd;
                            padding: 10pt;
                            margin: 10pt 0;
                            page-break-inside: avoid;
                        }
                        
                        .no-print {
                            display: none !important;
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
            <div className="print-container">
                {/* Print Header - Logo and Contact */}
                <div className="print-logo">
                    <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695939a556b8082002a35a68/1e5584b38_goldwithlettersContemporary-health-center-logo-retina.png"
                        alt="Contemporary Health Center"
                    />
                </div>
                <div className="print-contact">
                    <div style={{fontWeight: '600'}}>6150 Diamond Center Court #400, Fort Myers, FL 33912</div>
                    <div>Phone: 239-561-9191 | Fax: 239-561-9188 | contemporaryhealthcenter.com</div>
                </div>
                
                {/* Title */}
                <div className="print-title">
                    Aftercare Instructions: {instruction.procedure_name}
                </div>
                
                {/* Content */}
                <div className="space-y-6">
                    {/* Metadata */}
                    {instruction.category && (
                        <Badge className={`${categoryColors[instruction.category]} text-sm px-3 py-1 no-print`}>
                            {instruction.category}
                        </Badge>
                    )}

                    {/* Duration */}
                    {instruction.duration && (
                        <div className="print-section">
                            <div className="flex items-center space-x-2">
                                <Clock className="w-5 h-5 text-blue-600 no-print" />
                                <div>
                                    <strong>Expected Recovery:</strong> {instruction.duration}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Instructions */}
                    <div className="print-section">
                        <h2>Post-Procedure Instructions</h2>
                        <div 
                            className="text-gray-900 prose prose-sm max-w-none"
                            style={{lineHeight: '1.8'}}
                            dangerouslySetInnerHTML={{ __html: instruction.instructions }}
                        />
                    </div>

                    {/* Warning Signs */}
                    {instruction.warning_signs && (
                        <div className="print-section" style={{background: '#fef3c7', borderColor: '#f59e0b', borderWidth: '2px'}}>
                            <h2 style={{display: 'flex', alignItems: 'center'}}>
                                <AlertTriangle className="w-5 h-5 mr-2 no-print" />
                                Warning Signs - Contact Us Immediately
                            </h2>
                            <div 
                                className="prose prose-sm max-w-none"
                                style={{lineHeight: '1.8', fontWeight: '500'}}
                                dangerouslySetInnerHTML={{ __html: instruction.warning_signs }}
                            />
                        </div>
                    )}

                    {/* Follow-up */}
                    {instruction.follow_up && (
                        <div className="print-section" style={{background: '#ecfdf5', borderColor: '#10b981'}}>
                            <h2 style={{display: 'flex', alignItems: 'center'}}>
                                <CalendarIcon className="w-5 h-5 mr-2 no-print" />
                                Follow-Up Appointment
                            </h2>
                            <div 
                                className="prose prose-sm max-w-none"
                                style={{lineHeight: '1.8'}}
                                dangerouslySetInnerHTML={{ __html: instruction.follow_up }}
                            />
                        </div>
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
                    <div className="print-section" style={{background: '#f1f5f9', borderColor: '#475569', borderWidth: '2px'}}>
                        <div className="text-sm leading-relaxed">
                            <p style={{fontWeight: 'bold', fontSize: '14pt', marginBottom: '10pt', textTransform: 'uppercase'}}>
                                Questions or Concerns?
                            </p>
                            <p style={{marginBottom: '10pt'}}>
                                Please contact our office if you have any questions about your recovery or if you experience any concerning symptoms.
                            </p>
                            <div style={{borderTop: '1px solid #cbd5e1', paddingTop: '8pt', marginTop: '8pt'}}>
                                <p style={{fontWeight: '600'}}>📞 Phone: 239-561-9191 (call or text)</p>
                                <p style={{fontWeight: '600', marginTop: '4pt'}}>📧 Email: office@contemporaryhealthcenter.com</p>
                                <p style={{fontWeight: '600', marginTop: '4pt'}}>🌐 Web: contemporaryhealthcenter.com</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {instruction && (
                <AftercareForm
                    open={showEditForm}
                    onOpenChange={setShowEditForm}
                    onSuccess={handleSuccess}
                    editInstruction={instruction}
                />
            )}


        </div>
    );
}