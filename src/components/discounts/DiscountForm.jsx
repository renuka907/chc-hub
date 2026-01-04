import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import SearchBar from "../SearchBar";

export default function DiscountForm({ open, onOpenChange, onSuccess, editDiscount = null }) {
    const [formData, setFormData] = React.useState({
        name: "",
        description: "",
        discount_type: "percentage",
        discount_value: 0,
        applicable_to: "all_items",
        applicable_item_ids: JSON.stringify([]),
        applicable_categories: JSON.stringify([]),
        valid_from: "",
        valid_to: "",
        max_uses: null,
        current_uses: 0,
        total_discount_amount: 0,
        status: "active",
        code: ""
    });
    const [selectedItemIds, setSelectedItemIds] = React.useState([]);
    const [selectedCategories, setSelectedCategories] = React.useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [newCategory, setNewCategory] = React.useState('');
    const [existingCategories, setExistingCategories] = React.useState([]);
    const [itemSearchQuery, setItemSearchQuery] = React.useState('');

    React.useEffect(() => {
        if (editDiscount) {
            setFormData(editDiscount);
            setSelectedItemIds(editDiscount.applicable_item_ids ? JSON.parse(editDiscount.applicable_item_ids) : []);
            setSelectedCategories(editDiscount.applicable_categories ? JSON.parse(editDiscount.applicable_categories) : []);
        } else {
            setFormData({
                name: "",
                description: "",
                discount_type: "percentage",
                discount_value: 0,
                applicable_to: "all_items",
                applicable_item_ids: JSON.stringify([]),
                applicable_categories: JSON.stringify([]),
                valid_from: "",
                valid_to: "",
                max_uses: null,
                current_uses: 0,
                total_discount_amount: 0,
                status: "active",
                code: ""
            });
            setSelectedItemIds([]);
            setSelectedCategories([]);
        }
    }, [editDiscount, open]);

    const { data: pricingItems = [] } = useQuery({
        queryKey: ['pricingItems'],
        queryFn: () => base44.entities.PricingItem.list('-updated_date', 500),
    });

    React.useEffect(() => {
        const cats = new Set();
        pricingItems.forEach(item => {
            if (item.categories) {
                try {
                    const itemCats = JSON.parse(item.categories);
                    itemCats.forEach(cat => cats.add(cat));
                } catch (e) {}
            }
            if (item.category) {
                cats.add(item.category);
            }
        });
        setExistingCategories(Array.from(cats).sort());
    }, [pricingItems]);

    const toggleItem = (itemId) => {
        setSelectedItemIds(prev => {
            if (prev.includes(itemId)) {
                return prev.filter(id => id !== itemId);
            } else {
                return [...prev, itemId];
            }
        });
    };

    const toggleCategory = (category) => {
        setSelectedCategories(prev => {
            if (prev.includes(category)) {
                return prev.filter(c => c !== category);
            } else {
                return [...prev, category];
            }
        });
    };

    const addNewCategory = () => {
        if (newCategory.trim() && !selectedCategories.includes(newCategory.trim())) {
            setSelectedCategories([...selectedCategories, newCategory.trim()]);
            setNewCategory('');
        }
    };

    const removeCategory = (category) => {
        setSelectedCategories(prev => prev.filter(c => c !== category));
    };

    const handleSave = async () => {
        setIsSaving(true);
        
        const dataToSave = {
            ...formData,
            applicable_item_ids: JSON.stringify(selectedItemIds),
            applicable_categories: JSON.stringify(selectedCategories)
        };

        if (editDiscount) {
            await base44.entities.Discount.update(editDiscount.id, dataToSave);
        } else {
            await base44.entities.Discount.create(dataToSave);
        }

        setIsSaving(false);
        onSuccess();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editDiscount ? 'Edit' : 'Create'} Discount</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Discount Name *</Label>
                            <Input
                                placeholder="e.g., Summer Sale 20% Off"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Discount Code (Optional)</Label>
                            <Input
                                placeholder="e.g., SUMMER20"
                                value={formData.code}
                                onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            placeholder="Describe this discount promotion"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Discount Type *</Label>
                            <Select
                                value={formData.discount_type}
                                onValueChange={(value) => setFormData({...formData, discount_type: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">Percentage Off</SelectItem>
                                    <SelectItem value="fixed_amount">Fixed Amount Off</SelectItem>
                                    <SelectItem value="bogo">Buy One Get One</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>
                                {formData.discount_type === "percentage" ? "Percentage (%)" : 
                                 formData.discount_type === "fixed_amount" ? "Amount ($)" : 
                                 "BOGO Quantity"} *
                            </Label>
                            <Input
                                type="number"
                                placeholder={formData.discount_type === "percentage" ? "e.g., 20" : 
                                           formData.discount_type === "fixed_amount" ? "e.g., 50" : "1"}
                                value={formData.discount_value}
                                onChange={(e) => setFormData({...formData, discount_value: parseFloat(e.target.value) || 0})}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Applies To *</Label>
                        <Select
                            value={formData.applicable_to}
                            onValueChange={(value) => setFormData({...formData, applicable_to: value})}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all_items">All Items</SelectItem>
                                <SelectItem value="specific_items">Specific Items</SelectItem>
                                <SelectItem value="specific_categories">Specific Categories</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {formData.applicable_to === "specific_items" && (
                        <div className="space-y-3">
                            <Label>Select Items</Label>
                            {selectedItemIds.length > 0 && (
                                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
                                    {selectedItemIds.map(id => {
                                        const item = pricingItems.find(i => i.id === id);
                                        return item ? (
                                            <Badge key={id} className="bg-green-600 text-white">
                                                {item.name}
                                            </Badge>
                                        ) : null;
                                    })}
                                </div>
                            )}
                            <SearchBar
                                value={itemSearchQuery}
                                onChange={setItemSearchQuery}
                                placeholder="Search items..."
                            />
                            <div className="border rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto bg-white">
                                {pricingItems
                                    .filter(item => item.name.toLowerCase().includes(itemSearchQuery.toLowerCase()))
                                    .map(item => (
                                        <div key={item.id} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id={`item-${item.id}`}
                                                checked={selectedItemIds.includes(item.id)}
                                                onChange={() => toggleItem(item.id)}
                                                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                            />
                                            <label htmlFor={`item-${item.id}`} className="text-sm cursor-pointer flex-1">
                                                {item.name}
                                            </label>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {formData.applicable_to === "specific_categories" && (
                        <div className="space-y-3">
                            <Label>Select Categories</Label>
                            {selectedCategories.length > 0 && (
                                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
                                    {selectedCategories.map(cat => (
                                        <Badge key={cat} className="bg-green-600 text-white flex items-center gap-1">
                                            {cat}
                                            <button
                                                type="button"
                                                onClick={() => removeCategory(cat)}
                                                className="ml-1 hover:bg-green-700 rounded-full"
                                            >
                                                ×
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto bg-white">
                                {existingCategories.map(cat => (
                                    <div key={cat} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id={`cat-${cat}`}
                                            checked={selectedCategories.includes(cat)}
                                            onChange={() => toggleCategory(cat)}
                                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                        />
                                        <label htmlFor={`cat-${cat}`} className="text-sm cursor-pointer flex-1">
                                            {cat}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Valid From</Label>
                            <Input
                                type="date"
                                value={formData.valid_from}
                                onChange={(e) => setFormData({...formData, valid_from: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Valid To</Label>
                            <Input
                                type="date"
                                value={formData.valid_to}
                                onChange={(e) => setFormData({...formData, valid_to: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Max Uses (Leave empty for unlimited)</Label>
                            <Input
                                type="number"
                                placeholder="Unlimited"
                                value={formData.max_uses || ''}
                                onChange={(e) => setFormData({...formData, max_uses: e.target.value ? parseInt(e.target.value) : null})}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Status *</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData({...formData, status: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="expired">Expired</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSave} 
                            disabled={isSaving || !formData.name || !formData.discount_value}
                            className="bg-purple-600 hover:bg-purple-700 min-w-[100px]"
                        >
                            {isSaving ? 'Saving...' : 'Save Discount'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}