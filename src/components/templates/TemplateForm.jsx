import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import ReactQuill from 'react-quill';

export default function TemplateForm({ open, onOpenChange, templateType, editTemplate, onSuccess }) {
    const [formData, setFormData] = useState({
        template_name: "",
        template_type: templateType,
        category: "",
        description: "",
        content: "",
        metadata: "{}",
        tags: "[]",
        is_public: true
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (open && editTemplate) {
            setFormData(editTemplate);
        } else if (open) {
            setFormData({
                template_name: "",
                template_type: templateType,
                category: "",
                description: "",
                content: "",
                metadata: "{}",
                tags: "[]",
                is_public: true
            });
        }
    }, [editTemplate, open, templateType]);

    const handleSave = async () => {
        if (!formData.template_name || !formData.content) {
            alert('Please fill in template name and content');
            return;
        }

        setIsSaving(true);
        try {
            if (editTemplate) {
                await base44.entities.FormTemplate.update(editTemplate.id, formData);
            } else {
                await base44.entities.FormTemplate.create({ ...formData, usage_count: 0 });
            }
            onSuccess();
        } catch (error) {
            alert('Failed to save template');
        }
        setIsSaving(false);
    };

    const categories = templateType === "ConsentForm" 
        ? ["Procedure", "Treatment", "General", "HIPAA", "Financial"]
        : ["Gynecology", "Hormone Therapy", "Mens Health", "General"];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Template Name *</Label>
                            <Input
                                value={formData.template_name}
                                onChange={(e) => setFormData({...formData, template_name: e.target.value})}
                                placeholder="e.g., Standard Surgical Consent"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({...formData, category: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder="Brief description of this template..."
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Template Content *</Label>
                        <ReactQuill
                            value={formData.content}
                            onChange={(value) => setFormData({...formData, content: value})}
                            className="bg-white"
                            style={{ height: '300px', marginBottom: '50px' }}
                        />
                    </div>

                    <div className="flex items-center justify-between pt-4">
                        <Label htmlFor="is_public">Make Public (visible to all users)</Label>
                        <Switch
                            id="is_public"
                            checked={formData.is_public}
                            onCheckedChange={(checked) => setFormData({...formData, is_public: checked})}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSave}
                        disabled={isSaving || !formData.template_name || !formData.content}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            editTemplate ? 'Update Template' : 'Create Template'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}