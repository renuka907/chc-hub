import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PrintableDocument from "../components/PrintableDocument";
import AftercareForm from "../components/AftercareForm";
import { openPrintWindow } from "../components/PrintHelper";
import { Printer, ArrowLeft, AlertTriangle, Clock, Calendar as CalendarIcon, Pencil, Star, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function AftercareDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const instructionId = urlParams.get('id');
    const [showEditForm, setShowEditForm] = useState(false);
    const queryClient = useQueryClient();

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
            <PrintableDocument title={`Aftercare Instructions: ${instruction.procedure_name}`}>
                <div className="space-y-6">
                    {/* Metadata */}
                    {instruction.category && (
                        <Badge className={`${categoryColors[instruction.category]} text-sm px-3 py-1`}>
                            {instruction.category}
                        </Badge>
                    )}

                    {/* Duration */}
                    {instruction.duration && (
                        <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="pt-6">
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
                            <CardTitle>Post-Procedure Instructions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                                {instruction.instructions}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Warning Signs */}
                    {instruction.warning_signs && (
                        <Card className="bg-amber-50 border-amber-300">
                            <CardHeader>
                                <CardTitle className="flex items-center text-amber-900">
                                    <AlertTriangle className="w-5 h-5 mr-2" />
                                    Warning Signs - Contact Us Immediately
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="whitespace-pre-wrap text-amber-900 leading-relaxed">
                                    {instruction.warning_signs}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Follow-up */}
                    {instruction.follow_up && (
                        <Card className="bg-green-50 border-green-200">
                            <CardHeader>
                                <CardTitle className="flex items-center text-green-900">
                                    <CalendarIcon className="w-5 h-5 mr-2" />
                                    Follow-Up Appointment
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="whitespace-pre-wrap text-green-900 leading-relaxed">
                                    {instruction.follow_up}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Uploaded Document */}
                    {instruction.document_url && (
                        <Card className="bg-slate-50 border-slate-200">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-6 h-6 text-slate-600" />
                                        <div>
                                            <p className="font-semibold text-slate-900">Attached Document</p>
                                            <p className="text-sm text-slate-600">Click to view or download</p>
                                        </div>
                                    </div>
                                    <a 
                                        href={instruction.document_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="no-print"
                                    >
                                        <Button variant="outline" size="sm">
                                            View Document
                                        </Button>
                                    </a>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Contact Information */}
                    <Card className="bg-slate-50 border-slate-200">
                        <CardContent className="pt-6">
                            <p className="text-sm text-slate-700">
                                <strong>Questions or Concerns?</strong><br />
                                Please contact our office if you have any questions about your recovery or if you experience any concerning symptoms.<br /><br />
                                <strong>Phone:</strong> 239-561-9191 (call or text)<br />
                                <strong>Email:</strong> office@contemporaryhealthcenter.com
                            </p>
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
        </div>
    );
}