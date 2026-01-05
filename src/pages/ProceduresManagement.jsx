import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Star, Clock, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import ProcedureForm from "../components/procedures/ProcedureForm";
import { usePermissions } from "../components/permissions/usePermissions";

export default function ProceduresManagement() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [showFavorites, setShowFavorites] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingProcedure, setEditingProcedure] = useState(null);
    const queryClient = useQueryClient();
    const { can, isLoading: permissionsLoading } = usePermissions();

    const { data: procedures = [], isLoading } = useQuery({
        queryKey: ['procedures'],
        queryFn: () => base44.entities.Procedure.list('-created_date', 200),
    });

    const toggleFavoriteMutation = useMutation({
        mutationFn: async ({ id, is_favorite }) => {
            await base44.entities.Procedure.update(id, { is_favorite: !is_favorite });
        },
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
        const matchesFavorite = !showFavorites || procedure.is_favorite;
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

    if (permissionsLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!can('procedure', 'read')) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">You don't have permission to view procedures.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Procedures</h1>
                    <p className="text-gray-600">Manage procedure instructions, prep, and supplies</p>
                </div>
                {can('procedure', 'create') && (
                    <Button
                        onClick={() => {
                            setEditingProcedure(null);
                            setShowForm(true);
                        }}
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Procedure
                    </Button>
                )}
            </div>

            {/* Search and Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input
                                placeholder="Search procedures..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {categories.map((cat) => (
                                <Button
                                    key={cat}
                                    variant={selectedCategory === cat ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSelectedCategory(cat)}
                                    className={selectedCategory === cat ? "bg-purple-600" : ""}
                                >
                                    {cat === "all" ? "All Categories" : cat}
                                </Button>
                            ))}
                            <Button
                                variant={showFavorites ? "default" : "outline"}
                                size="sm"
                                onClick={() => setShowFavorites(!showFavorites)}
                                className={showFavorites ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                            >
                                <Star className="w-4 h-4 mr-1" />
                                Favorites
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Procedures Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
            ) : filteredProcedures.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-gray-500">No procedures found</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProcedures.map((procedure) => (
                        <Card 
                            key={procedure.id} 
                            className="hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => handleEdit(procedure)}
                        >
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="font-semibold text-lg text-gray-900 flex-1">
                                        {procedure.procedure_name}
                                    </h3>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFavoriteMutation.mutate({
                                                id: procedure.id,
                                                is_favorite: procedure.is_favorite
                                            });
                                        }}
                                        className="shrink-0"
                                    >
                                        <Star className={`w-4 h-4 ${procedure.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                                    </Button>
                                </div>

                                {procedure.category && (
                                    <Badge className="mb-3 bg-purple-100 text-purple-700">
                                        {procedure.category}
                                    </Badge>
                                )}

                                <div className="space-y-2 text-sm text-gray-600">
                                    {procedure.estimated_time && (
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <span>{procedure.estimated_time}</span>
                                        </div>
                                    )}
                                    {procedure.required_supplies && (
                                        <div className="flex items-center gap-2">
                                            <Package className="w-4 h-4 text-gray-400" />
                                            <span className="truncate">Supplies listed</span>
                                        </div>
                                    )}
                                </div>

                                {procedure.patient_education && (
                                    <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                                        {procedure.patient_education.substring(0, 100)}...
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Form Dialog */}
            {showForm && (
                <ProcedureForm
                    procedure={editingProcedure}
                    onClose={() => {
                        setShowForm(false);
                        setEditingProcedure(null);
                    }}
                    onSuccess={handleFormSuccess}
                />
            )}
        </div>
    );
}