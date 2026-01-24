import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Image as ImageIcon, Wand2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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
    const [showTemplates, setShowTemplates] = useState(false);
    const [templates, setTemplates] = useState([]);

    const handleGenerate = async () => {
        if (!formData.title || !formData.category) {
            alert('Please enter a title and select a category first');
            return;
        }

        setIsGenerating(true);
        try {
            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Create comprehensive patient education content about "${formData.title}" in the ${formData.category} category. 

                IMPORTANT: Use bullet points instead of long paragraphs. Structure as HTML:
                - Use <h3> for main section headings
                - Use <ul> and <li> for ALL content (make bullet lists, not paragraphs)
                - Use <strong> for emphasis within bullets
                - Keep each bullet point concise (1-2 sentences max)

                Include these sections with bullet points:
                1. Overview (3-5 key bullet points about what it is)
                2. Key Benefits (5-7 bullet points)
                3. What to Expect (5-7 bullet points describing the process/experience)
                4. Important Considerations (4-6 bullet points with key warnings/tips)
                5. Common Questions (3-5 Q&A pairs as bullet points)

                Also provide:
                - A brief 2-3 sentence summary
                - Medical references (cite sources like Medscape, Mayo Clinic, medical journals)

                Make it patient-friendly, scannable, and medically accurate.`,
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

    const loadTemplates = async () => {
        try {
            const allTopics = await base44.entities.EducationTopic.list();
            const byCategory = allTopics.filter(t => t.category === formData.category);
            setTemplates(byCategory.slice(0, 5));
            setShowTemplates(true);
        } catch (error) {
            console.error('Failed to load templates:', error);
        }
    };

    const applyTemplate = (template) => {
        setFormData({
            ...formData,
            summary: template.summary,
            content: template.content,
            medical_references: template.medical_references
        });
        setShowTemplates(false);
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
                                    onClick={loadTemplates}
                                    variant="outline"
                                    disabled={!formData.category}
                                >
                                    <Wand2 className="w-4 h-4 mr-2" />
                                    Load Template
                                </Button>
                            )}
                        </div>

                        {showTemplates && templates.length > 0 && (
                            <div className="border rounded-lg p-4 space-y-2">
                                <p className="text-sm font-semibold text-gray-700">Available Templates:</p>
                                {templates.map(template => (
                                    <button
                                        key={template.id}
                                        onClick={() => applyTemplate(template)}
                                        className="w-full text-left p-3 border rounded-lg hover:bg-purple-50 transition-colors"
                                    >
                                        <div className="font-medium text-sm">{template.title}</div>
                                        {template.summary && (
                                            <div className="text-xs text-gray-600 mt-1 line-clamp-2">{template.summary}</div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

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
                    <Button onClick={handleSave} disabled={isSaving} className="text-black">
                        {isSaving ? 'Saving...' : (editTopic ? 'Update Topic' : 'Create Topic')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}