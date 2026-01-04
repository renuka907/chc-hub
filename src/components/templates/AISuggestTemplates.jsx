import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Plus, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function AISuggestTemplates({ open, onOpenChange, templateType }) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const queryClient = useQueryClient();

    const { data: existingForms = [] } = useQuery({
        queryKey: [templateType === "ConsentForm" ? 'consentForms' : 'aftercareInstructions'],
        queryFn: () => templateType === "ConsentForm" 
            ? base44.entities.ConsentForm.list() 
            : base44.entities.AftercareInstruction.list(),
        enabled: open
    });

    const { data: existingTemplates = [] } = useQuery({
        queryKey: ['formTemplates', templateType],
        queryFn: async () => {
            const all = await base44.entities.FormTemplate.list();
            return all.filter(t => t.template_type === templateType);
        },
        enabled: open
    });

    const createTemplateMutation = useMutation({
        mutationFn: (templateData) => base44.entities.FormTemplate.create(templateData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['formTemplates'] });
            toast.success("Template created successfully");
        }
    });

    const analyzeForms = async () => {
        if (existingForms.length === 0) {
            toast.error("No forms available to analyze");
            return;
        }

        setIsAnalyzing(true);
        try {
            const formSummaries = existingForms.slice(0, 20).map(form => ({
                name: templateType === "ConsentForm" ? form.form_name : form.procedure_name,
                type: templateType === "ConsentForm" ? form.form_type : form.category,
                contentLength: (form.content || form.instructions || "").length
            }));

            const existingTemplateNames = existingTemplates.map(t => t.template_name);

            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze these ${templateType === "ConsentForm" ? "consent forms" : "aftercare instructions"} and suggest 3-5 useful templates that could be created to make future form creation easier.

Existing forms:
${JSON.stringify(formSummaries, null, 2)}

Existing templates (don't duplicate these):
${existingTemplateNames.join(', ')}

For each suggested template, provide:
1. template_name: A clear, descriptive name
2. category: The appropriate category
3. description: Why this template would be useful (2-3 sentences)
4. reasoning: What pattern or gap you identified

Focus on templates that would cover common use cases or fill gaps in the existing templates.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        suggestions: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    template_name: { type: "string" },
                                    category: { type: "string" },
                                    description: { type: "string" },
                                    reasoning: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });

            setSuggestions(result.suggestions || []);
        } catch (error) {
            toast.error("Failed to analyze forms");
        }
        setIsAnalyzing(false);
    };

    const createTemplate = async (suggestion) => {
        setIsAnalyzing(true);
        try {
            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Create a detailed ${templateType === "ConsentForm" ? "consent form" : "aftercare instruction"} template for: ${suggestion.template_name}

Category: ${suggestion.category}
Purpose: ${suggestion.description}

Generate professional, complete content with proper structure, sections, and placeholders for variable information. Format as HTML with proper headings, lists, and formatting.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        content: { type: "string" }
                    }
                }
            });

            await createTemplateMutation.mutateAsync({
                template_name: suggestion.template_name,
                template_type: templateType,
                category: suggestion.category,
                description: suggestion.description,
                content: result.content,
                metadata: "{}",
                tags: "[]",
                usage_count: 0,
                is_public: true
            });

            // Remove from suggestions
            setSuggestions(suggestions.filter(s => s.template_name !== suggestion.template_name));
        } catch (error) {
            toast.error("Failed to create template");
        }
        setIsAnalyzing(false);
    };

    React.useEffect(() => {
        if (open && suggestions.length === 0) {
            analyzeForms();
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        AI Template Suggestions
                    </DialogTitle>
                </DialogHeader>

                {isAnalyzing && suggestions.length === 0 ? (
                    <div className="text-center py-12">
                        <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
                        <p className="text-gray-600">Analyzing your forms to suggest useful templates...</p>
                    </div>
                ) : suggestions.length === 0 ? (
                    <Card className="text-center py-12">
                        <CardContent>
                            <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No suggestions available</p>
                            <Button 
                                onClick={analyzeForms}
                                className="mt-4"
                                variant="outline"
                            >
                                Re-analyze Forms
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Based on your existing forms, here are templates that could streamline your workflow:
                        </p>
                        {suggestions.map((suggestion, idx) => (
                            <Card key={idx} className="border-2 border-purple-200">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                {suggestion.template_name}
                                                <Badge variant="secondary">{suggestion.category}</Badge>
                                            </CardTitle>
                                            <CardDescription className="mt-2">
                                                {suggestion.description}
                                            </CardDescription>
                                        </div>
                                        <Button
                                            onClick={() => createTemplate(suggestion)}
                                            disabled={isAnalyzing || createTemplateMutation.isPending}
                                            size="sm"
                                            className="bg-purple-600 hover:bg-purple-700"
                                        >
                                            {isAnalyzing ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <Plus className="w-4 h-4 mr-1" />
                                                    Create
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-purple-50 rounded-lg p-3 text-sm text-purple-900">
                                        <strong>Why this template?</strong> {suggestion.reasoning}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}