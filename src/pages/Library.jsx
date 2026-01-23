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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import SearchBar from "../components/SearchBar";
import AftercareForm from "../components/AftercareForm";
import ConsentFormForm from "../components/ConsentFormForm";
import EducationTopicForm from "../components/EducationTopicForm";
import BulkActionsBar from "../components/BulkActionsBar";
import TagManager from "../components/forms/TagManager";
import DocumentUploadDialog from "../components/library/DocumentUploadDialog";
import DocumentPrintDialog from "../components/library/DocumentPrintDialog";
import DocumentEditDialog from "../components/library/DocumentEditDialog";
import { usePermissions } from "../components/permissions/usePermissions";
import { FileText, Printer, Plus, Star, Filter, X, CalendarIcon, BookOpen, ExternalLink, Upload, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";

export default function Library() {
    const [searchQuery, setSearchQuery] = useState("");
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [formTypeFilter, setFormTypeFilter] = useState("all");
    const [educationCategoryFilter, setEducationCategoryFilter] = useState("all");
    const [dateFrom, setDateFrom] = useState(null);
    const [dateTo, setDateTo] = useState(null);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [showAftercareForm, setShowAftercareForm] = useState(false);
    const [showConsentForm, setShowConsentForm] = useState(false);
    const [showEducationForm, setShowEducationForm] = useState(false);
    const [activeTab, setActiveTab] = useState("education");
    const [showClinicForm, setShowClinicForm] = useState(false);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showTagManager, setShowTagManager] = useState(false);
    const [selectedTags, setSelectedTags] = useState([]);
    const [showDocumentUpload, setShowDocumentUpload] = useState(false);
    const [printDocument, setPrintDocument] = useState(null);
    const [editDocument, setEditDocument] = useState(null);
    const queryClient = useQueryClient();
    const { can } = usePermissions();

    const { data: aftercareInstructions = [] } = useQuery({
        queryKey: ['aftercareInstructions'],
        queryFn: () => base44.entities.AftercareInstruction.list('-updated_date', 100),
    });

    const { data: consentForms = [] } = useQuery({
        queryKey: ['consentForms'],
        queryFn: () => base44.entities.ConsentForm.list('-updated_date', 100),
    });

    const { data: educationTopics = [] } = useQuery({
        queryKey: ['educationTopics'],
        queryFn: () => base44.entities.EducationTopic.list('-updated_date', 100),
    });

    const { data: documents = [] } = useQuery({
        queryKey: ['libraryDocuments'],
        queryFn: () => base44.entities.LibraryDocument.list('-updated_date', 100),
    });

    const handleSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['aftercareInstructions'] });
        queryClient.invalidateQueries({ queryKey: ['consentForms'] });
        queryClient.invalidateQueries({ queryKey: ['educationTopics'] });
        queryClient.invalidateQueries({ queryKey: ['libraryDocuments'] });
    };

    const toggleAftercareFavorite = async (id, currentValue) => {
        await base44.entities.AftercareInstruction.update(id, { is_favorite: !currentValue });
        queryClient.invalidateQueries({ queryKey: ['aftercareInstructions'] });
    };

    const toggleFormFavorite = async (id, currentValue) => {
        await base44.entities.ConsentForm.update(id, { is_favorite: !currentValue });
        queryClient.invalidateQueries({ queryKey: ['consentForms'] });
    };

    const toggleEducationFavorite = async (id, currentValue) => {
        await base44.entities.EducationTopic.update(id, { is_favorite: !currentValue });
        queryClient.invalidateQueries({ queryKey: ['educationTopics'] });
    };

    const toggleDocumentFavorite = async (id, currentValue) => {
        await base44.entities.LibraryDocument.update(id, { is_favorite: !currentValue });
        queryClient.invalidateQueries({ queryKey: ['libraryDocuments'] });
    };

    const deleteDocumentMutation = useMutation({
        mutationFn: (id) => base44.entities.LibraryDocument.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['libraryDocuments'] });
        }
    });

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
            const entityName = activeTab === "consent" ? "ConsentForm" : 
                             activeTab === "education" ? "EducationTopic" : "AftercareInstruction";
            for (const id of selectedItems) {
                await base44.entities[entityName].delete(id);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['aftercareInstructions'] });
            queryClient.invalidateQueries({ queryKey: ['consentForms'] });
            queryClient.invalidateQueries({ queryKey: ['educationTopics'] });
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
            item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.instructions?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFavorite = !showFavoritesOnly || item.is_favorite;
        const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
        const isNotProviderForm = item.category !== "Provider Forms";
        
        const itemDate = new Date(item.updated_date || item.created_date);
        const matchesDateFrom = !dateFrom || itemDate >= dateFrom;
        const matchesDateTo = !dateTo || itemDate <= dateTo;
        
        return matchesSearch && matchesFavorite && matchesCategory && isNotProviderForm && matchesDateFrom && matchesDateTo;
    });

    const filteredClinicForms = aftercareInstructions.filter(item => {
        const matchesSearch = item.procedure_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.instructions?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFavorite = !showFavoritesOnly || item.is_favorite;
        const isProviderForm = item.category === "Provider Forms";
        
        const itemDate = new Date(item.updated_date || item.created_date);
        const matchesDateFrom = !dateFrom || itemDate >= dateFrom;
        const matchesDateTo = !dateTo || itemDate <= dateTo;
        
        return matchesSearch && matchesFavorite && isProviderForm && matchesDateFrom && matchesDateTo;
    });

    const filteredForms = consentForms.filter(form => {
        const matchesSearch = form.form_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            form.form_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            form.content?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFavorite = !showFavoritesOnly || form.is_favorite;
        const matchesFormType = formTypeFilter === "all" || form.form_type === formTypeFilter;
        
        const formDate = new Date(form.updated_date || form.created_date);
        const matchesDateFrom = !dateFrom || formDate >= dateFrom;
        const matchesDateTo = !dateTo || formDate <= dateTo;
        
        return matchesSearch && matchesFavorite && matchesFormType && matchesDateFrom && matchesDateTo;
    });

    const filteredEducation = educationTopics.filter(topic => {
        const matchesSearch = topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            topic.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            topic.content?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = educationCategoryFilter === "all" || topic.category === educationCategoryFilter;
        const matchesFavorite = !showFavoritesOnly || topic.is_favorite;
        
        const topicDate = new Date(topic.updated_date || topic.created_date);
        const matchesDateFrom = !dateFrom || topicDate >= dateFrom;
        const matchesDateTo = !dateTo || topicDate <= dateTo;
        
        return matchesSearch && matchesCategory && matchesFavorite && matchesDateFrom && matchesDateTo;
    });

    const allDocumentTags = React.useMemo(() => {
        const tagSet = new Set();
        documents.forEach(doc => {
            if (doc.tags) {
                try {
                    const docTags = JSON.parse(doc.tags);
                    if (Array.isArray(docTags)) {
                        docTags.forEach(tag => tagSet.add(tag));
                    }
                } catch (e) {
                    // ignore parsing errors
                }
            }
        });
        return Array.from(tagSet).sort();
    }, [documents]);

    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            doc.category?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFavorite = !showFavoritesOnly || doc.is_favorite;
        
        const docDate = new Date(doc.updated_date || doc.created_date);
        const matchesDateFrom = !dateFrom || docDate >= dateFrom;
        const matchesDateTo = !dateTo || docDate <= dateTo;
        
        let matchesTags = true;
        if (selectedTags.length > 0) {
            try {
                const docTags = doc.tags ? JSON.parse(doc.tags) : [];
                matchesTags = selectedTags.some(tag => docTags.includes(tag));
            } catch (e) {
                matchesTags = false;
            }
        }
        
        return matchesSearch && matchesFavorite && matchesDateFrom && matchesDateTo && matchesTags;
    });
    
    const clearAllFilters = () => {
        setSearchQuery("");
        setShowFavoritesOnly(false);
        setCategoryFilter("all");
        setFormTypeFilter("all");
        setEducationCategoryFilter("all");
        setDateFrom(null);
        setDateTo(null);
    };
    
    const hasActiveFilters = searchQuery || showFavoritesOnly || categoryFilter !== "all" || formTypeFilter !== "all" || educationCategoryFilter !== "all" || dateFrom || dateTo;

    const categoryColors = {
        "Gynecology": "bg-pink-100 text-pink-800",
        "Hormone Therapy": "bg-purple-100 text-purple-800",
        "Hormone Replacement Therapy": "bg-purple-100 text-purple-800",
        "Mens Health": "bg-blue-100 text-blue-800",
        "General": "bg-gray-100 text-gray-800",
        "Provider Forms": "bg-orange-100 text-orange-800",
        "Medication Education": "bg-green-100 text-green-800"
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
            <div className="bg-white rounded-3xl p-6 shadow-md">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Resource Library</h1>
                            <p className="text-gray-600">Education, aftercare instructions, and consent forms</p>
                        </div>
                    </div>
                    {can(activeTab === "consent" ? "consent" : activeTab === "education" ? "aftercare" : "aftercare", "create") && (
                        <Button 
                            onClick={() => {
                                if (activeTab === "aftercare") setShowAftercareForm(true);
                                else if (activeTab === "consent") setShowConsentForm(true);
                                else if (activeTab === "clinic") setShowClinicForm(true);
                                else if (activeTab === "education") setShowEducationForm(true);
                                else if (activeTab === "documents") setShowDocumentUpload(true);
                            }}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {activeTab === "documents" ? <Upload className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                            {activeTab === "aftercare" ? "Create Aftercare" : 
                             activeTab === "consent" ? "Create Consent Form" : 
                             activeTab === "clinic" ? "Create Clinic Form" : 
                             activeTab === "documents" ? "Upload Document" : "Create Education Topic"}
                        </Button>
                    )}
                </div>
            </div>

            {/* Search and Filters */}
            <Card className="bg-white">
                <CardContent className="pt-6 space-y-4">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <SearchBar
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder="Search by name, category, or content..."
                            />
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className={showAdvancedFilters ? "bg-purple-50 border-purple-300" : ""}
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Filters
                        </Button>
                    </div>
                    
                    {showAdvancedFilters && (
                        <div className="border-t pt-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Favorites Filter */}
                                <Button
                                    variant={showFavoritesOnly ? "default" : "outline"}
                                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                                    className={`w-full ${showFavoritesOnly ? "bg-yellow-500 hover:bg-yellow-600" : ""}`}
                                >
                                    <Star className={`w-4 h-4 mr-2 ${showFavoritesOnly ? 'fill-white' : ''}`} />
                                    {showFavoritesOnly ? 'Favorites Only' : 'All Items'}
                                </Button>
                                
                                {/* Category Filter (for aftercare) */}
                                {activeTab === "aftercare" && (
                                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filter by category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Categories</SelectItem>
                                            <SelectItem value="Gynecology">Gynecology</SelectItem>
                                            <SelectItem value="Hormone Therapy">Hormone Therapy</SelectItem>
                                            <SelectItem value="Mens Health">Mens Health</SelectItem>
                                            <SelectItem value="General">General</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                                
                                {/* Form Type Filter (for consent forms) */}
                                {activeTab === "consent" && (
                                    <Select value={formTypeFilter} onValueChange={setFormTypeFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filter by type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem>
                                            <SelectItem value="Procedure">Procedure</SelectItem>
                                            <SelectItem value="Treatment">Treatment</SelectItem>
                                            <SelectItem value="General">General</SelectItem>
                                            <SelectItem value="HIPAA">HIPAA</SelectItem>
                                            <SelectItem value="Financial">Financial</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}

                                {/* Education Category Filter */}
                                {activeTab === "education" && (
                                    <Select value={educationCategoryFilter} onValueChange={setEducationCategoryFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filter by category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Categories</SelectItem>
                                            <SelectItem value="Gynecology">Gynecology</SelectItem>
                                            <SelectItem value="Hormone Replacement Therapy">Hormone Replacement Therapy</SelectItem>
                                            <SelectItem value="Mens Health">Mens Health</SelectItem>
                                            <SelectItem value="Medication Education">Medication Education</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                                
                                {/* Date Range */}
                                <div className="flex gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                <CalendarIcon className="w-4 h-4 mr-2" />
                                                {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={dateFrom}
                                                onSelect={setDateFrom}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                <CalendarIcon className="w-4 h-4 mr-2" />
                                                {dateTo ? format(dateTo, "MMM d, yyyy") : "To date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={dateTo}
                                                onSelect={setDateTo}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                            
                            {hasActiveFilters && (
                                <div className="flex items-center justify-between pt-2 border-t">
                                    <span className="text-sm text-gray-600">
                                        {activeTab === "aftercare" && `${filteredAftercare.length} results`}
                                        {activeTab === "consent" && `${filteredForms.length} results`}
                                        {activeTab === "clinic" && `${filteredClinicForms.length} results`}
                                        {activeTab === "education" && `${filteredEducation.length} results`}
                                        {activeTab === "documents" && `${filteredDocuments.length} results`}
                                    </span>
                                    <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                                        <X className="w-4 h-4 mr-2" />
                                        Clear All Filters
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-5 gap-4">
                    <TabsTrigger value="education" className="text-base">
                        Education
                    </TabsTrigger>
                    <TabsTrigger value="aftercare" className="text-base">
                        Aftercare
                    </TabsTrigger>
                    <TabsTrigger value="consent" className="text-base">
                        Consent Forms
                    </TabsTrigger>
                    <TabsTrigger value="clinic" className="text-base">
                        Clinic Forms
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="text-base">
                        Documents
                    </TabsTrigger>
                </TabsList>

                {/* Education Tab */}
                <TabsContent value="education" className="space-y-4">
                    {filteredEducation.length === 0 ? (
                        <Card className="text-center py-12">
                            <CardContent>
                                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">No education topics found</p>
                                <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {["Gynecology", "Hormone Replacement Therapy", "Mens Health", "Medication Education"].map(category => {
                                const categoryTopics = filteredEducation.filter(t => t.category === category);
                                if (categoryTopics.length === 0) return null;
                                
                                return (
                                    <div key={category} className="bg-white rounded-2xl p-6 shadow-md">
                                        <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center">
                                            <span className={`px-3 py-1 rounded-lg text-sm mr-3 ${categoryColors[category]}`}>
                                                {category}
                                            </span>
                                            <span className="text-gray-400 text-sm font-normal">({categoryTopics.length})</span>
                                        </h3>
                                        <div className="space-y-2">
                                            {categoryTopics.map(topic => (
                                                <div key={topic.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors group">
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            toggleEducationFavorite(topic.id, topic.is_favorite);
                                                        }}
                                                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center hover:scale-110 transition-transform"
                                                    >
                                                        <Star className={`w-4 h-4 ${topic.is_favorite ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}`} />
                                                    </button>
                                                    <Link to={createPageUrl(`EducationDetail?id=${topic.id}`)} className="flex-1 flex items-center justify-between min-w-0">
                                                        <div className="flex-1 min-w-0 mr-4">
                                                            <h4 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors truncate">
                                                                {topic.title}
                                                            </h4>
                                                            {topic.summary && (
                                                                <p className="text-sm text-gray-600 line-clamp-1">
                                                                    {topic.summary}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {topic.last_reviewed && (
                                                            <div className="flex items-center text-xs text-gray-500 flex-shrink-0">
                                                                <CalendarIcon className="w-3 h-3 mr-1" />
                                                                {new Date(topic.last_reviewed).toLocaleDateString()}
                                                            </div>
                                                        )}
                                                    </Link>
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            window.open(createPageUrl(`EducationDetail?id=${topic.id}&autoprint=true`), '_blank');
                                                        }}
                                                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center hover:scale-110 transition-transform"
                                                    >
                                                        <Printer className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

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
                        <div className="space-y-6">
                            {["Gynecology", "Hormone Therapy", "Mens Health", "General"].map(category => {
                                const categoryInstructions = filteredAftercare.filter(i => i.category === category);
                                if (categoryInstructions.length === 0) return null;
                                
                                return (
                                    <div key={category} className="bg-white rounded-2xl p-6 shadow-md">
                                        <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center">
                                            <span className={`px-3 py-1 rounded-lg text-sm mr-3 ${categoryColors[category]}`}>
                                                {category}
                                            </span>
                                            <span className="text-gray-400 text-sm font-normal">({categoryInstructions.length})</span>
                                        </h3>
                                        <div className="space-y-2">
                                            {categoryInstructions.map(instruction => (
                                                <div key={instruction.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group">
                                                    <Checkbox
                                                        checked={selectedItems.has(instruction.id)}
                                                        onCheckedChange={() => toggleSelection(instruction.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="flex-shrink-0"
                                                    />
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            toggleAftercareFavorite(instruction.id, instruction.is_favorite);
                                                        }}
                                                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center hover:scale-110 transition-transform"
                                                    >
                                                        <Star className={`w-4 h-4 ${instruction.is_favorite ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}`} />
                                                    </button>
                                                    <Link to={createPageUrl(`AftercareDetail?id=${instruction.id}`)} className="flex-1 flex items-center justify-between min-w-0">
                                                        <div className="flex-1 min-w-0 mr-4">
                                                            <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                                                                {instruction.procedure_name}
                                                            </h4>
                                                            {instruction.duration && (
                                                                <p className="text-sm text-gray-600">
                                                                    Recovery: {instruction.duration}
                                                                </p>
                                                            )}
                                                            {instruction.tags && JSON.parse(instruction.tags).length > 0 && (
                                                                <div className="flex gap-1 flex-wrap mt-1">
                                                                    {JSON.parse(instruction.tags).slice(0, 3).map(tag => (
                                                                        <Badge key={tag} variant="secondary" className="text-xs">
                                                                            {tag}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {instruction.version && (
                                                            <Badge variant="outline" className="flex-shrink-0">v{instruction.version}</Badge>
                                                        )}
                                                    </Link>
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            window.open(createPageUrl(`AftercareDetail?id=${instruction.id}`), '_blank');
                                                            setTimeout(() => window.print(), 500);
                                                        }}
                                                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center hover:scale-110 transition-transform"
                                                    >
                                                        <Printer className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
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
                        <div className="space-y-6">
                            {["Procedure", "Treatment", "General", "HIPAA", "Financial"].map(formType => {
                                const typeForms = filteredForms.filter(f => f.form_type === formType);
                                if (typeForms.length === 0) return null;
                                
                                return (
                                    <div key={formType} className="bg-white rounded-2xl p-6 shadow-md">
                                        <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center">
                                            <span className={`px-3 py-1 rounded-lg text-sm mr-3 ${formTypeColors[formType]}`}>
                                                {formType}
                                            </span>
                                            <span className="text-gray-400 text-sm font-normal">({typeForms.length})</span>
                                        </h3>
                                        <div className="space-y-2">
                                            {typeForms.map(form => (
                                                <div key={form.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group">
                                                    <Checkbox
                                                        checked={selectedItems.has(form.id)}
                                                        onCheckedChange={() => toggleSelection(form.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="flex-shrink-0"
                                                    />
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            toggleFormFavorite(form.id, form.is_favorite);
                                                        }}
                                                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center hover:scale-110 transition-transform"
                                                    >
                                                        <Star className={`w-4 h-4 ${form.is_favorite ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}`} />
                                                    </button>
                                                    <Link to={createPageUrl(`ConsentFormDetail?id=${form.id}`)} className="flex-1 flex items-center justify-between min-w-0">
                                                        <div className="flex-1 min-w-0 mr-4">
                                                            <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                                                                {form.form_name}
                                                            </h4>
                                                            {form.tags && JSON.parse(form.tags).length > 0 && (
                                                                <div className="flex gap-1 flex-wrap mt-1">
                                                                    {JSON.parse(form.tags).slice(0, 3).map(tag => (
                                                                        <Badge key={tag} variant="secondary" className="text-xs">
                                                                            {tag}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {form.version && (
                                                            <Badge variant="outline" className="flex-shrink-0">v{form.version}</Badge>
                                                        )}
                                                    </Link>
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            window.open(createPageUrl(`ConsentFormDetail?id=${form.id}`), '_blank');
                                                            setTimeout(() => window.print(), 500);
                                                        }}
                                                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center hover:scale-110 transition-transform"
                                                    >
                                                        <Printer className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
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
                        <div className="bg-white rounded-2xl p-6 shadow-md">
                            <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center">
                                <span className="px-3 py-1 rounded-lg text-sm mr-3 bg-orange-100 text-orange-800">
                                    Clinic Forms
                                </span>
                                <span className="text-gray-400 text-sm font-normal">({filteredClinicForms.length})</span>
                            </h3>
                            <div className="space-y-2">
                                {filteredClinicForms.map(instruction => (
                                    <div key={instruction.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group">
                                        <Checkbox
                                            checked={selectedItems.has(instruction.id)}
                                            onCheckedChange={() => toggleSelection(instruction.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex-shrink-0"
                                        />
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                toggleAftercareFavorite(instruction.id, instruction.is_favorite);
                                            }}
                                            className="flex-shrink-0 w-6 h-6 flex items-center justify-center hover:scale-110 transition-transform"
                                        >
                                            <Star className={`w-4 h-4 ${instruction.is_favorite ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}`} />
                                        </button>
                                        <Link to={createPageUrl(`AftercareDetail?id=${instruction.id}`)} className="flex-1 flex items-center justify-between min-w-0">
                                            <div className="flex-1 min-w-0 mr-4">
                                                <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                                                    {instruction.procedure_name}
                                                </h4>
                                                {instruction.tags && JSON.parse(instruction.tags).length > 0 && (
                                                    <div className="flex gap-1 flex-wrap mt-1">
                                                        {JSON.parse(instruction.tags).slice(0, 3).map(tag => (
                                                            <Badge key={tag} variant="secondary" className="text-xs">
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            {instruction.version && (
                                                <Badge variant="outline" className="flex-shrink-0">v{instruction.version}</Badge>
                                            )}
                                        </Link>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                window.open(createPageUrl(`AftercareDetail?id=${instruction.id}`), '_blank');
                                                setTimeout(() => window.print(), 500);
                                            }}
                                            className="flex-shrink-0 w-6 h-6 flex items-center justify-center hover:scale-110 transition-transform"
                                        >
                                            <Printer className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-4">
                    {filteredDocuments.length === 0 ? (
                        <Card className="text-center py-12">
                            <CardContent>
                                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">No documents found</p>
                                <p className="text-gray-400 text-sm mt-2">Upload documents to get started</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {["General", "Forms", "Policies", "Training", "Other"].map(category => {
                                const categoryDocs = filteredDocuments.filter(d => d.category === category);
                                if (categoryDocs.length === 0) return null;
                                
                                return (
                                    <div key={category} className="bg-white rounded-2xl p-6 shadow-md">
                                        <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center">
                                            <span className="px-3 py-1 rounded-lg text-sm mr-3 bg-blue-100 text-blue-800">
                                                {category}
                                            </span>
                                            <span className="text-gray-400 text-sm font-normal">({categoryDocs.length})</span>
                                        </h3>
                                        <div className="space-y-2">
                                            {categoryDocs.map(doc => (
                                                <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group">
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            toggleDocumentFavorite(doc.id, doc.is_favorite);
                                                        }}
                                                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center hover:scale-110 transition-transform"
                                                    >
                                                        <Star className={`w-4 h-4 ${doc.is_favorite ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}`} />
                                                    </button>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-gray-900 truncate">
                                                            {doc.document_name}
                                                        </h4>
                                                        {doc.description && (
                                                            <p className="text-sm text-gray-600 line-clamp-1">
                                                                {doc.description}
                                                            </p>
                                                        )}
                                                        {doc.file_urls && JSON.parse(doc.file_urls).length > 1 && (
                                                            <p className="text-xs text-purple-600 mt-1">
                                                                {JSON.parse(doc.file_urls).length} files
                                                            </p>
                                                        )}
                                                        {doc.tags && JSON.parse(doc.tags).length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                {JSON.parse(doc.tags).map((tag, idx) => (
                                                                    <span key={idx} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setEditDocument(doc);
                                                            }}
                                                            className="flex-shrink-0 w-8 h-8 flex items-center justify-center hover:scale-110 transition-transform"
                                                        >
                                                            <Pencil className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setPrintDocument(doc);
                                                            }}
                                                            className="flex-shrink-0 w-8 h-8 flex items-center justify-center hover:scale-110 transition-transform"
                                                        >
                                                            <Printer className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                                        </button>
                                                        {can("aftercare", "delete") && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    if (confirm('Delete this document?')) {
                                                                        deleteDocumentMutation.mutate(doc.id);
                                                                    }
                                                                }}
                                                                className="flex-shrink-0 w-8 h-8 flex items-center justify-center hover:scale-110 transition-transform"
                                                            >
                                                                <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600 transition-colors" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
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

            <EducationTopicForm
                open={showEducationForm}
                onOpenChange={setShowEducationForm}
                onSuccess={handleSuccess}
            />

            <DocumentUploadDialog
                open={showDocumentUpload}
                onOpenChange={setShowDocumentUpload}
                onSuccess={handleSuccess}
            />

            <DocumentPrintDialog
                open={!!printDocument}
                onOpenChange={(open) => !open && setPrintDocument(null)}
                document={printDocument}
                onEdit={(doc) => {
                    setPrintDocument(null);
                    setEditDocument(doc);
                }}
            />

            <DocumentEditDialog
                open={!!editDocument}
                onOpenChange={(open) => !open && setEditDocument(null)}
                document={editDocument}
                onSuccess={handleSuccess}
            />

            {activeTab !== "education" && activeTab !== "documents" && (
                <BulkActionsBar
                    selectedCount={selectedItems.size}
                    onDelete={() => setShowDeleteDialog(true)}
                    onTag={() => setShowTagManager(true)}
                    onClear={() => setSelectedItems(new Set())}
                />
            )}

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