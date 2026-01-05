import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function ProcedureForm({ procedure, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        procedure_name: procedure?.procedure_name || "",
        category: procedure?.category || "",
        pre_procedure_prep: procedure?.pre_procedure_prep || "",
        patient_education: procedure?.patient_education || "",
        required_supplies: procedure?.required_supplies || "",
        required_tools: procedure?.required_tools || "",
        procedure_steps: procedure?.procedure_steps || "",
        post_procedure_notes: procedure?.post_procedure_notes || "",
        estimated_time: procedure?.estimated_time || "",
        related_pricing_item_ids: procedure?.related_pricing_item_ids || "",
        related_aftercare_id: procedure?.related_aftercare_id || "",
        notes: procedure?.notes || "",
        is_favorite: procedure?.is_favorite || false,
    });

    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const { data: pricingItems = [] } = useQuery({
        queryKey: ['pricingItems'],
        queryFn: () => base44.entities.PricingItem.list(),
    });

    const { data: aftercareInstructions = [] } = useQuery({
        queryKey: ['aftercareInstructions'],
        queryFn: () => base44.entities.AftercareInstruction.list(),
    });

    const handleGenerateContent = async () => {
        if (!formData.procedure_name) {
            alert("Please enter a procedure name first");
            return;
        }

        setIsGenerating(true);
        try {
            const prompt = `Generate comprehensive procedure information for: ${formData.procedure_name}

Include:
1. Pre-procedure prep instructions for staff (room setup, patient positioning, safety checks)
2. Patient education (what they should expect, sensations, duration)
3. Required supplies (specific items, quantities)
4. Required tools and equipment
5. Step-by-step procedure instructions
6. Post-procedure notes (cleanup, immediate care, documentation)

Format the response as clear, professional medical instructions.`;

            const response = await base44.integrations.Core.InvokeLLM({
                prompt: prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        pre_procedure_prep: { type: "string" },
                        patient_education: { type: "string" },
                        required_supplies: { type: "string" },
                        required_tools: { type: "string" },
                        procedure_steps: { type: "string" },
                        post_procedure_notes: { type: "string" },
                        estimated_time: { type: "string" }
                    }
                }
            });

            setFormData(prev => ({
                ...prev,
                ...response
            }));
        } catch (error) {
            console.error("Failed to generate content:", error);
            alert("Failed to generate content. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!formData.procedure_name) {
            alert("Please enter a procedure name");
            return;
        }

        setIsSaving(true);
        try {
            if (procedure?.id) {
                await base44.entities.Procedure.update(procedure.id, formData);
            } else {
                await base44.entities.Procedure.create(formData);
            }
            onSuccess();
        } catch (error) {
            console.error("Failed to save procedure:", error);
            alert("Failed to save procedure. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {procedure ? "Edit Procedure" : "Add New Procedure"}
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="basic">Basic Info</TabsTrigger>
                        <TabsTrigger value="instructions">Instructions</TabsTrigger>
                        <TabsTrigger value="details">Details</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4">
                        <div>
                            <Label>Procedure Name *</Label>
                            <Input
                                value={formData.procedure_name}
                                onChange={(e) => setFormData({ ...formData, procedure_name: e.target.value })}
                                placeholder="e.g., Juliet Laser Treatment"
                            />
                        </div>

                        <div>
                            <Label>Category</Label>
                            <Input
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                placeholder="e.g., Laser, Injectable, Gynecology"
                            />
                        </div>

                        <div>
                            <Label>Estimated Time</Label>
                            <Input
                                value={formData.estimated_time}
                                onChange={(e) => setFormData({ ...formData, estimated_time: e.target.value })}
                                placeholder="e.g., 30-45 minutes"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                onClick={handleGenerateContent}
                                disabled={isGenerating || !formData.procedure_name}
                                variant="outline"
                                className="flex-1"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Generate with AI
                                    </>
                                )}
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="instructions" className="space-y-4">
                        <div>
                            <Label>Pre-Procedure Prep (Staff)</Label>
                            <ReactQuill
                                value={formData.pre_procedure_prep}
                                onChange={(value) => setFormData({ ...formData, pre_procedure_prep: value })}
                                className="bg-white"
                                placeholder="Room setup, patient positioning, safety checks..."
                            />
                        </div>

                        <div>
                            <Label>Patient Education</Label>
                            <ReactQuill
                                value={formData.patient_education}
                                onChange={(value) => setFormData({ ...formData, patient_education: value })}
                                className="bg-white"
                                placeholder="What to tell the patient about expectations..."
                            />
                        </div>

                        <div>
                            <Label>Step-by-Step Instructions</Label>
                            <ReactQuill
                                value={formData.procedure_steps}
                                onChange={(value) => setFormData({ ...formData, procedure_steps: value })}
                                className="bg-white"
                                placeholder="Detailed procedure steps..."
                            />
                        </div>

                        <div>
                            <Label>Post-Procedure Notes</Label>
                            <ReactQuill
                                value={formData.post_procedure_notes}
                                onChange={(value) => setFormData({ ...formData, post_procedure_notes: value })}
                                className="bg-white"
                                placeholder="Cleanup, immediate care, documentation..."
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="details" className="space-y-4">
                        <div>
                            <Label>Required Supplies</Label>
                            <Textarea
                                value={formData.required_supplies}
                                onChange={(e) => setFormData({ ...formData, required_supplies: e.target.value })}
                                placeholder="List supplies needed (reference inventory items)..."
                                rows={4}
                            />
                        </div>

                        <div>
                            <Label>Required Tools/Equipment</Label>
                            <Textarea
                                value={formData.required_tools}
                                onChange={(e) => setFormData({ ...formData, required_tools: e.target.value })}
                                placeholder="Equipment and tools needed..."
                                rows={4}
                            />
                        </div>

                        <div>
                            <Label>Additional Notes</Label>
                            <Textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Any additional tips or notes..."
                                rows={3}
                            />
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700">
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Procedure
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}