import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Star, Eye, Trash2, Edit, Copy, Sparkles } from "lucide-react";
import SearchBar from "../components/SearchBar";
import TemplateForm from "../components/templates/TemplateForm";
import TemplatePreview from "../components/templates/TemplatePreview";
import AISuggestTemplates from "../components/templates/AISuggestTemplates";
import { usePermissions } from "../components/permissions/usePermissions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function FormTemplates() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("consent");
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [showAISuggest, setShowAISuggest] = useState(false);
    const queryClient = useQueryClient();
    const { can } = usePermissions();

    const { data: templates = [], isLoading } = useQuery({
        queryKey: ['formTemplates'],
        queryFn: () => base44.entities.FormTemplate.list('-updated_date', 100),
    });

    const toggleFavoriteMutation = useMutation({
        mutationFn: ({ id, isFavorite }) => 
            base44.entities.FormTemplate.update(id, { is_favorite: !isFavorite }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['formTemplates'] })
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.FormTemplate.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['formTemplates'] });
            setDeleteConfirm(null);
        }
    });

    const filteredTemplates = templates.filter(template => {
        const matchesSearch = template.template_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.category?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = template.template_type === (activeTab === "consent" ? "ConsentForm" : "AftercareInstruction");
        return matchesSearch && matchesTab;
    });

    const categoryColors = {
        "Gynecology": "bg-pink-100 text-pink-800",
        "Hormone Therapy": "bg-purple-100 text-purple-800",
        "Mens Health": "bg-blue-100 text-blue-800",
        "General": "bg-gray-100 text-gray-800",
        "Procedure": "bg-blue-100 text-blue-800",
        "Treatment": "bg-purple-100 text-purple-800",
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Form Templates</h1>
                    <p className="text-gray-600">Manage reusable templates for forms</p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        onClick={() => setShowAISuggest(true)}
                        variant="outline"
                        className="border-purple-500 text-purple-600"
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        AI Suggestions
                    </Button>
                    {can(activeTab === "consent" ? "consent" : "aftercare", "create") && (
                        <Button 
                            onClick={() => setShowCreateDialog(true)}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Template
                        </Button>
                    )}
                </div>
            </div>

            <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search templates..."
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2 gap-4">
                    <TabsTrigger value="consent">Consent Form Templates</TabsTrigger>
                    <TabsTrigger value="aftercare">Aftercare Templates</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                        </div>
                    ) : filteredTemplates.length === 0 ? (
                        <Card className="text-center py-12">
                            <CardContent>
                                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No templates found</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredTemplates.map(template => (
                                <Card key={template.id} className="hover:shadow-lg transition-all">
                                    <CardHeader>
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex gap-2 flex-wrap">
                                                {template.category && (
                                                    <Badge className={categoryColors[template.category] || "bg-gray-100 text-gray-800"}>
                                                        {template.category}
                                                    </Badge>
                                                )}
                                                <Badge variant="outline" className="text-xs">
                                                    <Copy className="w-3 h-3 mr-1" />
                                                    {template.usage_count || 0} uses
                                                </Badge>
                                            </div>
                                            <button
                                                onClick={() => toggleFavoriteMutation.mutate({ id: template.id, isFavorite: template.is_favorite })}
                                                className="flex-shrink-0"
                                            >
                                                <Star className={`w-4 h-4 ${template.is_favorite ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}`} />
                                            </button>
                                        </div>
                                        <CardTitle className="text-lg">{template.template_name}</CardTitle>
                                        {template.description && (
                                            <CardDescription className="line-clamp-2">
                                                {template.description}
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setSelectedTemplate(template);
                                                    setShowPreview(true);
                                                }}
                                                className="flex-1"
                                            >
                                                <Eye className="w-3 h-3 mr-1" />
                                                Preview
                                            </Button>
                                            {can(activeTab === "consent" ? "consent" : "aftercare", "edit") && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedTemplate(template);
                                                        setShowCreateDialog(true);
                                                    }}
                                                >
                                                    <Edit className="w-3 h-3" />
                                                </Button>
                                            )}
                                            {can(activeTab === "consent" ? "consent" : "aftercare", "delete") && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setDeleteConfirm(template)}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <TemplateForm
                open={showCreateDialog}
                onOpenChange={(open) => {
                    setShowCreateDialog(open);
                    if (!open) setSelectedTemplate(null);
                }}
                templateType={activeTab === "consent" ? "ConsentForm" : "AftercareInstruction"}
                editTemplate={selectedTemplate}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['formTemplates'] });
                    setShowCreateDialog(false);
                    setSelectedTemplate(null);
                }}
            />

            <TemplatePreview
                open={showPreview}
                onOpenChange={setShowPreview}
                template={selectedTemplate}
            />

            <AISuggestTemplates
                open={showAISuggest}
                onOpenChange={setShowAISuggest}
                templateType={activeTab === "consent" ? "ConsentForm" : "AftercareInstruction"}
            />

            <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Template?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{deleteConfirm?.template_name}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteMutation.mutate(deleteConfirm.id)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}