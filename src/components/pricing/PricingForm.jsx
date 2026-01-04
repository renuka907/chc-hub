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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";

export default function PricingForm({ open, onOpenChange, onSuccess, editItem = null }) {
    const [formData, setFormData] = React.useState({
        name: "",
        item_type: "Procedure",
        categories: JSON.stringify([]),
        clinic_location_ids: JSON.stringify([]),
        description: "",
        pricing_tiers: JSON.stringify([{ tier_name: "Single Session", price: 0, sessions: 1, unit_type: "sessions" }]),
        area_based: false,
        taxable: false,
        status: "active"
    });
    const [tiers, setTiers] = React.useState([{ tier_name: "Single Session", price: 0, sessions: 1, unit_type: "sessions" }]);
    const [selectedLocationIds, setSelectedLocationIds] = React.useState([]);
    const [selectedCategories, setSelectedCategories] = React.useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [newCategory, setNewCategory] = React.useState('');
    const [existingCategories, setExistingCategories] = React.useState([]);

    React.useEffect(() => {
        if (editItem) {
            setFormData(editItem);
            const parsedTiers = editItem.pricing_tiers ? JSON.parse(editItem.pricing_tiers) : [];
            const tiersWithUnits = parsedTiers.length > 0 
                ? parsedTiers.map(t => ({ ...t, unit_type: t.unit_type || "sessions" }))
                : [{ tier_name: "Single Session", price: 0, sessions: 1, unit_type: "sessions" }];
            setTiers(tiersWithUnits);
            setSelectedLocationIds(editItem.clinic_location_ids ? JSON.parse(editItem.clinic_location_ids) : []);
            
            // Handle both old and new category formats
            let cats = [];
            if (editItem.categories) {
                try {
                    cats = JSON.parse(editItem.categories);
                } catch (e) {}
            } else if (editItem.category) {
                cats = [editItem.category];
            }
            setSelectedCategories(cats);
            setNewCategory('');
        } else {
            setFormData({
                name: "",
                item_type: "Procedure",
                categories: JSON.stringify([]),
                clinic_location_ids: JSON.stringify([]),
                description: "",
                pricing_tiers: JSON.stringify([{ tier_name: "Single Session", price: 0, sessions: 1, unit_type: "sessions" }]),
                area_based: false,
                taxable: false,
                status: "active"
            });
            setTiers([{ tier_name: "Single Session", price: 0, sessions: 1, unit_type: "sessions" }]);
            setSelectedLocationIds([]);
            setSelectedCategories([]);
            setNewCategory('');
        }
    }, [editItem, open]);

    React.useEffect(() => {
        base44.entities.PricingItem.list('-created_date', 500).then(items => {
            const cats = new Set();
            items.forEach(item => {
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
            setExistingCategories(Array.from(cats).sort());
        });
    }, []);

    const { data: locations = [] } = useQuery({
        queryKey: ['clinicLocations'],
        queryFn: () => base44.entities.ClinicLocation.list(),
    });

    const addTier = () => {
        setTiers([...tiers, { tier_name: "", price: 0, sessions: 1, unit_type: "sessions" }]);
    };

    const removeTier = (index) => {
        setTiers(tiers.filter((_, i) => i !== index));
    };

    const updateTier = (index, field, value) => {
        const newTiers = [...tiers];
        newTiers[index][field] = field === 'price' || field === 'sessions' ? parseFloat(value) || 0 : value;
        setTiers(newTiers);
    };

    const toggleLocation = (locationId) => {
        setSelectedLocationIds(prev => {
            if (prev.includes(locationId)) {
                return prev.filter(id => id !== locationId);
            } else {
                return [...prev, locationId];
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
            categories: JSON.stringify(selectedCategories),
            pricing_tiers: JSON.stringify(tiers),
            clinic_location_ids: JSON.stringify(selectedLocationIds)
        };

        if (editItem) {
            await base44.entities.PricingItem.update(editItem.id, dataToSave);
        } else {
            await base44.entities.PricingItem.create(dataToSave);
        }

        setIsSaving(false);
        onSuccess();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editItem ? 'Edit' : 'Create'} Pricing Item</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Item Name *</Label>
                            <Input
                                placeholder="e.g., Body Sculpting Laser TXS"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Type *</Label>
                            <Select
                                value={formData.item_type}
                                onValueChange={(value) => setFormData({...formData, item_type: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Procedure">Procedure</SelectItem>
                                    <SelectItem value="Product">Product</SelectItem>
                                    <SelectItem value="Treatment Package">Treatment Package</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="col-span-2 space-y-3">
                        <Label>Categories (Select multiple)</Label>
                        
                        {/* Selected Categories */}
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

                        {/* Existing Categories Checkboxes */}
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

                        {/* Add New Category */}
                        <div className="flex gap-2">
                            <Input
                                placeholder="Add new category"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addNewCategory();
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                onClick={addNewCategory}
                                disabled={!newCategory.trim()}
                                variant="outline"
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">

                        <div className="space-y-2">
                            <Label>Clinic Locations (Optional)</Label>
                            <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto bg-white">
                                {locations.map(loc => (
                                    <div key={loc.id} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id={`location-${loc.id}`}
                                            checked={selectedLocationIds.includes(loc.id)}
                                            onChange={() => toggleLocation(loc.id)}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                        <label
                                            htmlFor={`location-${loc.id}`}
                                            className="text-sm cursor-pointer flex-1"
                                        >
                                            {loc.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            placeholder="Additional details about this item"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            rows={2}
                        />
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={formData.area_based}
                                onCheckedChange={(checked) => setFormData({...formData, area_based: checked})}
                            />
                            <Label>Area-based pricing</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={formData.taxable}
                                onCheckedChange={(checked) => setFormData({...formData, taxable: checked})}
                            />
                            <Label>Taxable</Label>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-4">
                            <Label className="text-lg font-semibold">Pricing Tiers</Label>
                            <Button type="button" onClick={addTier} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                                <Plus className="w-4 h-4 mr-1" />
                                Add Tier
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {tiers.map((tier, index) => (
                                <div key={index} className="flex gap-3 items-start bg-gray-50 p-3 rounded-lg">
                                    <div className="flex-1 space-y-2">
                                        <Input
                                            placeholder="Tier name (e.g., 1 Treatment, 5 Tx Initial Series)"
                                            value={tier.tier_name}
                                            onChange={(e) => updateTier(index, 'tier_name', e.target.value)}
                                        />
                                    </div>
                                    <div className="w-28">
                                        <Input
                                            type="number"
                                            placeholder="Quantity"
                                            value={tier.sessions}
                                            onChange={(e) => updateTier(index, 'sessions', e.target.value)}
                                        />
                                    </div>
                                    <div className="w-32">
                                        <Select
                                            value={tier.unit_type || "sessions"}
                                            onValueChange={(value) => updateTier(index, 'unit_type', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sessions">Sessions</SelectItem>
                                                <SelectItem value="shots">Shots</SelectItem>
                                                <SelectItem value="infusions">Infusions</SelectItem>
                                                <SelectItem value="syringes">Syringes</SelectItem>
                                                <SelectItem value="vials">Vials</SelectItem>
                                                <SelectItem value="treatments">Treatments</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-32">
                                        <Input
                                            type="number"
                                            placeholder="Price"
                                            value={tier.price}
                                            onChange={(e) => updateTier(index, 'price', e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeTier(index)}
                                        disabled={tiers.length === 1}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSave} 
                            disabled={isSaving || !formData.name}
                            className="bg-green-600 hover:bg-green-700 min-w-[100px]"
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}