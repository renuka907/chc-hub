import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import SearchBar from "../SearchBar";
import { Plus, Trash2, Calculator } from "lucide-react";

export default function EditQuoteDialog({ open, onOpenChange, quote, onSuccess }) {
    const [selectedItems, setSelectedItems] = React.useState([]);
    const [patientName, setPatientName] = React.useState("");
    const [notes, setNotes] = React.useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedLocationId, setSelectedLocationId] = React.useState("");
    const [selectedDiscountId, setSelectedDiscountId] = React.useState("");
    const queryClient = useQueryClient();

    React.useEffect(() => {
        if (quote && open) {
            const items = JSON.parse(quote.items);
            setSelectedItems(items);
            setPatientName(quote.patient_name || "");
            setNotes(quote.notes || "");
            setSelectedLocationId(quote.clinic_location_id || "");
            setSelectedDiscountId(quote.discount_id || "");
        }
    }, [quote, open]);

    const { data: allPricingItems = [] } = useQuery({
        queryKey: ['pricingItems'],
        queryFn: () => base44.entities.PricingItem.filter({ status: 'active' }),
    });

    const { data: locations = [] } = useQuery({
        queryKey: ['clinicLocations'],
        queryFn: () => base44.entities.ClinicLocation.list(),
    });

    const { data: discounts = [] } = useQuery({
        queryKey: ['discounts'],
        queryFn: () => base44.entities.Discount.filter({ status: 'active' }),
    });

    const updateQuoteMutation = useMutation({
        mutationFn: (quoteData) => base44.entities.Quote.update(quote.id, quoteData),
        onSuccess: () => {
            queryClient.invalidateQueries(['quotes']);
            onSuccess();
            onOpenChange(false);
        },
    });

    const selectedLocation = locations.find(loc => loc.id === selectedLocationId);

    const normalizeText = (text) => text.toLowerCase().replace(/['.\s]/g, '');

    const filteredItems = allPricingItems.filter(item => {
        const normalizedQuery = normalizeText(searchQuery);
        return normalizeText(item.name).includes(normalizedQuery) ||
               normalizeText(item.description || '').includes(normalizedQuery);
    });

    const addItem = (item, tier) => {
        setSelectedItems([...selectedItems, { 
            id: item.id,
            name: item.name,
            item_type: item.item_type,
            category: item.category,
            taxable: item.taxable,
            tier_name: tier.tier_name,
            price: tier.price,
            sessions: tier.sessions,
            unit_type: tier.unit_type,
            quantity: 1 
        }]);
    };

    const removeItem = (index) => {
        setSelectedItems(selectedItems.filter((_, i) => i !== index));
    };

    const updateQuantity = (index, quantity) => {
        const updated = [...selectedItems];
        updated[index].quantity = Math.max(1, parseInt(quantity) || 1);
        setSelectedItems(updated);
    };

    const updatePrice = (index, price) => {
        const updated = [...selectedItems];
        updated[index].price = Math.max(0, parseFloat(price) || 0);
        setSelectedItems(updated);
    };

    const toggleTaxable = (index) => {
        const updated = [...selectedItems];
        updated[index].taxable = !updated[index].taxable;
        setSelectedItems(updated);
    };

    const calculateSubtotal = () => {
        return selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const calculateDiscountAmount = () => {
        if (!selectedDiscountId) return 0;
        const discount = discounts.find(d => d.id === selectedDiscountId);
        if (!discount) return 0;

        const subtotal = calculateSubtotal();
        if (discount.discount_type === 'percentage') {
            return subtotal * (discount.discount_value / 100);
        } else if (discount.discount_type === 'fixed_amount') {
            return Math.min(discount.discount_value, subtotal);
        }
        return 0;
    };

    const calculateTax = () => {
        const subtotal = calculateSubtotal();
        const discountAmount = calculateDiscountAmount();
        const subtotalAfterDiscount = subtotal - discountAmount;
        
        const taxableAmount = selectedItems
            .filter(item => item.taxable)
            .reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        const taxableRatio = subtotal > 0 ? taxableAmount / subtotal : 0;
        const taxableAfterDiscount = subtotalAfterDiscount * taxableRatio;
        
        return taxableAfterDiscount * (selectedLocation?.tax_rate || 0) / 100;
    };

    const calculateTotal = () => {
        return calculateSubtotal() - calculateDiscountAmount() + calculateTax();
    };

    const hasTaxableItems = () => {
        return selectedItems.some(item => item.taxable);
    };

    const handleSave = () => {
        if (hasTaxableItems() && !selectedLocationId) {
            alert("Please select a clinic location for quotes with taxable items.");
            return;
        }

        const quoteData = {
            clinic_location_id: selectedLocationId || undefined,
            patient_name: patientName || undefined,
            items: JSON.stringify(selectedItems),
            discount_id: selectedDiscountId || undefined,
            discount_amount: calculateDiscountAmount(),
            subtotal: calculateSubtotal(),
            tax_amount: calculateTax(),
            total: calculateTotal(),
            notes: notes || undefined
        };

        updateQuoteMutation.mutate(quoteData);
    };

    const categoryColors = {
        "Gynecology": "bg-pink-100 text-pink-800",
        "Hormone Therapy": "bg-purple-100 text-purple-800",
        "Mens Health": "bg-blue-100 text-blue-800",
        "Aesthetics": "bg-rose-100 text-rose-800",
        "Wellness": "bg-green-100 text-green-800",
        "Other": "bg-gray-100 text-gray-800"
    };

    const typeColors = {
        "Procedure": "bg-blue-100 text-blue-800",
        "Product": "bg-emerald-100 text-emerald-800",
        "Treatment Package": "bg-purple-100 text-purple-800"
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Quote - {quote?.quote_number}</DialogTitle>
                </DialogHeader>

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Left: Item Selection */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Add Items</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <SearchBar
                                    value={searchQuery}
                                    onChange={setSearchQuery}
                                    placeholder="Search procedures or products..."
                                />

                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {filteredItems.slice(0, 20).map(item => {
                                        const tiers = item.pricing_tiers ? JSON.parse(item.pricing_tiers) : [];
                                        return (
                                            <Card key={item.id} className="hover:bg-slate-50 transition-colors">
                                                <CardContent className="p-4">
                                                    <div className="font-semibold text-gray-900 mb-2">
                                                        {item.name}
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 mb-3">
                                                        <Badge className={typeColors[item.item_type]}>
                                                            {item.item_type}
                                                        </Badge>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {tiers.map((tier, idx) => (
                                                            <div key={idx} className="flex items-center justify-between bg-white border rounded-lg p-2">
                                                                <div className="flex-1">
                                                                    <div className="text-sm font-medium text-gray-700">
                                                                        {tier.tier_name}
                                                                    </div>
                                                                    <div className="text-lg font-bold text-blue-600">
                                                                        ${tier.price.toLocaleString()}
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => addItem(item, tier)}
                                                                    className="bg-blue-600 hover:bg-blue-700"
                                                                >
                                                                    <Plus className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                    {filteredItems.length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            No items found
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Quote Builder */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Calculator className="w-5 h-5 mr-2" />
                                    Quote Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label>
                                        Clinic Location {hasTaxableItems() && <span className="text-red-500">*</span>}
                                    </Label>
                                    <select
                                        value={selectedLocationId}
                                        onChange={(e) => setSelectedLocationId(e.target.value)}
                                        className={`w-full h-10 px-3 rounded-lg border bg-white ${hasTaxableItems() && !selectedLocationId ? 'border-red-500' : 'border-gray-300'}`}
                                    >
                                        <option value="">No Location</option>
                                        {locations.filter(loc => loc.status === 'active').map(location => (
                                            <option key={location.id} value={location.id}>
                                                {location.name} - Tax: {location.tax_rate}%
                                            </option>
                                        ))}
                                    </select>
                                    {hasTaxableItems() && !selectedLocationId && (
                                        <p className="text-xs text-red-500 mt-1">
                                            Location required for taxable items
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label>Patient Name (Optional)</Label>
                                    <Input
                                        value={patientName}
                                        onChange={(e) => setPatientName(e.target.value)}
                                        placeholder="Enter patient name..."
                                    />
                                </div>

                                <div>
                                    <Label>Selected Items</Label>
                                    {selectedItems.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                                            No items selected
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {selectedItems.map((item, index) => (
                                               <Card key={index} className="bg-slate-50">
                                                   <CardContent className="p-3">
                                                       <div className="flex items-center justify-between mb-2">
                                                           <div className="flex-1">
                                                               <div className="font-medium">{item.name}</div>
                                                               <div className="text-xs text-gray-600">
                                                                   {item.tier_name}
                                                               </div>
                                                           </div>
                                                           <Button
                                                               variant="ghost"
                                                               size="sm"
                                                               onClick={() => removeItem(index)}
                                                           >
                                                               <Trash2 className="w-4 h-4 text-red-500" />
                                                           </Button>
                                                       </div>
                                                       <div className="grid grid-cols-3 gap-2 mb-2">
                                                           <div>
                                                               <Label className="text-xs">Price</Label>
                                                               <Input
                                                                   type="number"
                                                                   min="0"
                                                                   step="0.01"
                                                                   value={item.price}
                                                                   onChange={(e) => updatePrice(index, e.target.value)}
                                                                   className="h-8"
                                                               />
                                                           </div>
                                                           <div>
                                                               <Label className="text-xs">Qty</Label>
                                                               <Input
                                                                   type="number"
                                                                   min="1"
                                                                   value={item.quantity}
                                                                   onChange={(e) => updateQuantity(index, e.target.value)}
                                                                   className="h-8"
                                                               />
                                                           </div>
                                                           <div>
                                                               <Label className="text-xs">Total</Label>
                                                               <div className="h-8 flex items-center font-semibold text-sm">
                                                                   ${(item.price * item.quantity).toFixed(2)}
                                                               </div>
                                                           </div>
                                                       </div>
                                                       <div className="flex items-center gap-2">
                                                           <input
                                                               type="checkbox"
                                                               id={`tax-${index}`}
                                                               checked={item.taxable}
                                                               onChange={() => toggleTaxable(index)}
                                                               className="w-4 h-4 rounded"
                                                           />
                                                           <Label htmlFor={`tax-${index}`} className="text-xs cursor-pointer">
                                                               Taxable
                                                           </Label>
                                                       </div>
                                                   </CardContent>
                                               </Card>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <Label>Apply Discount (Optional)</Label>
                                    <select
                                        value={selectedDiscountId}
                                        onChange={(e) => setSelectedDiscountId(e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white"
                                    >
                                        <option value="">No Discount</option>
                                        {discounts.map(discount => (
                                            <option key={discount.id} value={discount.id}>
                                                {discount.name} - {discount.discount_type === 'percentage' ? `${discount.discount_value}%` : `$${discount.discount_value}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Totals */}
                                {selectedItems.length > 0 && (
                                    <div className="border-t pt-4 space-y-2">
                                        <div className="flex justify-between text-base">
                                            <span>Subtotal:</span>
                                            <span className="font-semibold">${calculateSubtotal().toFixed(2)}</span>
                                        </div>
                                        {selectedDiscountId && calculateDiscountAmount() > 0 && (
                                            <div className="flex justify-between text-base text-green-600">
                                                <span>Discount:</span>
                                                <span className="font-semibold">-${calculateDiscountAmount().toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-base">
                                            <span>Tax ({selectedLocation?.tax_rate || 0}%):</span>
                                            <span className="font-semibold">${calculateTax().toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-xl font-bold text-blue-900 pt-2 border-t">
                                            <span>Total:</span>
                                            <span>${calculateTotal().toFixed(2)}</span>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <Label>Notes (Optional)</Label>
                                    <Textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Add any additional notes..."
                                        rows={3}
                                    />
                                </div>

                                <div className="flex gap-3 pt-4 border-t">
                                    <Button
                                        variant="outline"
                                        onClick={() => onOpenChange(false)}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        disabled={selectedItems.length === 0 || updateQuoteMutation.isPending || (hasTaxableItems() && !selectedLocationId)}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    >
                                        {updateQuoteMutation.isPending ? "Saving..." : "Save Changes"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}