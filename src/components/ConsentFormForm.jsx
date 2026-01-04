import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Upload, X, FileText, ListChecks } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import FormFieldInsert from "./forms/FormFieldInsert";
import FormTemplates from "./forms/FormTemplates";
import TemplateSelector from "./templates/TemplateSelector";

export default function ConsentFormForm({ open, onOpenChange, onSuccess, editForm = null }) {
    const [formData, setFormData] = useState({
        form_name: "",
        form_type: "",
        content: "",
        version: "",
        effective_date: new Date().toISOString().split('T')[0],
        image_url: "",
        document_url: ""
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const [showAiParams, setShowAiParams] = useState(false);
    const [aiParams, setAiParams] = useState({
        procedure_type: "",
        patient_condition: "",
        specific_risks: "",
        additional_notes: ""
    });
    const quillRef = React.useRef(null);

    useEffect(() => {
        if (open && editForm) {
            setFormData(editForm);
        } else if (!open) {
            setFormData({
                form_name: "",
                form_type: "",
                content: "",
                version: "",
                effective_date: new Date().toISOString().split('T')[0],
                image_url: "",
                document_url: ""
            });
        }
    }, [editForm, open]);

    const handleGenerate = async () => {
        if (!formData.form_name || !formData.form_type) {
            alert('Please enter a form name and select a form type first');
            return;
        }

        setIsGenerating(true);
        try {
            let prompt = `Create a detailed, professional medical consent form for "${formData.form_name}" of type ${formData.form_type}.`;
            
            if (aiParams.procedure_type) {
                prompt += `\n\nProcedure Type: ${aiParams.procedure_type}`;
            }
            if (aiParams.patient_condition) {
                prompt += `\n\nPatient Condition/Context: ${aiParams.patient_condition}`;
            }
            if (aiParams.specific_risks) {
                prompt += `\n\nSpecific Risks to Address: ${aiParams.specific_risks}`;
            }
            if (aiParams.additional_notes) {
                prompt += `\n\nAdditional Requirements: ${aiParams.additional_notes}`;
            }

            prompt += `\n\nThe form must include:
1. Clear purpose and description of the procedure/treatment
2. Comprehensive risks and benefits
3. Alternative options
4. Patient rights and responsibilities
5. Formal consent statement
6. Signature and date fields

Format the content in HTML with proper structure, bold headings, and professional medical terminology. Include patient information fields at the top (name, DOB, date). Make it legally appropriate and easy to understand.`;

            const result = await base44.integrations.Core.InvokeLLM({
                prompt: prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        content: { type: "string" }
                    }
                }
            });

            setFormData({
                ...formData,
                content: result.content
            });
            setShowAiParams(false);
        } catch (error) {
            alert('Failed to generate content. Please try again.');
        }
        setIsGenerating(false);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const result = await base44.integrations.Core.UploadFile({ file });
            setFormData({ ...formData, image_url: result.file_url });
        } catch (error) {
            alert('Failed to upload image. Please try again.');
        }
        setIsUploading(false);
    };

    const handleDocumentUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingDoc(true);
        try {
            const result = await base44.integrations.Core.UploadFile({ file });
            setFormData({ ...formData, document_url: result.file_url });
        } catch (error) {
            alert('Failed to upload document. Please try again.');
        }
        setIsUploadingDoc(false);
    };

    const handleSave = async () => {
        if (!formData.form_name || !formData.form_type || !formData.content) {
            alert('Please fill in form name, type, and content');
            return;
        }

        setIsSaving(true);
        try {
            if (editForm) {
                await base44.entities.ConsentForm.update(editForm.id, formData);
            } else {
                await base44.entities.ConsentForm.create(formData);
            }
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            alert('Failed to save form. Please try again.');
        }
        setIsSaving(false);
    };

    const handleInsertField = (html) => {
        const quill = quillRef.current?.getEditor();
        if (quill) {
            const range = quill.getSelection();
            if (range) {
                quill.clipboard.dangerouslyPasteHTML(range.index, html);
            } else {
                quill.clipboard.dangerouslyPasteHTML(quill.getLength(), html);
            }
        }
    };

    const handleSelectTemplate = (content) => {
        setFormData({ ...formData, content });
    };

    const handleSummarize = async () => {
        if (!formData.content) {
            alert('No content to summarize');
            return;
        }

        setIsGenerating(true);
        try {
            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze and summarize this medical consent form. Extract:
1. Main purpose/procedure
2. Key risks mentioned
3. Key benefits mentioned
4. Important patient responsibilities
5. Required signatures/dates

Form content:
${formData.content}

Provide a clear, concise summary in professional format.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        summary: { type: "string" },
                        key_points: { type: "array", items: { type: "string" } }
                    }
                }
            });

            alert(`Summary:\n\n${result.summary}\n\nKey Points:\n${result.key_points.join('\n')}`);
        } catch (error) {
            alert('Failed to generate summary. Please try again.');
        }
        setIsGenerating(false);
    };

    const handleExtractKeyInfo = async () => {
        if (!formData.content) {
            alert('No content to extract from');
            return;
        }

        setIsGenerating(true);
        try {
            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Extract key information from this medical consent form and structure it as JSON:

Form content:
${formData.content}

Extract:
- Procedure/treatment name
- Primary risks (list)
- Primary benefits (list)
- Patient requirements/responsibilities (list)
- Follow-up requirements (if any)
- Contraindications (if any)`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        procedure_name: { type: "string" },
                        risks: { type: "array", items: { type: "string" } },
                        benefits: { type: "array", items: { type: "string" } },
                        patient_responsibilities: { type: "array", items: { type: "string" } },
                        follow_up: { type: "string" },
                        contraindications: { type: "array", items: { type: "string" } }
                    }
                }
            });

            const formatted = `Extracted Information:

Procedure: ${result.procedure_name}

Risks:
${result.risks.map(r => `• ${r}`).join('\n')}

Benefits:
${result.benefits.map(b => `• ${b}`).join('\n')}

Patient Responsibilities:
${result.patient_responsibilities.map(p => `• ${p}`).join('\n')}

${result.follow_up ? `Follow-up: ${result.follow_up}` : ''}

${result.contraindications.length > 0 ? `Contraindications:\n${result.contraindications.map(c => `• ${c}`).join('\n')}` : ''}`;

            alert(formatted);
        } catch (error) {
            alert('Failed to extract key information. Please try again.');
        }
        setIsGenerating(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        {editForm ? 'Edit Consent Form' : 'Create Consent Form'}
                    </DialogTitle>
                </DialogHeader>
                
                <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="content">Content</TabsTrigger>
                        <TabsTrigger value="media">Media & Files</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="details" className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="form_name">Form Name *</Label>
                                <Input
                                    id="form_name"
                                    value={formData.form_name}
                                    onChange={(e) => setFormData({...formData, form_name: e.target.value})}
                                    placeholder="e.g., Surgical Procedure Consent"
                                    className="text-base"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="form_type">Form Type *</Label>
                                <Select
                                    value={formData.form_type}
                                    onValueChange={(value) => setFormData({...formData, form_type: value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Procedure">Procedure</SelectItem>
                                        <SelectItem value="Treatment">Treatment</SelectItem>
                                        <SelectItem value="General">General</SelectItem>
                                        <SelectItem value="HIPAA">HIPAA</SelectItem>
                                        <SelectItem value="Financial">Financial</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="version">Version</Label>
                                <Input
                                    id="version"
                                    value={formData.version}
                                    onChange={(e) => setFormData({...formData, version: e.target.value})}
                                    placeholder="e.g., 1.0"
                                    className="text-base"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="effective_date">Effective Date</Label>
                                <Input
                                    id="effective_date"
                                    type="date"
                                    value={formData.effective_date}
                                    onChange={(e) => setFormData({...formData, effective_date: e.target.value})}
                                    className="text-base"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">AI Generation Options</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowAiParams(!showAiParams)}
                                >
                                    {showAiParams ? 'Hide' : 'Show'} Advanced Parameters
                                </Button>
                            </div>

                            {showAiParams && (
                                <div className="space-y-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                                    <div className="space-y-2">
                                        <Label htmlFor="procedure_type" className="text-sm">Specific Procedure Type</Label>
                                        <Input
                                            id="procedure_type"
                                            value={aiParams.procedure_type}
                                            onChange={(e) => setAiParams({...aiParams, procedure_type: e.target.value})}
                                            placeholder="e.g., Minimally invasive laparoscopic surgery"
                                            className="text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="patient_condition" className="text-sm">Patient Condition/Context</Label>
                                        <Input
                                            id="patient_condition"
                                            value={aiParams.patient_condition}
                                            onChange={(e) => setAiParams({...aiParams, patient_condition: e.target.value})}
                                            placeholder="e.g., Post-menopausal, history of endometriosis"
                                            className="text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="specific_risks" className="text-sm">Specific Risks to Address</Label>
                                        <Input
                                            id="specific_risks"
                                            value={aiParams.specific_risks}
                                            onChange={(e) => setAiParams({...aiParams, specific_risks: e.target.value})}
                                            placeholder="e.g., Bleeding, infection, anesthesia complications"
                                            className="text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="additional_notes" className="text-sm">Additional Requirements</Label>
                                        <Textarea
                                            id="additional_notes"
                                            value={aiParams.additional_notes}
                                            onChange={(e) => setAiParams({...aiParams, additional_notes: e.target.value})}
                                            placeholder="Any other specific requirements or information to include..."
                                            className="text-sm h-20"
                                        />
                                    </div>
                                </div>
                            )}

                            <Button
                                type="button"
                                onClick={handleGenerate}
                                disabled={isGenerating || !formData.form_name || !formData.form_type}
                                className="w-full bg-purple-600 hover:bg-purple-700"
                                size="lg"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Generating Content...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Generate Form Content with AI
                                    </>
                                )}
                            </Button>
                        </div>
                        </TabsContent>

                    <TabsContent value="content" className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <Label htmlFor="content">Form Content *</Label>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Use templates or insert form fields like signatures, dates, and checkboxes
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSummarize}
                                        disabled={isGenerating || !formData.content}
                                    >
                                        <FileText className="w-4 h-4 mr-1" />
                                        Summarize
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleExtractKeyInfo}
                                        disabled={isGenerating || !formData.content}
                                    >
                                        <ListChecks className="w-4 h-4 mr-1" />
                                        Extract Key Info
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowTemplateSelector(true)}
                                    >
                                        Load Template
                                    </Button>
                                    <FormTemplates onSelectTemplate={handleSelectTemplate} />
                                    <FormFieldInsert onInsert={handleInsertField} />
                                </div>
                            </div>
                            <ReactQuill
                                ref={quillRef}
                                value={formData.content}
                                onChange={(value) => setFormData({...formData, content: value})}
                                modules={{
                                    toolbar: [
                                        [{ 'header': [1, 2, 3, false] }],
                                        [{ 'font': [] }],
                                        [{ 'size': ['small', false, 'large', 'huge'] }],
                                        ['bold', 'italic', 'underline', 'strike'],
                                        [{ 'color': [] }, { 'background': [] }],
                                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                        [{ 'indent': '-1'}, { 'indent': '+1' }],
                                        [{ 'align': [] }],
                                        ['link', 'image'],
                                        ['clean'],
                                        ['code-block']
                                    ],
                                    clipboard: {
                                        matchVisual: false,
                                        matchers: []
                                    }
                                }}
                                formats={['header', 'font', 'size', 'bold', 'italic', 'underline', 'strike', 'color', 'background', 'list', 'bullet', 'indent', 'align', 'link', 'image', 'code-block', 'script', 'blockquote', 'direction']}
                                className="bg-white"
                                style={{ height: '400px', marginBottom: '50px' }}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="media" className="space-y-6 mt-4">
                        <div className="space-y-3">
                            <Label>Image or Diagram</Label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-purple-400 transition-colors">
                                {formData.image_url ? (
                                    <div className="relative">
                                        <img src={formData.image_url} alt="Preview" className="w-full max-h-64 object-contain rounded-lg" />
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="destructive"
                                            className="absolute top-2 right-2"
                                            onClick={() => setFormData({...formData, image_url: ""})}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <label htmlFor="image-file" className="cursor-pointer flex flex-col items-center">
                                        <Upload className="w-12 h-12 text-gray-400 mb-2" />
                                        <span className="text-sm text-gray-600">Click to upload image</span>
                                        <Input
                                            id="image-file"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={isUploading}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                                {isUploading && (
                                    <div className="flex items-center justify-center mt-2">
                                        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                                        <span className="ml-2 text-sm text-gray-600">Uploading...</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label>Document (PDF, Word, etc.)</Label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-purple-400 transition-colors">
                                {formData.document_url ? (
                                    <div className="flex items-center justify-between bg-green-50 p-4 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                📄
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-green-900">Document uploaded</p>
                                                <a href={formData.document_url} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 hover:underline">
                                                    View document
                                                </a>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => setFormData({...formData, document_url: ""})}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <label htmlFor="document-file" className="cursor-pointer flex flex-col items-center">
                                        <Upload className="w-12 h-12 text-gray-400 mb-2" />
                                        <span className="text-sm text-gray-600">Click to upload document</span>
                                        <span className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX</span>
                                        <Input
                                            id="document-file"
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            onChange={handleDocumentUpload}
                                            disabled={isUploadingDoc}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                                {isUploadingDoc && (
                                    <div className="flex items-center justify-center mt-2">
                                        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                                        <span className="ml-2 text-sm text-gray-600">Uploading...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSave} 
                        disabled={isSaving || !formData.form_name || !formData.form_type || !formData.content}
                        className="bg-green-600 hover:bg-green-700 min-w-[120px]"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            editForm ? 'Update Form' : 'Create Form'
                        )}
                    </Button>
                </DialogFooter>

                <TemplateSelector
                    open={showTemplateSelector}
                    onOpenChange={setShowTemplateSelector}
                    templateType="ConsentForm"
                    onSelect={(template) => {
                        setFormData({
                            ...formData,
                            form_name: template.template_name,
                            form_type: template.category || formData.form_type,
                            content: template.content
                        });
                    }}
                />
                </DialogContent>
                </Dialog>
                );
                }