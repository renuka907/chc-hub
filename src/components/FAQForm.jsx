import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function FAQForm({ open, onOpenChange, onSuccess, editFaq = null }) {
    const [formData, setFormData] = useState({
        question: "",
        answer: "",
        category: "General",
        order: 0
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (editFaq) {
            setFormData({
                question: editFaq.question || "",
                answer: editFaq.answer || "",
                category: editFaq.category || "General",
                order: editFaq.order || 0
            });
        } else {
            setFormData({
                question: "",
                answer: "",
                category: "General",
                order: 0
            });
        }
    }, [editFaq, open]);

    const handleSave = async () => {
        if (!formData.question.trim() || !formData.answer.trim()) {
            alert("Please fill in all required fields");
            return;
        }

        setIsSaving(true);
        try {
            if (editFaq) {
                await base44.entities.FAQ.update(editFaq.id, formData);
            } else {
                await base44.entities.FAQ.create(formData);
            }
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            alert("Failed to save FAQ");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{editFaq ? "Edit FAQ" : "Add New FAQ"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block">Question *</label>
                        <Input
                            value={formData.question}
                            onChange={(e) => setFormData({...formData, question: e.target.value})}
                            placeholder="Enter the question"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-2 block">Answer *</label>
                        <Textarea
                            value={formData.answer}
                            onChange={(e) => setFormData({...formData, answer: e.target.value})}
                            placeholder="Enter the answer"
                            rows={6}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Category</label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({...formData, category: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="General">General</SelectItem>
                                    <SelectItem value="HR">HR</SelectItem>
                                    <SelectItem value="Operations">Operations</SelectItem>
                                    <SelectItem value="Clinical">Clinical</SelectItem>
                                    <SelectItem value="Benefits">Benefits</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Display Order</label>
                            <Input
                                type="number"
                                value={formData.order}
                                onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                                placeholder="0"
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {isSaving ? "Saving..." : "Save FAQ"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}