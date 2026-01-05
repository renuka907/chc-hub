import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Plus, Search, Star, Clock, Package, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import ProcedureForm from "../components/procedures/ProcedureForm";
import { usePermissions } from "../components/permissions/usePermissions";

export default function ProceduresManagement() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingProcedure, setEditingProcedure] = useState(null);
    const queryClient = useQueryClient();
    const { can } = usePermissions();

    const { data: procedures = [], isLoading } = useQuery({
        queryKey: ['procedures'],
        queryFn: () => base44.entities.Procedure.list(),
    });

    const toggleFavoriteMutation = useMutation({
        mutationFn: ({ id, isFavorite }) =>
            base44.entities.Procedure.update(id, { is_favorite: !isFavorite }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['procedures'] });
        },
    });

    const categories = ["all", ...new Set(procedures.map(p => p.category).filter(Boolean))];

    const filteredProcedures = procedures.filter(procedure => {
        const matchesSearch = !searchQuery || 
            procedure.procedure_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            procedure.category?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "all" || procedure.category === selectedCategory;
        const matchesFavorite = !showFavoritesOnly || procedure.is_favorite;
        return matchesSearch && matchesCategory && matchesFavorite;
    });

    const handleEdit = (procedure) => {
        setEditingProcedure(procedure);
        setShowForm(true);
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditingProcedure(null);
        queryClient.invalidateQueries({ queryKey: ['procedures'] });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Procedure Library</h1>
                    <p className="text-gray-600 mt-1">Manage step-by-step procedure guides</p>
                </div>
                {can('procedure', 'create') && (
                    <Button
                        onClick={() => {
                            setEditingProcedure(null);
                            setShowForm(true);
                        }}
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Procedure
                    </Button>
                )}
            </div>

            {/* Search and Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input
                                placeholder="Search procedures..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button
                            variant={showFavoritesOnly ? "default" : "outline"}
                            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                            className="gap-2"
                        >
                            <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                            Favorites
                        </Button>
                    </div>

                    {/* Category Filter */}
                    <div className="flex gap-2 mt-4 flex-wrap">
                        {categories.map(category => (
                            <Button
                                key={category}
                                variant={selectedCategory === category ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedCategory(category)}
                            >
                                {category === "all" ? "All Categories" : category}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Procedures Grid */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
            ) : filteredProcedures.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No procedures found</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProcedures.map((procedure) => (
                        <Card key={procedure.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg">{procedure.procedure_name}</CardTitle>
                                    <button
                                        onClick={() => toggleFavoriteMutation.mutate({
                                            id: procedure.id,
                                            isFavorite: procedure.is_favorite
                                        })}
                                        className="text-yellow-500 hover:scale-110 transition-transform"
                                    >
                                        <Star
                                            className={`w-5 h-5 ${procedure.is_favorite ? 'fill-current' : ''}`}
                                        />
                                    </button>
                                </div>
                                {procedure.category && (
                                    <Badge variant="secondary" className="mt-2 w-fit">
                                        {procedure.category}
                                    </Badge>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {procedure.estimated_time && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Clock className="w-4 h-4" />
                                        {procedure.estimated_time}
                                    </div>
                                )}
                                {procedure.required_supplies && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Package className="w-4 h-4" />
                                        Supplies listed
                                    </div>
                                )}
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        asChild
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                    >
                                        <Link to={createPageUrl("ProcedureDetail") + `?id=${procedure.id}`}>
                                            View Details
                                        </Link>
                                    </Button>
                                    {can('procedure', 'edit') && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(procedure)}
                                        >
                                            Edit
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Form Dialog */}
            <ProcedureForm
                open={showForm}
                onOpenChange={setShowForm}
                procedure={editingProcedure}
                onSuccess={handleFormSuccess}
            />
        </div>
    );
}