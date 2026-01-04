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

export default function InventoryForm({ open, onOpenChange, onSuccess, editItem = null }) {
    const [formData, setFormData] = React.useState({
        item_name: "",
        item_type: "Supply",
        sku: "",
        quantity: 0,
        unit: "units",
        low_stock_threshold: 10,
        reorder_quantity: "",
        cost_per_unit: "",
        location_id: "",
        storage_location: "",
        associated_pricing_item_ids: "[]",
        supplier: "",
        notes: "",
        expiry_date: "",
        status: "active"
    });
    const [selectedPricingIds, setSelectedPricingIds] = React.useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [pricingSearchQuery, setPricingSearchQuery] = useState("");

    React.useEffect(() => {
        if (editItem) {
            setFormData(editItem);
            const pricingIds = editItem.associated_pricing_item_ids ? JSON.parse(editItem.associated_pricing_item_ids) : [];
            setSelectedPricingIds(pricingIds);
        } else {
            setFormData({
                item_name: "",
                item_type: "Supply",
                sku: "",
                quantity: 0,
                unit: "units",
                low_stock_threshold: 10,
                reorder_quantity: "",
                cost_per_unit: "",
                location_id: "",
                storage_location: "",
                associated_pricing_item_ids: "[]",
                supplier: "",
                notes: "",
                expiry_date: "",
                status: "active"
            });
            setSelectedPricingIds([]);
        }
    }, [editItem, open]);

    const { data: locations = [] } = useQuery({
        queryKey: ['clinicLocations'],
        queryFn: () => base44.entities.ClinicLocation.list(),
    });

    const { data: pricingItems = [] } = useQuery({
        queryKey: ['pricingItems'],
        queryFn: () => base44.entities.PricingItem.list(),
    });

    const { data: allInventoryItems = [] } = useQuery({
        queryKey: ['allInventoryItems'],
        queryFn: () => base44.entities.InventoryItem.list('-updated_date', 500),
    });

    // Get unique storage locations from existing inventory
    const storageLocations = React.useMemo(() => {
        const locations = new Set();
        allInventoryItems.forEach(item => {
            if (item.storage_location) {
                locations.add(item.storage_location);
            }
        });
        return Array.from(locations).sort();
    }, [allInventoryItems]);

    const togglePricingItem = (itemId) => {
        setSelectedPricingIds(prev => {
            if (prev.includes(itemId)) {
                return prev.filter(id => id !== itemId);
            } else {
                return [...prev, itemId];
            }
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        
        const dataToSave = {
            ...formData,
            quantity: parseFloat(formData.quantity) || 0,
            low_stock_threshold: parseFloat(formData.low_stock_threshold) || 0,
            reorder_quantity: formData.reorder_quantity ? parseFloat(formData.reorder_quantity) : undefined,
            cost_per_unit: formData.cost_per_unit ? parseFloat(formData.cost_per_unit) : undefined,
            associated_pricing_item_ids: JSON.stringify(selectedPricingIds),
            location_id: formData.location_id || undefined,
            expiry_date: formData.expiry_date || undefined
        };

        if (editItem) {
            await base44.entities.InventoryItem.update(editItem.id, dataToSave);
        } else {
            await base44.entities.InventoryItem.create(dataToSave);
        }

        setIsSaving(false);
        onSuccess();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editItem ? 'Edit' : 'Add'} Inventory Item</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Item Name *</Label>
                            <Input
                                placeholder="e.g., Medical Gloves"
                                value={formData.item_name}
                                onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Item Type *</Label>
                            <Select
                                value={formData.item_type}
                                onValueChange={(value) => setFormData({...formData, item_type: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Product">Product</SelectItem>
                                    <SelectItem value="Supply">Supply</SelectItem>
                                    <SelectItem value="Equipment">Equipment</SelectItem>
                                    <SelectItem value="Medication">Medication</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>SKU / Item Code</Label>
                            <Input
                                placeholder="e.g., GLV-001"
                                value={formData.sku}
                                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Unit of Measurement</Label>
                            <Input
                                placeholder="e.g., units, boxes, bottles, ml"
                                value={formData.unit}
                                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Current Quantity *</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={formData.quantity}
                                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Low Stock Alert *</Label>
                            <Input
                                type="number"
                                placeholder="10"
                                value={formData.low_stock_threshold}
                                onChange={(e) => setFormData({...formData, low_stock_threshold: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Reorder Quantity</Label>
                            <Input
                                type="number"
                                placeholder="50"
                                value={formData.reorder_quantity}
                                onChange={(e) => setFormData({...formData, reorder_quantity: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Cost Per Unit</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.cost_per_unit}
                                onChange={(e) => setFormData({...formData, cost_per_unit: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Location</Label>
                            <Select
                                value={formData.location_id}
                                onValueChange={(value) => setFormData({...formData, location_id: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select location" />
                                </SelectTrigger>
                                <SelectContent>
                                    {locations.filter(loc => loc.status === 'active').map(location => (
                                        <SelectItem key={location.id} value={location.id}>
                                            {location.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Storage Location</Label>
                        <div className="flex gap-2">
                            <Select
                                value={formData.storage_location}
                                onValueChange={(value) => setFormData({...formData, storage_location: value})}
                            >
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Select or enter location" />
                                </SelectTrigger>
                                <SelectContent>
                                    {storageLocations.map(location => (
                                        <SelectItem key={location} value={location}>
                                            {location}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                placeholder="Or type new location"
                                value={formData.storage_location}
                                onChange={(e) => setFormData({...formData, storage_location: e.target.value})}
                                className="flex-1"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Supplier</Label>
                            <Input
                                placeholder="Supplier name"
                                value={formData.supplier}
                                onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Expiration Date</Label>
                            <Input
                                type="date"
                                value={formData.expiry_date}
                                onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Associated Services/Products</Label>
                        <Input
                            placeholder="Search services..."
                            value={pricingSearchQuery}
                            onChange={(e) => setPricingSearchQuery(e.target.value)}
                            className="mb-2"
                        />
                        <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto bg-white">
                            {pricingItems.filter(item => 
                                item.status === 'active' && 
                                (!pricingSearchQuery || item.name.toLowerCase().includes(pricingSearchQuery.toLowerCase()))
                            ).map(item => (
                                <div key={item.id} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id={`pricing-${item.id}`}
                                        checked={selectedPricingIds.includes(item.id)}
                                        onChange={() => togglePricingItem(item.id)}
                                        className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                                    />
                                    <label
                                        htmlFor={`pricing-${item.id}`}
                                        className="text-sm cursor-pointer flex-1"
                                    >
                                        {item.name}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                            placeholder="Additional notes or instructions"
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            rows={3}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSave} 
                            disabled={isSaving || !formData.item_name}
                            className="bg-orange-600 hover:bg-orange-700 min-w-[100px]"
                        >
                            {isSaving ? 'Saving...' : 'Save Item'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}