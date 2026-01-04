import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SearchBar from "../components/SearchBar";
import PricingForm from "../components/pricing/PricingForm";
import CategoryManagement from "../components/pricing/CategoryManagement";
import PrintableDocument from "../components/PrintableDocument";
import { DollarSign, Plus, Pencil, Star, Tag, Trash2, Printer } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function PricingManagement() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [showCategoryManagement, setShowCategoryManagement] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const queryClient = useQueryClient();

    React.useEffect(() => {
        base44.auth.me().then(user => setCurrentUser(user)).catch(() => {});
    }, []);

    const { data: pricingItems = [], isLoading } = useQuery({
        queryKey: ['pricingItems'],
        queryFn: () => base44.entities.PricingItem.filter({}),
    });

    const { data: locations = [] } = useQuery({
        queryKey: ['clinicLocations'],
        queryFn: () => base44.entities.ClinicLocation.list(),
    });

    // Get unique categories from existing pricing items
    const availableCategories = React.useMemo(() => {
        const cats = new Set();
        pricingItems.forEach(item => {
            // Handle new categories array format
            if (item.categories) {
                try {
                    const itemCats = JSON.parse(item.categories);
                    itemCats.forEach(cat => cats.add(cat));
                } catch (e) {}
            }
            // Handle old category string format
            if (item.category) {
                cats.add(item.category);
            }
        });
        return ["all", ...Array.from(cats).sort()];
    }, [pricingItems]);

    const toggleFavoriteMutation = useMutation({
        mutationFn: ({ id, currentValue }) => 
            base44.entities.PricingItem.update(id, { is_favorite: !currentValue }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pricingItems'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.PricingItem.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pricingItems'] });
            setDeleteConfirm(null);
        },
    });

    const handleSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['pricingItems'] });
        setEditingItem(null);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setShowForm(true);
    };



    const filteredItems = pricingItems.filter(item => {
        const normalizeText = (text) => text.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normalizedQuery = normalizeText(searchQuery);
        const matchesSearch = normalizedQuery === '' || 
                            normalizeText(item.name).includes(normalizedQuery) ||
                            normalizeText(item.description || '').includes(normalizedQuery);
        
        // Handle both old and new category formats
        let itemCategories = [];
        if (item.categories) {
            try {
                itemCategories = JSON.parse(item.categories);
            } catch (e) {}
        } else if (item.category) {
            itemCategories = [item.category];
        }
        // Items without categories should show in "all" view
        const matchesCategory = selectedCategory === "all" || itemCategories.length === 0 || itemCategories.includes(selectedCategory);
        
        const matchesFavorite = !showFavoritesOnly || item.is_favorite;
        const isActive = !item.status || item.status === 'active';
        
        return matchesSearch && matchesCategory && matchesFavorite && isActive;
    });

    const categoryColors = {
        "Gynecology": "bg-pink-100 text-pink-800",
        "Hormone Therapy": "bg-purple-100 text-purple-800",
        "Mens Health": "bg-blue-100 text-blue-800",
        "Aesthetics": "bg-rose-100 text-rose-800",
        "Body Sculpting": "bg-indigo-100 text-indigo-800",
        "Wellness": "bg-green-100 text-green-800",
        "Other": "bg-gray-100 text-gray-800"
    };

    const typeColors = {
        "Procedure": "bg-blue-100 text-blue-800",
        "Product": "bg-green-100 text-green-800",
        "Treatment Package": "bg-purple-100 text-purple-800"
    };

    const getLocationName = (locationId) => {
        const location = locations.find(loc => loc.id === locationId);
        return location?.name || "Unknown Location";
    };

    const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'manager';

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            {/* Print Styles */}
            <style>
                {`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        .printable-price-list,
                        .printable-price-list * {
                            visibility: visible;
                        }
                        .printable-price-list {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                        }
                        .no-print {
                            display: none !important;
                        }
                    }
                `}
            </style>

            {/* Printable Price List */}
            <div className="printable-price-list hidden print:block">
                <PrintableDocument title={selectedCategory === "all" ? "Complete Price List" : `${selectedCategory} - Price List`}>
                    <div className="space-y-6">
                        {filteredItems.map(item => {
                            const tiers = item.pricing_tiers ? JSON.parse(item.pricing_tiers) : [];
                            let cats = [];
                            if (item.categories) {
                                try {
                                    cats = JSON.parse(item.categories);
                                } catch (e) {}
                            } else if (item.category) {
                                cats = [item.category];
                            }
                            
                            return (
                                <div key={item.id} className="border-b pb-4">
                                    <div className="mb-2">
                                        <h3 className="text-lg font-bold">{item.name}</h3>
                                        <div className="flex gap-2 mt-1">
                                            {cats.map(cat => (
                                                <span key={cat} className="text-xs bg-gray-200 px-2 py-1 rounded">{cat}</span>
                                            ))}
                                            <span className="text-xs bg-gray-200 px-2 py-1 rounded">{item.item_type}</span>
                                        </div>
                                    </div>
                                    {item.description && (
                                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                                    )}
                                    <div className="space-y-1">
                                        {tiers.map((tier, idx) => (
                                            <div key={idx} className="flex justify-between text-sm">
                                                <span>
                                                    {tier.tier_name}
                                                    {tier.sessions > 1 && ` (${tier.sessions} ${tier.unit_type || 'sessions'})`}
                                                </span>
                                                <span className="font-semibold">${tier.price.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </PrintableDocument>
            </div>

            {/* Header */}
            <div className="bg-white rounded-3xl p-6 shadow-md no-print">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Pricing Management</h1>
                            <p className="text-gray-600">Manage pricing for procedures, products, and treatment packages</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <span className="text-sm text-gray-500 self-center mr-2">
                            {pricingItems.length} items loaded, {filteredItems.length} displayed
                        </span>
                        <Button 
                            variant="outline"
                            onClick={() => window.print()}
                            className="no-print"
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            Print Price List
                        </Button>
                        {canEdit && (
                            <>
                                <Button 
                                    variant="outline"
                                    onClick={() => setShowCategoryManagement(true)}
                                >
                                    <Tag className="w-4 h-4 mr-2" />
                                    Manage Categories
                                </Button>
                                <Button onClick={() => { setEditingItem(null); setShowForm(true); }} className="bg-green-600 hover:bg-green-700">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Pricing
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-3xl p-6 shadow-md no-print">
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search pricing items..."
                />
            </div>

            {/* Filters */}
            <div className="bg-white rounded-3xl p-6 shadow-md no-print">
                <div className="flex flex-wrap gap-3 items-center">
                    <button
                        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        className={`px-6 py-2.5 rounded-2xl text-sm font-medium transition-all flex items-center gap-2 ${
                            showFavoritesOnly 
                                ? "bg-yellow-500 text-white shadow-md" 
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                        <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-white' : ''}`} />
                        Favorites
                    </button>
                    <div className="w-px h-6 bg-gray-300" />
                    {availableCategories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-6 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                                selectedCategory === category 
                                    ? "bg-green-600 text-white shadow-md" 
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                            {category === "all" ? "All Categories" : category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Pricing Items */}
            <div className="no-print">
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                </div>
            ) : filteredItems.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No pricing items found</p>
                        <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 gap-6">
                    {filteredItems.map(item => {
                        const tiers = item.pricing_tiers ? JSON.parse(item.pricing_tiers) : [];
                        return (
                            <Card key={item.id} className="hover:shadow-lg transition-all duration-300 border-2 relative">
                                <button
                                    onClick={() => toggleFavoriteMutation.mutate({ id: item.id, currentValue: item.is_favorite })}
                                    className="absolute top-4 right-4 z-10 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform"
                                >
                                    <Star className={`w-4 h-4 ${item.is_favorite ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}`} />
                                </button>
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex flex-wrap gap-2">
                                            {(() => {
                                                // Handle both old and new category formats
                                                let cats = [];
                                                if (item.categories) {
                                                    try {
                                                        cats = JSON.parse(item.categories);
                                                    } catch (e) {}
                                                } else if (item.category) {
                                                    cats = [item.category];
                                                }
                                                return cats.map(cat => (
                                                    <Badge key={cat} className={categoryColors[cat] || "bg-gray-100 text-gray-800"}>
                                                        {cat}
                                                    </Badge>
                                                ));
                                            })()}
                                            <Badge className={typeColors[item.item_type]}>
                                                {item.item_type}
                                            </Badge>
                                            {item.area_based && (
                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                                    <Tag className="w-3 h-3 mr-1" />
                                                    Area-based
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <CardTitle className="text-xl mb-2">{item.name}</CardTitle>
                                    <div className="text-sm text-gray-600">
                                        📍 {(() => {
                                            const locationIds = item.clinic_location_ids ? JSON.parse(item.clinic_location_ids) : [];
                                            const locationNames = locationIds
                                                .map(id => locations.find(l => l.id === id)?.name)
                                                .filter(Boolean);
                                            return locationNames.length > 0 ? locationNames.join(', ') : 'No locations';
                                        })()}
                                    </div>
                                    {item.description && (
                                        <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                        {tiers.map((tier, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm">
                                                <span className="font-medium text-gray-700">
                                                    {tier.tier_name}
                                                    {tier.sessions > 1 && (
                                                        <span className="text-gray-500 ml-2">({tier.sessions} {tier.unit_type || 'sessions'})</span>
                                                    )}
                                                </span>
                                                <span className="font-bold text-green-600 text-base">
                                                    ${tier.price.toLocaleString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    {canEdit && (
                                        <div className="flex gap-2 mt-4">
                                            <Button 
                                                variant="outline" 
                                                className="flex-1"
                                                onClick={() => handleEdit(item)}
                                            >
                                                <Pencil className="w-4 h-4 mr-2" />
                                                Edit
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => setDeleteConfirm(item)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
            </div>

            <PricingForm
                open={showForm}
                onOpenChange={(open) => {
                    setShowForm(open);
                    if (!open) setEditingItem(null);
                }}
                onSuccess={handleSuccess}
                editItem={editingItem}
            />

            <CategoryManagement
                open={showCategoryManagement}
                onOpenChange={setShowCategoryManagement}
            />

            <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Pricing Item?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{deleteConfirm?.name}"? This action cannot be undone.
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