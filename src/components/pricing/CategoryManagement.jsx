import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Tag } from "lucide-react";
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

export default function CategoryManagement({ open, onOpenChange }) {
    const [newCategory, setNewCategory] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const queryClient = useQueryClient();

    // Custom pre-made categories
    const customCategories = [
        "Gynecology",
        "Hormone Therapy",
        "Mens Health",
        "Aesthetics",
        "Body Sculpting",
        "Wellness",
        "Skin Care",
        "Injectable Treatments",
        "Laser Treatments",
        "Lab Tests",
        "Supplements",
        "Medical Devices"
    ];

    const { data: pricingItems = [] } = useQuery({
        queryKey: ['pricingItems'],
        queryFn: () => base44.entities.PricingItem.list('-updated_date', 500),
    });

    // Get unique categories
    const categories = React.useMemo(() => {
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
        return Array.from(cats).sort();
    }, [pricingItems]);

    // Count items per category
    const getCategoryCount = (category) => {
        return pricingItems.filter(item => {
            // Handle both old and new category formats
            let cats = [];
            if (item.categories) {
                try {
                    cats = JSON.parse(item.categories);
                } catch (e) {}
            } else if (item.category) {
                cats = [item.category];
            }
            return cats.includes(category);
        }).length;
    };

    const handleAddCategory = async (categoryName) => {
        const catName = categoryName || newCategory.trim();
        if (!catName) return;
        
        // Check if category already exists
        if (categories.includes(catName)) {
            setNewCategory("");
            return;
        }
        
        // Create a placeholder item with the new category to add it to the system
        await base44.entities.PricingItem.create({
            name: `_category_${catName}`,
            item_type: "Product",
            categories: JSON.stringify([catName]),
            pricing_tiers: JSON.stringify([{ tier_name: "N/A", price: 0, sessions: 1 }]),
            status: "inactive",
            clinic_location_ids: "[]"
        });
        
        queryClient.invalidateQueries({ queryKey: ['pricingItems'] });
        setNewCategory("");
    };

    const handleDeleteCategory = async (category) => {
        setIsDeleting(true);
        
        // Remove this category from all items that have it
        const itemsToUpdate = pricingItems.filter(item => {
            let cats = [];
            if (item.categories) {
                try {
                    cats = JSON.parse(item.categories);
                } catch (e) {}
            } else if (item.category) {
                cats = [item.category];
            }
            return cats.includes(category);
        });
        
        for (const item of itemsToUpdate) {
            let cats = [];
            if (item.categories) {
                try {
                    cats = JSON.parse(item.categories);
                } catch (e) {}
            } else if (item.category) {
                cats = [item.category];
            }
            const updatedCats = cats.filter(c => c !== category);
            
            // If this is a placeholder category item and now has no categories, delete it
            if (item.name.startsWith('_category_') && updatedCats.length === 0) {
                await base44.entities.PricingItem.delete(item.id);
            } else {
                await base44.entities.PricingItem.update(item.id, { 
                    categories: JSON.stringify(updatedCats) 
                });
            }
        }
        
        queryClient.invalidateQueries({ queryKey: ['pricingItems'] });
        setDeleteConfirm(null);
        setIsDeleting(false);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Tag className="w-5 h-5" />
                            Manage Categories
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Add New Category */}
                        <div className="space-y-2">
                            <Label>Add New Category</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter category name"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleAddCategory();
                                        }
                                    }}
                                />
                                <Button 
                                    onClick={() => handleAddCategory()}
                                    disabled={!newCategory.trim()}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add
                                </Button>
                            </div>
                        </div>

                        {/* Quick Add Categories */}
                        <div className="space-y-2">
                            <Label>Quick Add Common Categories</Label>
                            <div className="flex flex-wrap gap-2">
                                {customCategories
                                    .filter(cat => !categories.includes(cat))
                                    .map(cat => (
                                        <Button
                                            key={cat}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleAddCategory(cat)}
                                            className="text-xs"
                                        >
                                            <Plus className="w-3 h-3 mr-1" />
                                            {cat}
                                        </Button>
                                    ))
                                }
                                {customCategories.every(cat => categories.includes(cat)) && (
                                    <p className="text-sm text-gray-500 italic">All common categories added</p>
                                )}
                            </div>
                        </div>

                        {/* Existing Categories */}
                        <div className="space-y-2">
                            <Label>Existing Categories ({categories.length})</Label>
                            <div className="border rounded-lg p-4 space-y-2 max-h-96 overflow-y-auto">
                                {categories.length === 0 ? (
                                    <p className="text-gray-500 text-sm text-center py-4">No categories yet</p>
                                ) : (
                                    categories.map(category => {
                                        const count = getCategoryCount(category);
                                        return (
                                            <div 
                                                key={category} 
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="outline" className="bg-white">
                                                        {category}
                                                    </Badge>
                                                    <span className="text-sm text-gray-600">
                                                        {count} item{count !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setDeleteConfirm(category)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Category?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove the category "{deleteConfirm}"?
                            {getCategoryCount(deleteConfirm) > 0 && (
                                <span className="block mt-2 text-orange-600 font-medium">
                                    {getCategoryCount(deleteConfirm)} item(s) will have this category removed.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleDeleteCategory(deleteConfirm)}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? 'Removing...' : 'Remove Category'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}