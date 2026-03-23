import React, { useState, useEffect } from "react";
import { entities, uploadFile, invokeLLM, generateImage, sendEmail, agentChat } from "@/api/supabaseHelpers";
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
import { ClipboardCheck, Save, MapPin, Package, Printer, ScanLine, X } from "lucide-react";
import { printHTML, getCHCHeaderHTML, getCHCFooterHTML } from "../PrintHelper";
import ScannerInput from "./ScannerInput";

export default function InventoryAuditForm({ open, onOpenChange, onSuccess }) {
    const [selectedLocationId, setSelectedLocationId] = useState("");
    const [selectedSupplier, setSelectedSupplier] = useState("");
    const [selectedItemType, setSelectedItemType] = useState("");
    const [selectedCondition, setSelectedCondition] = useState("");
    const [quantities, setQuantities] = useState({});
    const [expiryDates, setExpiryDates] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [scanMode, setScanMode] = useState(false);
    const [scanLog, setScanLog] = useState([]);
    const [scanFeedback, setScanFeedback] = useState(null); // { type: 'success'|'error', message }
    const queryClient = useQueryClient();

    const { data: locations = [] } = useQuery({
        queryKey: ['clinicLocations'],
        queryFn: () => entities.ClinicLocation.list(),
    });

    const { data: allItems = [] } = useQuery({
        queryKey: ['inventoryItems'],
        queryFn: () => entities.InventoryItem.list('-updated_at', 500),
    });

    // Get unique suppliers and item types for filter dropdowns
    const suppliers = [...new Set(allItems.filter(i => i.supplier).map(i => i.supplier))].sort();
    const itemTypes = [...new Set(allItems.filter(i => i.item_type).map(i => i.item_type))].sort();

    // Filter active items by location + supplier + type + condition
    const items = allItems.filter(item => 
        item.status === 'active' && 
        (selectedLocationId ? item.location_id === selectedLocationId : true) &&
        (selectedSupplier ? item.supplier === selectedSupplier : true) &&
        (selectedItemType ? item.item_type === selectedItemType : true) &&
        (selectedCondition ? item.item_condition === selectedCondition : true)
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

    // Initialize quantities and expiry dates when items change
    useEffect(() => {
        const initialQty = {};
        const initialExpiry = {};
        items.forEach(item => {
            initialQty[item.id] = item.quantity;
            initialExpiry[item.id] = item.expiry_date || '';
        });
        setQuantities(initialQty);
        setExpiryDates(initialExpiry);
    }, [items.length, selectedLocationId]);

    const handleScanInAudit = (barcode) => {
        const match = items.find(item => 
            item.sku === barcode || 
            item.sku?.includes(barcode) ||
            item.item_name?.toLowerCase().includes(barcode.toLowerCase())
        );
        
        const logEntry = { barcode, timestamp: new Date(), found: !!match, itemName: match?.item_name };
        setScanLog(prev => [logEntry, ...prev].slice(0, 50));

        if (match) {
            setQuantities(prev => ({
                ...prev,
                [match.id]: (prev[match.id] || 0) + 1
            }));
            setScanFeedback({ type: 'success', message: `✓ ${match.item_name} → ${(quantities[match.id] || 0) + 1}` });
        } else {
            setScanFeedback({ type: 'error', message: `Item not found: ${barcode}` });
        }
        
        setTimeout(() => setScanFeedback(null), 2000);
    };

    const handleQuantityChange = (itemId, value) => {
        setQuantities(prev => ({
            ...prev,
            [itemId]: parseFloat(value) || 0
        }));
    };

    const handleExpiryDateChange = (itemId, value) => {
        setExpiryDates(prev => ({
            ...prev,
            [itemId]: value
        }));
    };

    const handleSaveAudit = async () => {
        setIsSaving(true);
        
        try {
            // Update all items with changed quantities or expiry dates
            const updates = items
                .filter(item => 
                    quantities[item.id] !== item.quantity || 
                    expiryDates[item.id] !== (item.expiry_date || '')
                )
                .map(item => {
                    const updateData = {};
                    if (quantities[item.id] !== item.quantity) {
                        updateData.quantity = quantities[item.id];
                    }
                    if (expiryDates[item.id] !== (item.expiry_date || '')) {
                        updateData.expiry_date = expiryDates[item.id] || undefined;
                    }
                    return entities.InventoryItem.update(item.id, updateData);
                });

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

    const changedCount = items.filter(item => 
        quantities[item.id] !== item.quantity || 
        expiryDates[item.id] !== (item.expiry_date || '')
    ).length;

    const selectedLocation = locations.find(loc => loc.id === selectedLocationId);

    const handlePrint = () => {
        const sortedGroups = Object.entries(itemsByStorage)
            .sort(([a], [b]) => a.localeCompare(b))
            .filter(([, storageItems]) => storageItems.length > 0);

        let tablesHTML = '';
        sortedGroups.forEach(([storage, storageItems]) => {
            const itemsByName = {};
            storageItems.forEach(item => {
                if (!itemsByName[item.item_name]) itemsByName[item.item_name] = [];
                itemsByName[item.item_name].push(item);
            });

            const rows = Object.entries(itemsByName)
                .sort(([a], [b]) => a.localeCompare(b))
                .flatMap(([, items]) => items.map(item => `
                    <tr>
                        <td style="border:1px solid #999;padding:4px 8px;font-size:12px;">${item.item_name}</td>
                        <td style="border:1px solid #999;padding:4px 8px;text-align:center;font-size:11px;">${item.item_condition === 'opened' ? 'Open' : 'New'}</td>
                        <td style="border:1px solid #999;padding:4px 8px;text-align:center;font-weight:bold;font-size:13px;">${item.quantity}</td>
                        <td style="border:1px solid #999;padding:4px 8px;background:white;"></td>
                        <td style="border:1px solid #999;padding:4px 8px;text-align:center;font-size:11px;">${item.item_type || ''}</td>
                        <td style="border:1px solid #999;padding:4px 8px;text-align:center;font-size:11px;">${item.sku || '-'}</td>
                        <td style="border:1px solid #999;padding:4px 8px;text-align:center;font-size:11px;">${item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('en-US', {month:'2-digit',day:'2-digit',year:'2-digit'}) : '-'}</td>
                        <td style="border:1px solid #999;padding:4px 8px;text-align:center;font-size:11px;">${item.unit || ''}</td>
                        <td style="border:1px solid #999;padding:4px 8px;font-size:11px;">${item.supplier || '-'}</td>
                    </tr>
                `)).join('');

            tablesHTML += `
                <div style="page-break-inside:avoid;margin-bottom:15px;">
                    <div style="background:#1a1a1a;color:white;padding:8px 12px;font-size:12px;font-weight:bold;letter-spacing:0.5px;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
                        📍 ${storage} (${storageItems.length} items)
                    </div>
                    <table style="width:100%;border-collapse:collapse;font-size:12px;color:black;border:1px solid #666;margin-bottom:0;">
                        <thead>
                            <tr style="background:#e5e7eb;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
                                <th style="border:1px solid #666;padding:4px 8px;text-align:left;font-size:13px;font-weight:bold;">Item</th>
                                <th style="border:1px solid #666;padding:4px 8px;text-align:center;font-size:13px;font-weight:bold;width:80px;">Cond</th>
                                <th style="border:1px solid #666;padding:4px 8px;text-align:center;font-size:13px;font-weight:bold;width:60px;">Qty</th>
                                <th style="border:1px solid #666;padding:4px 8px;text-align:center;font-size:13px;font-weight:bold;width:80px;">New</th>
                                <th style="border:1px solid #666;padding:4px 8px;text-align:center;font-size:13px;font-weight:bold;width:70px;">Type</th>
                                <th style="border:1px solid #666;padding:4px 8px;text-align:center;font-size:13px;font-weight:bold;width:60px;">SKU</th>
                                <th style="border:1px solid #666;padding:4px 8px;text-align:center;font-size:13px;font-weight:bold;width:65px;">Exp</th>
                                <th style="border:1px solid #666;padding:4px 8px;text-align:center;font-size:13px;font-weight:bold;width:55px;">Unit</th>
                                <th style="border:1px solid #666;padding:4px 8px;text-align:left;font-size:13px;font-weight:bold;width:100px;">Supplier</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            `;
        });

        const html = `
            ${getCHCHeaderHTML()}
            <div style="border-bottom:2px solid black;padding-bottom:8px;margin-bottom:16px;">
                <div style="font-size:22px;font-weight:bold;color:black;">Daily Inventory Audit Form</div>
                <div style="font-size:13px;margin-top:4px;color:black;">
                    Date: ${new Date().toLocaleDateString('en-US', {month:'2-digit',day:'2-digit',year:'numeric'})} | Location: ${selectedLocation?.name || 'All Locations'}${selectedSupplier ? ' | Supplier: ' + selectedSupplier : ''}${selectedItemType ? ' | Type: ' + selectedItemType : ''}${selectedCondition ? ' | Condition: ' + selectedCondition : ''}
                </div>
            </div>
            ${tablesHTML}
            <div style="margin-top:20px;padding-top:8px;border-top:1px solid #999;font-size:12px;color:black;">
                Audited by: _________________ Signature: _________________ Date: _________________
            </div>
        `;

        printHTML(html, 'Daily Inventory Audit Form');
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <ClipboardCheck className="w-6 h-6 text-orange-600" />
                        Daily Inventory Audit
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
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

                    {/* Scan Mode */}
                    <div className={`border-2 rounded-xl p-4 transition-all ${scanMode ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-white'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <button
                                onClick={() => setScanMode(!scanMode)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                                    scanMode ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-700'
                                }`}
                            >
                                <ScanLine className="w-4 h-4" />
                                {scanMode ? 'Scan Mode ON' : 'Enable Scan Mode'}
                            </button>
                            {scanMode && (
                                <button onClick={() => setScanMode(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        
                        {scanMode && (
                            <div className="space-y-3">
                                <ScannerInput 
                                    onScan={handleScanInAudit}
                                    placeholder="Scan item barcode to increment count..."
                                    autoFocus
                                />
                                
                                {/* Scan feedback */}
                                {scanFeedback && (
                                    <div className={`px-3 py-2 rounded-lg text-sm font-medium animate-pulse ${
                                        scanFeedback.type === 'success' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'
                                    }`}>
                                        {scanFeedback.message}
                                    </div>
                                )}
                                
                                {/* Scan log */}
                                {scanLog.length > 0 && (
                                    <div className="max-h-32 overflow-y-auto">
                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Recent Scans</p>
                                        <div className="space-y-1">
                                            {scanLog.slice(0, 10).map((entry, i) => (
                                                <div key={i} className={`flex items-center justify-between text-xs px-2 py-1 rounded ${
                                                    entry.found ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                                                }`}>
                                                    <span>{entry.found ? `✓ ${entry.itemName}` : `✗ ${entry.barcode}`}</span>
                                                    <span className="text-gray-400">{entry.timestamp.toLocaleTimeString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 space-y-3">
                        <Label className="text-sm font-bold block">Filters</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                                <Label className="text-xs text-gray-600 mb-1 block">Location</Label>
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
                            </div>
                            <div>
                                <Label className="text-xs text-gray-600 mb-1 block">Supplier</Label>
                                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="All Suppliers" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>All Suppliers</SelectItem>
                                        {suppliers.map(s => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs text-gray-600 mb-1 block">Item Type</Label>
                                <Select value={selectedItemType} onValueChange={setSelectedItemType}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="All Types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>All Types</SelectItem>
                                        {itemTypes.map(t => (
                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs text-gray-600 mb-1 block">Condition</Label>
                                <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="All Conditions" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>All Conditions</SelectItem>
                                        <SelectItem value="unopened">🔒 Unopened</SelectItem>
                                        <SelectItem value="opened">📦 Opened</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {(selectedLocation || selectedSupplier || selectedItemType || selectedCondition) && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-gray-500">Active filters:</span>
                                {selectedLocation && <Badge variant="secondary" className="text-xs">{selectedLocation.name}</Badge>}
                                {selectedSupplier && <Badge variant="secondary" className="text-xs">{selectedSupplier}</Badge>}
                                {selectedItemType && <Badge variant="secondary" className="text-xs">{selectedItemType}</Badge>}
                                {selectedCondition && <Badge variant="secondary" className="text-xs">{selectedCondition}</Badge>}
                                <button 
                                    onClick={() => { setSelectedLocationId(""); setSelectedSupplier(""); setSelectedItemType(""); setSelectedCondition(""); }}
                                    className="text-xs text-orange-600 hover:underline ml-2"
                                >
                                    Clear all
                                </button>
                            </div>
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
                                    {(() => {
                                        const itemsByName = {};
                                        storageItems.forEach(item => {
                                            if (!itemsByName[item.item_name]) {
                                                itemsByName[item.item_name] = [];
                                            }
                                            itemsByName[item.item_name].push(item);
                                        });
                                        
                                        return Object.entries(itemsByName).sort(([a], [b]) => a.localeCompare(b)).flatMap(([name, items]) => 
                                            items.map(item => {
                                                const currentQty = quantities[item.id] || 0;
                                                const originalQty = item.quantity;
                                                const currentExpiry = expiryDates[item.id] || '';
                                                const originalExpiry = item.expiry_date || '';
                                                const hasChanged = currentQty !== originalQty || currentExpiry !== originalExpiry;
                                                
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
                                                                <div className="flex gap-2 mt-1 flex-wrap">
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {item.item_type}
                                                                    </Badge>
                                                                    {item.item_condition && (
                                                                        <Badge variant="outline" className={`text-xs ${
                                                                            item.item_condition === 'unopened' ? 'border-green-300 text-green-700 bg-green-50' :
                                                                            item.item_condition === 'opened' ? 'border-blue-300 text-blue-700 bg-blue-50' :
                                                                            'border-amber-300 text-amber-700 bg-amber-50'
                                                                        }`}>
                                                                            {item.item_condition === 'unopened' ? '🔒 Unopened' :
                                                                             item.item_condition === 'opened' ? '📦 Opened' : '⚠️ Partial'}
                                                                        </Badge>
                                                                    )}
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

                                                                <div className="w-48">
                                                                    <Label className="text-sm font-semibold mb-2 block">Expiry Date</Label>
                                                                    <Input
                                                                        type="date"
                                                                        value={currentExpiry}
                                                                        onChange={(e) => handleExpiryDateChange(item.id, e.target.value)}
                                                                        className={`h-14 text-center ${
                                                                            currentExpiry !== originalExpiry ? 'border-orange-500 border-3 bg-orange-50' : ''
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
                                            })
                                        );
                                    })()}
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
        </>
    );
}