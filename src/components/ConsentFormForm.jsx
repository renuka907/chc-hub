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

    useEffect(() => {
        if (editForm) {
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
            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Create a consent form for "${formData.form_name}" of type ${formData.form_type}. Include:
                1. Purpose and description
                2. Risks and benefits
                3. Patient rights
                4. Consent statement
                
                Make it professional and legally appropriate.`,
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
                    </TabsContent>

                    <TabsContent value="content" className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="content">Form Content *</Label>
                            <div className="text-xs text-gray-500 mb-2">
                                Include purpose, risks, benefits, patient rights, and consent statement
                            </div>
                            <Textarea
                                id="content"
                                value={formData.content}
                                onChange={(e) => setFormData({...formData, content: e.target.value})}
                                placeholder="Full consent form text..."
                                rows={18}
                                className="text-base font-mono"
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
            </DialogContent>
        </Dialog>
    );
}