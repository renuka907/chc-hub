import React, { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck, Save, MapPin, Package, Printer } from "lucide-react";

export default function InventoryAuditForm({ open, onOpenChange, onSuccess }) {
    const [selectedLocationId, setSelectedLocationId] = useState("");
    const [quantities, setQuantities] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const queryClient = useQueryClient();

    const { data: locations = [] } = useQuery({
        queryKey: ['clinicLocations'],
        queryFn: () => base44.entities.ClinicLocation.list(),
    });

    const { data: allItems = [] } = useQuery({
        queryKey: ['inventoryItems'],
        queryFn: () => base44.entities.InventoryItem.list('-updated_date', 500),
    });

    // Filter active items for selected location
    const items = allItems.filter(item => 
        item.status === 'active' && 
        (selectedLocationId ? item.location_id === selectedLocationId : true)
    );

    // Group items by storage location
    const itemsByStorage = {};
    items.forEach(item => {
        const storage = item.storage_location || "No Storage Location";
        if (!itemsByStorage[storage]) {
            itemsByStorage[storage] = [];
        }
        itemsByStorage[storage].push(item);
    });

    // Initialize quantities when items change
    useEffect(() => {
        const initialQty = {};
        items.forEach(item => {
            initialQty[item.id] = item.quantity;
        });
        setQuantities(initialQty);
    }, [items.length, selectedLocationId]);

    const handleQuantityChange = (itemId, value) => {
        setQuantities(prev => ({
            ...prev,
            [itemId]: parseFloat(value) || 0
        }));
    };

    const handleSaveAudit = async () => {
        setIsSaving(true);
        
        try {
            // Update all items with changed quantities
            const updates = items
                .filter(item => quantities[item.id] !== item.quantity)
                .map(item => 
                    base44.entities.InventoryItem.update(item.id, {
                        quantity: quantities[item.id]
                    })
                );

            await Promise.all(updates);
            
            queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to save audit:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const changedCount = items.filter(item => quantities[item.id] !== item.quantity).length;

    const selectedLocation = locations.find(loc => loc.id === selectedLocationId);

    const handlePrint = () => {
        window.print();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <style>
                    {`
                        .printable-audit {
                            display: none;
                        }
                        @media print {
                            body * {
                                visibility: hidden;
                            }
                            .printable-audit,
                            .printable-audit * {
                                visibility: visible !important;
                                display: block !important;
                            }
                            .printable-audit {
                                position: absolute !important;
                                left: 0 !important;
                                top: 0 !important;
                                width: 100% !important;
                            }
                            .no-print {
                                display: none !important;
                            }
                        }
                    `}
                </style>

                <div className="printable-audit">
                    <div className="p-6">
                        <div className="border-b-2 border-gray-800 pb-4 mb-6">
                            <h1 className="text-2xl font-bold">Daily Inventory Audit Form</h1>
                            <div className="text-sm text-gray-600 mt-2">
                                Date: {new Date().toLocaleDateString()} | Location: {selectedLocation?.name || 'All Locations'}
                            </div>
                        </div>

                        {Object.entries(itemsByStorage)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([storage, storageItems]) => (
                            <div key={storage} className="mb-8 break-inside-avoid">
                                <div className="bg-gray-800 text-white px-3 py-2 mb-2">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-lg">📍 {storage}</span>
                                        <span className="text-sm">{storageItems.length} items</span>
                                    </div>
                                </div>

                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100 border-b-2 border-gray-800">
                                            <th className="text-left p-2 font-bold">Item Name</th>
                                            <th className="text-left p-2 font-bold">Type</th>
                                            <th className="text-center p-2 font-bold">SKU</th>
                                            <th className="text-center p-2 font-bold">Exp Date</th>
                                            <th className="text-center p-2 font-bold">Unit</th>
                                            <th className="text-center p-2 font-bold">Current Qty</th>
                                            <th className="text-center p-2 font-bold w-24">New Count</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {storageItems.map(item => (
                                            <tr key={item.id} className="border-b">
                                                <td className="p-2 font-medium">{item.item_name}</td>
                                                <td className="p-2 text-sm">{item.item_type}</td>
                                                <td className="p-2 text-center text-sm">{item.sku || '-'}</td>
                                                <td className="p-2 text-center text-sm">
                                                    {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="p-2 text-center text-sm">{item.unit}</td>
                                                <td className="p-2 text-center font-semibold">{item.quantity}</td>
                                                <td className="p-2">
                                                    <div className="border-2 border-gray-400 h-8 bg-white"></div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}

                        <div className="mt-8 pt-4 border-t-2 border-gray-300">
                            <p className="text-sm text-gray-600">Audited by: _________________ Signature: _________________ Date: _________________</p>
                        </div>
                    </div>
                </div>
                <DialogHeader className="no-print">
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <ClipboardCheck className="w-6 h-6 text-orange-600" />
                        Daily Inventory Audit
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 no-print">
                    {/* Print Button - Prominent */}
                    <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-lg p-4 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-lg">Print Blank Audit Form</h3>
                                <p className="text-sm text-orange-100">Print a form to manually record inventory counts</p>
                            </div>
                            <Button
                                onClick={handlePrint}
                                size="lg"
                                className="bg-white text-orange-600 hover:bg-orange-50 font-semibold"
                            >
                                <Printer className="w-5 h-5 mr-2" />
                                Print Form
                            </Button>
                        </div>
                    </div>

                    {/* Location Selector */}
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                        <Label className="text-sm font-semibold mb-2 block">Select Clinic Location</Label>
                        <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="All Locations" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={null}>All Locations</SelectItem>
                                {locations.filter(loc => loc.status === 'active').map(location => (
                                    <SelectItem key={location.id} value={location.id}>
                                        {location.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedLocation && (
                            <p className="text-xs text-gray-600 mt-2">
                                Auditing: {selectedLocation.name}
                            </p>
                        )}
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="p-4">
                                <div className="text-sm text-gray-600">Total Items</div>
                                <div className="text-2xl font-bold">{items.length}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="text-sm text-gray-600">Storage Locations</div>
                                <div className="text-2xl font-bold">{Object.keys(itemsByStorage).length}</div>
                            </CardContent>
                        </Card>
                        <Card className={changedCount > 0 ? 'border-2 border-orange-500' : ''}>
                            <CardContent className="p-4">
                                <div className="text-sm text-gray-600">Changes Made</div>
                                <div className="text-2xl font-bold text-orange-600">{changedCount}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Items Grouped by Storage Location */}
                    <div className="space-y-6">
                        {Object.entries(itemsByStorage)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([storage, storageItems]) => (
                            <div key={storage} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                                {/* Storage Location Header */}
                                <div className="bg-gradient-to-r from-orange-500 to-orange-400 text-white px-4 py-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-5 h-5" />
                                            <span className="font-bold text-lg">{storage}</span>
                                        </div>
                                        <Badge className="bg-white text-orange-600">
                                            {storageItems.length} items
                                        </Badge>
                                    </div>
                                </div>

                                {/* Items List */}
                                <div className="bg-white divide-y">
                                    {storageItems.map(item => {
                                        const currentQty = quantities[item.id] || 0;
                                        const originalQty = item.quantity;
                                        const hasChanged = currentQty !== originalQty;
                                        
                                        return (
                                            <div 
                                                key={item.id} 
                                                className={`p-4 hover:bg-gray-50 transition-colors ${
                                                    hasChanged ? 'bg-orange-50 border-l-4 border-orange-500' : ''
                                                }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-gray-900">{item.item_name}</div>
                                                        <div className="flex gap-2 mt-1">
                                                            <Badge variant="outline" className="text-xs">
                                                                {item.item_type}
                                                            </Badge>
                                                            {item.sku && (
                                                                <span className="text-xs text-gray-500">SKU: {item.sku}</span>
                                                            )}
                                                            {item.expiry_date && (
                                                                <span className="text-xs text-gray-500">
                                                                    Exp: {new Date(item.expiry_date).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-6 flex-1 justify-end">
                                                        <div className="text-center bg-gray-50 rounded-lg px-4 py-2">
                                                            <div className="text-xs text-gray-500 mb-1">Current Stock</div>
                                                            <div className="text-2xl font-bold text-gray-900">
                                                                {originalQty}
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-1">{item.unit}</div>
                                                        </div>
                                                        
                                                        <div className="w-48">
                                                            <Label className="text-sm font-semibold mb-2 block">New Count</Label>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="1"
                                                                value={currentQty}
                                                                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                                className={`h-14 text-2xl font-bold text-center ${
                                                                    hasChanged ? 'border-orange-500 border-3 bg-orange-50' : ''
                                                                }`}
                                                            />
                                                        </div>

                                                        {hasChanged && (
                                                            <div className="text-center bg-green-50 rounded-lg px-4 py-2 min-w-[80px]">
                                                                <div className="text-xs text-gray-500 mb-1">Difference</div>
                                                                <div className={`text-2xl font-bold ${
                                                                    currentQty > originalQty ? 'text-green-600' : 'text-red-600'
                                                                }`}>
                                                                    {currentQty > originalQty ? '+' : ''}
                                                                    {currentQty - originalQty}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {items.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p>No items found for this location</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center gap-4 pt-4 border-t sticky bottom-0 bg-white pb-4">
                        <div className="text-sm text-gray-600">
                            {changedCount > 0 ? (
                                <span className="text-orange-600 font-semibold">
                                    {changedCount} item{changedCount !== 1 ? 's' : ''} updated
                                </span>
                            ) : (
                                <span>No changes made</span>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <Button 
                                variant="outline" 
                                onClick={() => onOpenChange(false)} 
                                disabled={isSaving}
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleSaveAudit} 
                                disabled={isSaving || changedCount === 0}
                                className="bg-orange-600 hover:bg-orange-700 min-w-[120px]"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? 'Saving...' : 'Save Audit'}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}