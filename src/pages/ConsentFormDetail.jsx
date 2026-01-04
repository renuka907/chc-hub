import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PrintableDocument from "../components/PrintableDocument";
import ConsentFormForm from "../components/ConsentFormForm";
import VersionHistory from "../components/forms/VersionHistory";
import TagManager from "../components/forms/TagManager";
import ShareFormDialog from "../components/forms/ShareFormDialog";
import { usePermissions } from "../components/permissions/usePermissions";
import { openPrintWindow } from "../components/PrintHelper";
import { Printer, ArrowLeft, Pencil, Star, FileText, Trash2, History, Tag, Copy, Share2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function ConsentFormDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const formId = urlParams.get('id');
    const [showEditForm, setShowEditForm] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showVersionHistory, setShowVersionHistory] = useState(false);
    const [showTagManager, setShowTagManager] = useState(false);
    const [showNewVersionDialog, setShowNewVersionDialog] = useState(false);
    const [showShareDialog, setShowShareDialog] = useState(false);
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { can } = usePermissions();

    const { data: forms = [] } = useQuery({
        queryKey: ['consentForms'],
        queryFn: () => base44.entities.ConsentForm.list(),
    });

    const form = forms.find(f => f.id === formId);

    const handleSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['consentForms'] });
        setShowEditForm(false);
    };

    const toggleFavorite = async () => {
        await base44.entities.ConsentForm.update(form.id, { is_favorite: !form.is_favorite });
        queryClient.invalidateQueries({ queryKey: ['consentForms'] });
    };

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.ConsentForm.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['consentForms'] });
            navigate(createPageUrl("AftercareLibrary"));
        }
    });

    const handleDelete = () => {
        deleteMutation.mutate(form.id);
        setShowDeleteDialog(false);
    };

    const createNewVersion = async () => {
        const newVersionNum = form.version ? `${parseFloat(form.version) + 0.1}` : "1.0";
        const newForm = {
            ...form,
            id: undefined,
            version: newVersionNum,
            parent_id: form.id,
            effective_date: new Date().toISOString().split('T')[0]
        };
        const created = await base44.entities.ConsentForm.create(newForm);
        queryClient.invalidateQueries({ queryKey: ['consentForms'] });
        navigate(createPageUrl(`ConsentFormDetail?id=${created.id}`));
        setShowNewVersionDialog(false);
    };

    const handleSaveTags = async (tagsJson) => {
        await base44.entities.ConsentForm.update(form.id, { tags: tagsJson });
        queryClient.invalidateQueries({ queryKey: ['consentForms'] });
    };

    const viewVersion = (version) => {
        navigate(createPageUrl(`ConsentFormDetail?id=${version.id}`));
    };

    const removeDocument = async () => {
        await base44.entities.ConsentForm.update(form.id, { document_url: "" });
        queryClient.invalidateQueries({ queryKey: ['consentForms'] });
    };

    const formTypeColors = {
        "Procedure": "bg-blue-100 text-blue-800",
        "Treatment": "bg-purple-100 text-purple-800",
        "General": "bg-gray-100 text-gray-800",
        "HIPAA": "bg-green-100 text-green-800",
        "Financial": "bg-amber-100 text-amber-800"
    };

    if (!form) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Loading form...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex items-center justify-between no-print">
                <Link to={createPageUrl("AftercareLibrary")}>
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Library
                    </Button>
                </Link>
                <div className="flex gap-2">
                    {can("consent", "share") && (
                        <Button variant="outline" onClick={() => setShowShareDialog(true)} className="border-blue-500 text-blue-600">
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                        </Button>
                    )}
                    <Button 
                        variant="outline" 
                        onClick={toggleFavorite}
                        className={form.is_favorite ? "border-yellow-500 text-yellow-600" : ""}
                    >
                        <Star className={`w-4 h-4 mr-2 ${form.is_favorite ? 'fill-yellow-500' : ''}`} />
                        {form.is_favorite ? 'Unfavorite' : 'Favorite'}
                    </Button>
                    {can("consent", "edit") && (
                        <>
                            <Button variant="outline" onClick={() => setShowTagManager(true)}>
                                <Tag className="w-4 h-4 mr-2" />
                                Tags
                            </Button>
                            <Button variant="outline" onClick={() => setShowVersionHistory(true)}>
                                <History className="w-4 h-4 mr-2" />
                                Version History
                            </Button>
                            <Button variant="outline" onClick={() => setShowNewVersionDialog(true)}>
                                <Copy className="w-4 h-4 mr-2" />
                                New Version
                            </Button>
                            <Button variant="outline" onClick={() => setShowEditForm(true)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                            </Button>
                        </>
                    )}
                    {can("consent", "delete") && (
                        <Button variant="outline" onClick={() => setShowDeleteDialog(true)} className="border-red-300 text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                        </Button>
                    )}
                    <Button onClick={openPrintWindow} className="bg-blue-600 hover:bg-blue-700">
                        <Printer className="w-4 h-4 mr-2" />
                        Print / PDF
                    </Button>
                </div>
            </div>

            {/* Form Info */}
            <Card className="no-print mb-6">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold mb-2">{form.form_name}</h2>
                            <div className="flex gap-2 flex-wrap">
                                <Badge className={formTypeColors[form.form_type] || "bg-gray-100 text-gray-800"}>
                                    {form.form_type}
                                </Badge>
                                {form.version && (
                                    <Badge variant="outline">Version {form.version}</Badge>
                                )}
                                {form.effective_date && (
                                    <Badge variant="secondary">Effective: {new Date(form.effective_date).toLocaleDateString()}</Badge>
                                )}
                            </div>
                            {form.tags && JSON.parse(form.tags).length > 0 && (
                                <div className="flex gap-1 flex-wrap mt-3">
                                    {JSON.parse(form.tags).map(tag => (
                                        <Badge key={tag} variant="secondary">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Printable Content */}
            <PrintableDocument title="" showLogo={false}>
                <div 
                    className="text-black"
                    style={{
                        fontSize: '11pt',
                        fontFamily: 'Times New Roman, serif',
                        lineHeight: '1.4',
                        textAlign: 'left'
                    }}
                    dangerouslySetInnerHTML={{ __html: form.content }}
                />
            </PrintableDocument>

            {/* Uploaded Document - Outside printable section, at the very bottom */}
            {form.document_url && (
                <Card className="bg-slate-50 border-slate-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <FileText className="w-6 h-6 text-slate-600" />
                                <div>
                                    <p className="font-semibold text-slate-900">Attached Document (PDF)</p>
                                    <p className="text-sm text-slate-600">View, print, or download the full document</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <a 
                                    href={form.document_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                >
                                    <Button variant="outline" size="sm">
                                        <Printer className="w-4 h-4 mr-2" />
                                        Open PDF
                                    </Button>
                                </a>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={removeDocument}
                                    className="text-red-600 hover:bg-red-50"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Remove
                                </Button>
                            </div>
                        </div>
                        <iframe 
                            src={form.document_url}
                            className="w-full h-[600px] border-2 border-slate-300 rounded-lg"
                            title="Document Preview"
                        />
                    </CardContent>
                </Card>
            )}

            {form && (
                <ConsentFormForm
                    open={showEditForm}
                    onOpenChange={setShowEditForm}
                    onSuccess={handleSuccess}
                    editForm={form}
                />
            )}

            <VersionHistory
                open={showVersionHistory}
                onOpenChange={setShowVersionHistory}
                currentItem={form}
                entityName="ConsentForm"
                onViewVersion={viewVersion}
            />

            <TagManager
                open={showTagManager}
                onOpenChange={setShowTagManager}
                currentTags={form.tags || "[]"}
                onSave={handleSaveTags}
            />

            <AlertDialog open={showNewVersionDialog} onOpenChange={setShowNewVersionDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Create New Version</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will create a new version based on the current form. The new version will be editable while preserving this version in history.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={createNewVersion} className="bg-blue-600 hover:bg-blue-700">
                            Create Version
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Consent Form?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{form?.form_name}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <ShareFormDialog
                open={showShareDialog}
                onOpenChange={setShowShareDialog}
                entityType="ConsentForm"
                entityId={form.id}
                formName={form.form_name}
            />
            </div>
            );
            }