import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { toast } from "sonner";

export default function ProcedureForm({ open, onOpenChange, procedure, onSuccess }) {
    const [formData, setFormData] = useState({
        procedure_name: "",
        category: "",
        pre_procedure_prep: "",
        patient_education: "",
        required_supplies: "",
        required_tools: "",
        procedure_steps: "",
        post_procedure_notes: "",
        estimated_time: "",
        notes: ""
    });
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (procedure) {
            setFormData({
                procedure_name: procedure.procedure_name || "",
                category: procedure.category || "",
                pre_procedure_prep: procedure.pre_procedure_prep || "",
                patient_education: procedure.patient_education || "",
                required_supplies: procedure.required_supplies || "",
                required_tools: procedure.required_tools || "",
                procedure_steps: procedure.procedure_steps || "",
                post_procedure_notes: procedure.post_procedure_notes || "",
                estimated_time: procedure.estimated_time || "",
                notes: procedure.notes || ""
            });
        } else {
            setFormData({
                procedure_name: "",
                category: "",
                pre_procedure_prep: "",
                patient_education: "",
                required_supplies: "",
                required_tools: "",
                procedure_steps: "",
                post_procedure_notes: "",
                estimated_time: "",
                notes: ""
            });
        }
    }, [procedure, open]);

    const saveMutation = useMutation({
        mutationFn: async (data) => {
            if (procedure) {
                return await base44.entities.Procedure.update(procedure.id, data);
            } else {
                return await base44.entities.Procedure.create(data);
            }
        },
        onSuccess: () => {
            toast.success(procedure ? "Procedure updated" : "Procedure created");
            onSuccess();
        },
        onError: (error) => {
            toast.error("Failed to save procedure");
            console.error(error);
        }
    });

    const handleAIGenerate = async () => {
        if (!formData.procedure_name) {
            toast.error("Please enter a procedure name first");
            return;
        }

        setIsGenerating(true);
        try {
            const prompt = `Generate comprehensive procedure documentation for: ${formData.procedure_name}${formData.category ? ` (Category: ${formData.category})` : ''}

Please provide:
1. Pre-procedure prep instructions for staff (room setup, patient preparation)
2. Patient education (what to tell the patient about what to expect)
3. Required supplies (list of consumables needed)
4. Required tools and equipment
5. Step-by-step procedure instructions (numbered steps)
6. Post-procedure notes (immediate care and cleanup)
7. Estimated time duration

Format each section clearly with headers.`;

            const response = await base44.integrations.Core.InvokeLLM({
                prompt: prompt,
                add_context_from_internet: true
            });

            // Parse the response and update form fields
            const content = response;
            
            // Try to extract sections from the response
            const sections = {
                pre_procedure_prep: extractSection(content, ['pre-procedure', 'preparation', 'prep']),
                patient_education: extractSection(content, ['patient education', 'what to tell', 'patient info']),
                required_supplies: extractSection(content, ['supplies', 'consumables']),
                required_tools: extractSection(content, ['tools', 'equipment']),
                procedure_steps: extractSection(content, ['steps', 'procedure', 'instructions']),
                post_procedure_notes: extractSection(content, ['post-procedure', 'aftercare', 'cleanup']),
                estimated_time: extractSection(content, ['time', 'duration', 'estimated'])
            };

            setFormData(prev => ({
                ...prev,
                ...Object.fromEntries(
                    Object.entries(sections).filter(([_, value]) => value)
                )
            }));

            toast.success("AI content generated successfully");
        } catch (error) {
            toast.error("Failed to generate content");
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    const extractSection = (text, keywords) => {
        const lines = text.split('\n');
        let capturing = false;
        let result = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].toLowerCase();
            
            if (keywords.some(keyword => line.includes(keyword))) {
                capturing = true;
                continue;
            }
            
            if (capturing) {
                if (line.match(/^#+\s/) || (line.length > 0 && lines[i+1] === '')) {
                    if (result.length > 0) break;
                }
                if (lines[i].trim()) {
                    result.push(lines[i]);
                }
            }
        }
        
        return result.join('\n').trim();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        saveMutation.mutate(formData);
    };

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['clean']
        ]
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {procedure ? "Edit Procedure" : "New Procedure"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="basic">Basic Info</TabsTrigger>
                            <TabsTrigger value="prep">Prep & Education</TabsTrigger>
                            <TabsTrigger value="procedure">Procedure Steps</TabsTrigger>
                            <TabsTrigger value="supplies">Supplies & Tools</TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic" className="space-y-4">
                            <div>
                                <Label htmlFor="procedure_name">Procedure Name *</Label>
                                <Input
                                    id="procedure_name"
                                    value={formData.procedure_name}
                                    onChange={(e) => setFormData({...formData, procedure_name: e.target.value})}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="category">Category</Label>
                                <Input
                                    id="category"
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    placeholder="e.g., Laser, Injectable, Gynecology"
                                />
                            </div>

                            <div>
                                <Label htmlFor="estimated_time">Estimated Time</Label>
                                <Input
                                    id="estimated_time"
                                    value={formData.estimated_time}
                                    onChange={(e) => setFormData({...formData, estimated_time: e.target.value})}
                                    placeholder="e.g., 30-45 minutes"
                                />
                            </div>

                            <div>
                                <Label htmlFor="notes">Additional Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                    rows={3}
                                />
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleAIGenerate}
                                disabled={isGenerating || !formData.procedure_name}
                                className="w-full"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Generating with AI...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Generate Content with AI
                                    </>
                                )}
                            </Button>
                        </TabsContent>

                        <TabsContent value="prep" className="space-y-4">
                            <div>
                                <Label>Pre-Procedure Prep (Staff Instructions)</Label>
                                <ReactQuill
                                    value={formData.pre_procedure_prep}
                                    onChange={(value) => setFormData({...formData, pre_procedure_prep: value})}
                                    modules={quillModules}
                                    className="bg-white"
                                />
                            </div>

                            <div>
                                <Label>Patient Education</Label>
                                <ReactQuill
                                    value={formData.patient_education}
                                    onChange={(value) => setFormData({...formData, patient_education: value})}
                                    modules={quillModules}
                                    className="bg-white"
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="procedure" className="space-y-4">
                            <div>
                                <Label>Procedure Steps</Label>
                                <ReactQuill
                                    value={formData.procedure_steps}
                                    onChange={(value) => setFormData({...formData, procedure_steps: value})}
                                    modules={quillModules}
                                    className="bg-white"
                                />
                            </div>

                            <div>
                                <Label>Post-Procedure Notes</Label>
                                <ReactQuill
                                    value={formData.post_procedure_notes}
                                    onChange={(value) => setFormData({...formData, post_procedure_notes: value})}
                                    modules={quillModules}
                                    className="bg-white"
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="supplies" className="space-y-4">
                            <div>
                                <Label>Required Supplies</Label>
                                <Textarea
                                    value={formData.required_supplies}
                                    onChange={(e) => setFormData({...formData, required_supplies: e.target.value})}
                                    rows={6}
                                    placeholder="List supplies needed (can reference inventory items)"
                                />
                            </div>

                            <div>
                                <Label>Required Tools & Equipment</Label>
                                <Textarea
                                    value={formData.required_tools}
                                    onChange={(e) => setFormData({...formData, required_tools: e.target.value})}
                                    rows={6}
                                    placeholder="List tools and equipment needed"
                                />
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saveMutation.isPending} className="bg-purple-600 hover:bg-purple-700">
                            {saveMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                procedure ? "Update Procedure" : "Create Procedure"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}