import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2 } from "lucide-react";

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
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleGenerate = async () => {
        if (!formData.title || !formData.category) {
            alert('Please enter a title and select a category first');
            return;
        }

        setIsGenerating(true);
        try {
            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Create patient education content about "${formData.title}" in the ${formData.category} category. Include:
                1. A brief 2-3 sentence summary
                2. Detailed, easy-to-understand educational content (5-8 paragraphs)
                3. Medical references (cite sources like Medscape, medical journals, etc.)
                
                Make it patient-friendly but medically accurate.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        summary: { type: "string" },
                        content: { type: "string" },
                        medical_references: { type: "string" }
                    }
                }
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {editTopic ? 'Edit Education Topic' : 'Create New Education Topic'}
                    </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
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
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="image">Topic Image</Label>
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
                            <img src={formData.image_url} alt="Preview" className="mt-2 h-32 rounded-lg object-cover" />
                        )}
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
                        <Label htmlFor="content">Content *</Label>
                        <Textarea
                            id="content"
                            value={formData.content}
                            onChange={(e) => setFormData({...formData, content: e.target.value})}
                            placeholder="Detailed educational content"
                            rows={10}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="references">Medical References</Label>
                        <Textarea
                            id="references"
                            value={formData.medical_references}
                            onChange={(e) => setFormData({...formData, medical_references: e.target.value})}
                            placeholder="Sources and citations"
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
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : (editTopic ? 'Update Topic' : 'Create Topic')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}