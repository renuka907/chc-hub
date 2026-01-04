import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Upload, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function AftercareForm({ open, onOpenChange, onSuccess, editInstruction = null }) {
    const [formData, setFormData] = useState({
        procedure_name: "",
        category: "",
        instructions: "",
        duration: "",
        warning_signs: "",
        follow_up: "",
        image_url: "",
        document_url: ""
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (editInstruction) {
            setFormData(editInstruction);
        } else if (!open) {
            setFormData({
                procedure_name: "",
                category: "",
                instructions: "",
                duration: "",
                warning_signs: "",
                follow_up: "",
                image_url: "",
                document_url: ""
            });
        }
    }, [editInstruction, open]);

    const handleGenerate = async () => {
        if (!formData.procedure_name || !formData.category) {
            alert('Please enter a procedure name and select a category first');
            return;
        }

        setIsGenerating(true);
        try {
            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Create detailed aftercare instructions for "${formData.procedure_name}" in the ${formData.category} category. Include:
                1. Step-by-step aftercare instructions
                2. Expected recovery duration
                3. Warning signs to watch for
                4. Follow-up appointment recommendations
                
                Make it clear and patient-friendly.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        instructions: { type: "string" },
                        duration: { type: "string" },
                        warning_signs: { type: "string" },
                        follow_up: { type: "string" }
                    }
                }
            });

            setFormData({
                ...formData,
                instructions: result.instructions,
                duration: result.duration,
                warning_signs: result.warning_signs,
                follow_up: result.follow_up
            });
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
        if (!formData.procedure_name || !formData.instructions) {
            alert('Please fill in procedure name and instructions');
            return;
        }

        setIsSaving(true);
        try {
            if (editInstruction) {
                await base44.entities.AftercareInstruction.update(editInstruction.id, formData);
            } else {
                await base44.entities.AftercareInstruction.create(formData);
            }
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            alert('Failed to save instruction. Please try again.');
        }
        setIsSaving(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        {editInstruction ? 'Edit Aftercare Instructions' : 'Create Aftercare Instructions'}
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
                                <Label htmlFor="procedure_name">Procedure Name *</Label>
                                <Input
                                    id="procedure_name"
                                    value={formData.procedure_name}
                                    onChange={(e) => setFormData({...formData, procedure_name: e.target.value})}
                                    placeholder="e.g., IUD Insertion"
                                    className="text-base"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Category *</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({...formData, category: value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Gynecology">Gynecology</SelectItem>
                                        <SelectItem value="Hormone Therapy">Hormone Therapy</SelectItem>
                                        <SelectItem value="Mens Health">Mens Health</SelectItem>
                                        <SelectItem value="General">General</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="duration">Recovery Duration</Label>
                            <Input
                                id="duration"
                                value={formData.duration}
                                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                                placeholder="e.g., 3-5 days"
                                className="text-base"
                            />
                        </div>

                        <Button
                            type="button"
                            onClick={handleGenerate}
                            disabled={isGenerating || !formData.procedure_name || !formData.category}
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
                                    Generate All Content with AI
                                </>
                            )}
                        </Button>
                    </TabsContent>

                    <TabsContent value="content" className="space-y-6 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="instructions">Aftercare Instructions *</Label>
                            <ReactQuill
                                value={formData.instructions}
                                onChange={(value) => setFormData({...formData, instructions: value})}
                                modules={{
                                    toolbar: [
                                        [{ 'header': [1, 2, 3, false] }],
                                        ['bold', 'italic', 'underline'],
                                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                        [{ 'indent': '-1'}, { 'indent': '+1' }],
                                        ['clean']
                                    ],
                                    clipboard: {
                                        matchVisual: false
                                    }
                                }}
                                className="bg-white"
                                style={{ height: '300px', marginBottom: '50px' }}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="warning_signs">⚠️ Warning Signs</Label>
                            <ReactQuill
                                value={formData.warning_signs}
                                onChange={(value) => setFormData({...formData, warning_signs: value})}
                                modules={{
                                    toolbar: [
                                        ['bold', 'italic', 'underline'],
                                        [{ 'list': 'bullet' }],
                                        ['clean']
                                    ],
                                    clipboard: {
                                        matchVisual: false
                                    }
                                }}
                                className="bg-white"
                                style={{ height: '200px', marginBottom: '50px' }}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="follow_up">Follow-up Information</Label>
                            <ReactQuill
                                value={formData.follow_up}
                                onChange={(value) => setFormData({...formData, follow_up: value})}
                                modules={{
                                    toolbar: [
                                        ['bold', 'italic', 'underline'],
                                        [{ 'list': 'bullet' }],
                                        ['clean']
                                    ],
                                    clipboard: {
                                        matchVisual: false
                                    }
                                }}
                                className="bg-white"
                                style={{ height: '150px', marginBottom: '50px' }}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="media" className="space-y-6 mt-4">
                        <div className="space-y-3">
                            <Label>Image</Label>
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
                        disabled={isSaving || !formData.procedure_name || !formData.instructions}
                        className="bg-green-600 hover:bg-green-700 min-w-[120px]"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            editInstruction ? 'Update Instruction' : 'Create Instruction'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}