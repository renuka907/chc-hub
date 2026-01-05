import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Image as ImageIcon, Wand2, Save } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import EducationTemplateSelector from "../components/education/EducationTemplateSelector";
import { toast } from "sonner";

export default function EducationTopicForm({ open, onOpenChange, onSuccess, editTopic = null }) {
    const [formData, setFormData] = useState(editTopic || {
        category: "",
        title: "",
        summary: "",
        content: "",
        image_url: "",
        medical_references: "",
        last_reviewed: new Date().toISOString().split('T')[0]
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);

    const handleGenerate = async () => {
        if (!formData.title || !formData.category) {
            alert('Please enter a title and select a category first');
            return;
        }

        setIsGenerating(true);
        try {
            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Create comprehensive patient education content about "${formData.title}" in the ${formData.category} category. 

                Structure the content as HTML with proper headings and formatting:
                - Use <h3> for main section headings
                - Use <p> for paragraphs
                - Use <ul> and <li> for bullet points
                - Use <strong> for emphasis
                
                Include these sections:
                1. Overview (2-3 paragraphs explaining what it is)
                2. Key Benefits (bullet list)
                3. What to Expect (detailed explanation)
                4. Important Considerations (bullet list)
                5. Common Questions
                
                Also provide:
                - A brief 2-3 sentence summary
                - Medical references (cite sources like Medscape, Mayo Clinic, medical journals)
                
                Make it patient-friendly but medically accurate.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        summary: { type: "string" },
                        content: { type: "string" },
                        medical_references: { type: "string" }
                    }
                },
                add_context_from_internet: true
            });

            setFormData({
                ...formData,
                summary: result.summary,
                content: result.content,
                medical_references: result.medical_references
            });
        } catch (error) {
            alert('Failed to generate content. Please try again.');
        }
        setIsGenerating(false);
    };

    const handleGenerateImage = async () => {
        if (!formData.title) {
            alert('Please enter a title first');
            return;
        }

        setIsGeneratingImage(true);
        try {
            const result = await base44.integrations.Core.GenerateImage({
                prompt: `Medical illustration for patient education about ${formData.title}. Professional, clean, educational style. Appropriate for a medical clinic. Accurate anatomy if relevant.`
            });
            setFormData({ ...formData, image_url: result.url });
        } catch (error) {
            alert('Failed to generate image. Please try again.');
        }
        setIsGeneratingImage(false);
    };

    const handleTemplateSelect = (template) => {
        setFormData({
            ...formData,
            summary: template.summary || formData.summary,
            content: template.content || formData.content,
            medical_references: template.medical_references || formData.medical_references,
            image_url: template.image_url || formData.image_url
        });
        toast.success("Template loaded successfully!");
    };

    const handleSaveAsTemplate = async () => {
        if (!formData.title || !formData.category || !formData.content) {
            alert('Please fill in title, category, and content before saving as template');
            return;
        }

        try {
            await base44.entities.EducationTemplate.create({
                template_name: formData.title,
                category: formData.category,
                description: formData.summary,
                summary: formData.summary,
                content: formData.content,
                medical_references: formData.medical_references,
                image_url: formData.image_url,
                is_public: true,
                is_favorite: false,
                usage_count: 0
            });
            toast.success("Saved as template!");
        } catch (error) {
            toast.error("Failed to save template");
        }
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

    const handleSave = async () => {
        if (!formData.title || !formData.category || !formData.content) {
            alert('Please fill in title, category, and content');
            return;
        }

        setIsSaving(true);
        try {
            if (editTopic) {
                await base44.entities.EducationTopic.update(editTopic.id, formData);
            } else {
                await base44.entities.EducationTopic.create(formData);
            }
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            alert('Failed to save topic. Please try again.');
        }
        setIsSaving(false);
    };

    const quillModules = {
        toolbar: [
            [{ 'header': [3, 4, false] }],
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link'],
            ['clean']
        ]
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        {editTopic ? 'Edit Education Topic' : 'Create New Education Topic'}
                    </DialogTitle>
                </DialogHeader>
                
                <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="content">Content</TabsTrigger>
                        <TabsTrigger value="media">Media</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Topic Title *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    placeholder="e.g., Understanding Hormone Therapy"
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
                                        <SelectItem value="Hormone Replacement Therapy">Hormone Replacement Therapy</SelectItem>
                                        <SelectItem value="Mens Health">Mens Health</SelectItem>
                                        <SelectItem value="Medication Education">Medication Education</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="summary">Summary</Label>
                            <Textarea
                                id="summary"
                                value={formData.summary}
                                onChange={(e) => setFormData({...formData, summary: e.target.value})}
                                placeholder="Brief 2-3 sentence overview"
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="last_reviewed">Last Reviewed Date</Label>
                            <Input
                                id="last_reviewed"
                                type="date"
                                value={formData.last_reviewed}
                                onChange={(e) => setFormData({...formData, last_reviewed: e.target.value})}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="content" className="space-y-4 py-4">

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                onClick={handleGenerate}
                                disabled={isGenerating || !formData.title || !formData.category}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Generate Content with AI
                                    </>
                                )}
                            </Button>
                            {formData.category && (
                                <Button
                                    type="button"
                                    onClick={() => setShowTemplateSelector(true)}
                                    variant="outline"
                                >
                                    <Wand2 className="w-4 h-4 mr-2" />
                                    Load Template
                                </Button>
                            )}
                            {formData.content && (
                                <Button
                                    type="button"
                                    onClick={handleSaveAsTemplate}
                                    variant="outline"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    Save as Template
                                </Button>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="content">Educational Content *</Label>
                            <ReactQuill
                                theme="snow"
                                value={formData.content}
                                onChange={(value) => setFormData({...formData, content: value})}
                                modules={quillModules}
                                className="bg-white"
                                style={{ height: '300px', marginBottom: '50px' }}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="references">Medical References</Label>
                            <Textarea
                                id="references"
                                value={formData.medical_references}
                                onChange={(e) => setFormData({...formData, medical_references: e.target.value})}
                                placeholder="Sources and citations (e.g., Mayo Clinic, Medscape, medical journals)"
                                rows={3}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="media" className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Topic Image</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    onClick={handleGenerateImage}
                                    disabled={isGeneratingImage || !formData.title}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    {isGeneratingImage ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <ImageIcon className="w-4 h-4 mr-2" />
                                            Generate Image with AI
                                        </>
                                    )}
                                </Button>
                            </div>
                            <div className="text-sm text-gray-500 mb-2">Or upload your own:</div>
                            <div className="flex gap-2">
                                <Input
                                    id="image-file"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={isUploading}
                                    className="flex-1"
                                />
                                {isUploading && <Loader2 className="w-5 h-5 animate-spin mt-2" />}
                            </div>
                            {formData.image_url && (
                                <div className="mt-4">
                                    <img src={formData.image_url} alt="Preview" className="w-full h-64 rounded-lg object-cover border" />
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : (editTopic ? 'Update Topic' : 'Create Topic')}
                    </Button>
                </DialogFooter>

                <EducationTemplateSelector
                    open={showTemplateSelector}
                    onOpenChange={setShowTemplateSelector}
                    category={formData.category}
                    onSelect={handleTemplateSelect}
                />
            </DialogContent>
        </Dialog>
    );
}