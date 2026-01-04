import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SearchBar from "../components/SearchBar";
import AftercareForm from "../components/AftercareForm";
import ConsentFormForm from "../components/ConsentFormForm";
import { FileText, Printer, Plus, Star } from "lucide-react";

export default function AftercareLibrary() {
    const [searchQuery, setSearchQuery] = useState("");
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [showAftercareForm, setShowAftercareForm] = useState(false);
    const [showConsentForm, setShowConsentForm] = useState(false);
    const [activeTab, setActiveTab] = useState("aftercare");
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

    const filteredAftercare = aftercareInstructions.filter(item => {
        const matchesSearch = item.procedure_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFavorite = !showFavoritesOnly || item.is_favorite;
        return matchesSearch && matchesFavorite;
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
                    onClick={() => activeTab === "aftercare" ? setShowAftercareForm(true) : setShowConsentForm(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create {activeTab === "aftercare" ? "Aftercare" : "Consent Form"}
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
                <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2 gap-4">
                    <TabsTrigger value="aftercare" className="text-base">
                        Aftercare Instructions
                    </TabsTrigger>
                    <TabsTrigger value="consent" className="text-base">
                        Consent Forms
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
                                        <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200 cursor-pointer group">
                                            <CardHeader>
                                                <div className="flex items-start justify-between mb-2">
                                                    {instruction.category && (
                                                        <Badge className={categoryColors[instruction.category]}>
                                                            {instruction.category}
                                                        </Badge>
                                                    )}
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
                                        <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200 cursor-pointer group">
                                            <CardHeader>
                                                <div className="flex items-start justify-between mb-2">
                                                    <Badge className={formTypeColors[form.form_type]}>
                                                        {form.form_type}
                                                    </Badge>
                                                    <Printer className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                                </div>
                                                <CardTitle className="group-hover:text-blue-600 transition-colors">
                                                    {form.form_name}
                                                </CardTitle>
                                                {form.version && (
                                                    <CardDescription>
                                                        Version {form.version}
                                                    </CardDescription>
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
        </div>
    );
}