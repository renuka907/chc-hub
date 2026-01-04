import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import SearchBar from "../components/SearchBar";
import AftercareForm from "../components/AftercareForm";
import ConsentFormForm from "../components/ConsentFormForm";
import BulkActionsBar from "../components/BulkActionsBar";
import TagManager from "../components/forms/TagManager";
import { FileText, Printer, Plus, Star } from "lucide-react";

export default function AftercareLibrary() {
    const [searchQuery, setSearchQuery] = useState("");
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [showAftercareForm, setShowAftercareForm] = useState(false);
    const [showConsentForm, setShowConsentForm] = useState(false);
    const [activeTab, setActiveTab] = useState("aftercare");
    const [showClinicForm, setShowClinicForm] = useState(false);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showTagManager, setShowTagManager] = useState(false);
    const queryClient = useQueryClient();

    const { data: aftercareInstructions = [] } = useQuery({
        queryKey: ['aftercareInstructions'],
        queryFn: () => base44.entities.AftercareInstruction.list('-updated_date', 100),
    });

    const { data: consentForms = [] } = useQuery({
        queryKey: ['consentForms'],
        queryFn: () => base44.entities.ConsentForm.list('-updated_date', 100),
    });

    const handleSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['aftercareInstructions'] });
        queryClient.invalidateQueries({ queryKey: ['consentForms'] });
    };

    const toggleAftercareFavorite = async (id, currentValue) => {
        await base44.entities.AftercareInstruction.update(id, { is_favorite: !currentValue });
        queryClient.invalidateQueries({ queryKey: ['aftercareInstructions'] });
    };

    const toggleFormFavorite = async (id, currentValue) => {
        await base44.entities.ConsentForm.update(id, { is_favorite: !currentValue });
        queryClient.invalidateQueries({ queryKey: ['consentForms'] });
    };

    const toggleSelection = (id) => {
        const newSelection = new Set(selectedItems);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedItems(newSelection);
    };

    const bulkDeleteMutation = useMutation({
        mutationFn: async () => {
            const entityName = activeTab === "consent" ? "ConsentForm" : "AftercareInstruction";
            for (const id of selectedItems) {
                await base44.entities[entityName].delete(id);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['aftercareInstructions'] });
            queryClient.invalidateQueries({ queryKey: ['consentForms'] });
            setSelectedItems(new Set());
            setShowDeleteDialog(false);
        }
    });

    const handleBulkTag = async (tagsJson) => {
        const entityName = activeTab === "consent" ? "ConsentForm" : "AftercareInstruction";
        for (const id of selectedItems) {
            await base44.entities[entityName].update(id, { tags: tagsJson });
        }
        queryClient.invalidateQueries({ queryKey: ['aftercareInstructions'] });
        queryClient.invalidateQueries({ queryKey: ['consentForms'] });
        setSelectedItems(new Set());
    };

    const filteredAftercare = aftercareInstructions.filter(item => {
        const matchesSearch = item.procedure_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFavorite = !showFavoritesOnly || item.is_favorite;
        const isNotProviderForm = item.category !== "Provider Forms";
        return matchesSearch && matchesFavorite && isNotProviderForm;
    });

    const filteredClinicForms = aftercareInstructions.filter(item => {
        const matchesSearch = item.procedure_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFavorite = !showFavoritesOnly || item.is_favorite;
        const isProviderForm = item.category === "Provider Forms";
        return matchesSearch && matchesFavorite && isProviderForm;
    });

    const filteredForms = consentForms.filter(form => {
        const matchesSearch = form.form_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            form.form_type?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFavorite = !showFavoritesOnly || form.is_favorite;
        return matchesSearch && matchesFavorite;
    });

    const categoryColors = {
        "Gynecology": "bg-pink-100 text-pink-800",
        "Hormone Therapy": "bg-purple-100 text-purple-800",
        "Mens Health": "bg-blue-100 text-blue-800",
        "General": "bg-gray-100 text-gray-800",
        "Provider Forms": "bg-orange-100 text-orange-800"
    };

    const formTypeColors = {
        "Procedure": "bg-blue-100 text-blue-800",
        "Treatment": "bg-purple-100 text-purple-800",
        "General": "bg-gray-100 text-gray-800",
        "HIPAA": "bg-green-100 text-green-800",
        "Financial": "bg-amber-100 text-amber-800"
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Aftercare & Forms</h1>
                    <p className="text-gray-600">Post-procedure instructions and consent forms</p>
                </div>
                <Button 
                    onClick={() => {
                        if (activeTab === "aftercare") setShowAftercareForm(true);
                        else if (activeTab === "consent") setShowConsentForm(true);
                        else if (activeTab === "clinic") setShowClinicForm(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create {activeTab === "aftercare" ? "Aftercare" : activeTab === "consent" ? "Consent Form" : "Clinic Form"}
                </Button>
            </div>

            {/* Search and Favorites */}
            <div className="space-y-4">
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search procedures or forms..."
                />
                <Button
                    variant={showFavoritesOnly ? "default" : "outline"}
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    className={showFavoritesOnly ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                >
                    <Star className={`w-4 h-4 mr-2 ${showFavoritesOnly ? 'fill-white' : ''}`} />
                    {showFavoritesOnly ? 'Show All' : 'Show Favorites Only'}
                </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3 gap-4">
                    <TabsTrigger value="aftercare" className="text-base">
                        Aftercare Instructions
                    </TabsTrigger>
                    <TabsTrigger value="consent" className="text-base">
                        Consent Forms
                    </TabsTrigger>
                    <TabsTrigger value="clinic" className="text-base">
                        Clinic Forms
                    </TabsTrigger>
                </TabsList>

                {/* Aftercare Tab */}
                <TabsContent value="aftercare" className="space-y-4">
                    {filteredAftercare.length === 0 ? (
                        <Card className="text-center py-12">
                            <CardContent>
                                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No aftercare instructions found</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-6">
                            {filteredAftercare.map(instruction => (
                                <div key={instruction.id} className="relative">
                                    <div className="absolute top-4 left-4 z-10">
                                        <Checkbox
                                            checked={selectedItems.has(instruction.id)}
                                            onCheckedChange={() => toggleSelection(instruction.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="bg-white border-2 border-gray-400"
                                        />
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toggleAftercareFavorite(instruction.id, instruction.is_favorite);
                                        }}
                                        className="absolute top-4 right-4 z-10 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform"
                                    >
                                        <Star className={`w-4 h-4 ${instruction.is_favorite ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}`} />
                                    </button>
                                    <Link to={createPageUrl(`AftercareDetail?id=${instruction.id}`)}>
                                        <Card className={`h-full hover:shadow-lg transition-all duration-300 border-2 ${selectedItems.has(instruction.id) ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-200'} cursor-pointer group`}>
                                            <CardHeader>
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex gap-2 flex-wrap">
                                                        {instruction.category && (
                                                            <Badge className={categoryColors[instruction.category] || "bg-gray-100 text-gray-800"}>
                                                                {instruction.category}
                                                            </Badge>
                                                        )}
                                                        {instruction.version && (
                                                            <Badge variant="outline">v{instruction.version}</Badge>
                                                        )}
                                                    </div>
                                                    <Printer className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                                </div>
                                                <CardTitle className="group-hover:text-blue-600 transition-colors">
                                                    {instruction.procedure_name}
                                                </CardTitle>
                                                {instruction.duration && (
                                                    <CardDescription>
                                                        Recovery: {instruction.duration}
                                                    </CardDescription>
                                                )}
                                                {instruction.tags && JSON.parse(instruction.tags).length > 0 && (
                                                    <div className="flex gap-1 flex-wrap mt-2">
                                                        {JSON.parse(instruction.tags).slice(0, 3).map(tag => (
                                                            <Badge key={tag} variant="secondary" className="text-xs">
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </CardHeader>
                                        </Card>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Consent Forms Tab */}
                <TabsContent value="consent" className="space-y-4">
                    {filteredForms.length === 0 ? (
                        <Card className="text-center py-12">
                            <CardContent>
                                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No consent forms found</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-6">
                            {filteredForms.map(form => (
                                <div key={form.id} className="relative">
                                    <div className="absolute top-4 left-4 z-10">
                                        <Checkbox
                                            checked={selectedItems.has(form.id)}
                                            onCheckedChange={() => toggleSelection(form.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="bg-white border-2 border-gray-400"
                                        />
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toggleFormFavorite(form.id, form.is_favorite);
                                        }}
                                        className="absolute top-4 right-4 z-10 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform"
                                    >
                                        <Star className={`w-4 h-4 ${form.is_favorite ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}`} />
                                    </button>
                                    <Link to={createPageUrl(`ConsentFormDetail?id=${form.id}`)}>
                                        <Card className={`h-full hover:shadow-lg transition-all duration-300 border-2 ${selectedItems.has(form.id) ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-200'} cursor-pointer group`}>
                                            <CardHeader>
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex gap-2 flex-wrap">
                                                        <Badge className={formTypeColors[form.form_type] || "bg-gray-100 text-gray-800"}>
                                                            {form.form_type}
                                                        </Badge>
                                                        {form.version && (
                                                            <Badge variant="outline">v{form.version}</Badge>
                                                        )}
                                                    </div>
                                                    <Printer className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                                </div>
                                                <CardTitle className="group-hover:text-blue-600 transition-colors">
                                                    {form.form_name}
                                                </CardTitle>
                                                {form.tags && JSON.parse(form.tags).length > 0 && (
                                                    <div className="flex gap-1 flex-wrap mt-2">
                                                        {JSON.parse(form.tags).slice(0, 3).map(tag => (
                                                            <Badge key={tag} variant="secondary" className="text-xs">
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </CardHeader>
                                        </Card>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Clinic Forms Tab */}
                <TabsContent value="clinic" className="space-y-4">
                    {filteredClinicForms.length === 0 ? (
                        <Card className="text-center py-12">
                            <CardContent>
                                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No clinic forms found</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-6">
                            {filteredClinicForms.map(instruction => (
                                <div key={instruction.id} className="relative">
                                    <div className="absolute top-4 left-4 z-10">
                                        <Checkbox
                                            checked={selectedItems.has(instruction.id)}
                                            onCheckedChange={() => toggleSelection(instruction.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="bg-white border-2 border-gray-400"
                                        />
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toggleAftercareFavorite(instruction.id, instruction.is_favorite);
                                        }}
                                        className="absolute top-4 right-4 z-10 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform"
                                    >
                                        <Star className={`w-4 h-4 ${instruction.is_favorite ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}`} />
                                    </button>
                                    <Link to={createPageUrl(`AftercareDetail?id=${instruction.id}`)}>
                                        <Card className={`h-full hover:shadow-lg transition-all duration-300 border-2 ${selectedItems.has(instruction.id) ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-200'} cursor-pointer group`}>
                                            <CardHeader>
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex gap-2 flex-wrap">
                                                        <Badge className="bg-orange-100 text-orange-800">
                                                            Clinic Form
                                                        </Badge>
                                                        {instruction.version && (
                                                            <Badge variant="outline">v{instruction.version}</Badge>
                                                        )}
                                                    </div>
                                                    <Printer className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                                </div>
                                                <CardTitle className="group-hover:text-blue-600 transition-colors">
                                                    {instruction.procedure_name}
                                                </CardTitle>
                                                {instruction.tags && JSON.parse(instruction.tags).length > 0 && (
                                                    <div className="flex gap-1 flex-wrap mt-2">
                                                        {JSON.parse(instruction.tags).slice(0, 3).map(tag => (
                                                            <Badge key={tag} variant="secondary" className="text-xs">
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </CardHeader>
                                        </Card>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <AftercareForm
                open={showAftercareForm}
                onOpenChange={setShowAftercareForm}
                onSuccess={handleSuccess}
            />

            <ConsentFormForm
                open={showConsentForm}
                onOpenChange={setShowConsentForm}
                onSuccess={handleSuccess}
            />

            <AftercareForm
                open={showClinicForm}
                onOpenChange={setShowClinicForm}
                onSuccess={handleSuccess}
            />

            <BulkActionsBar
                selectedCount={selectedItems.size}
                onDelete={() => setShowDeleteDialog(true)}
                onTag={() => setShowTagManager(true)}
                onClear={() => setSelectedItems(new Set())}
            />

            <TagManager
                open={showTagManager}
                onOpenChange={setShowTagManager}
                currentTags={[]}
                onSave={handleBulkTag}
            />

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Selected Items?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''}? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => bulkDeleteMutation.mutate()} 
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