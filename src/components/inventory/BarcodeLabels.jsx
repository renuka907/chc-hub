import React, { useState, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Printer, Search, Tag, X } from "lucide-react";
import { printHTML } from "../PrintHelper";

export default function BarcodeLabels({ open, onOpenChange, items = [], locations = [] }) {
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [labelsPerItem, setLabelsPerItem] = useState(1);

    const getLocationName = (locationId) => {
        const loc = locations.find(l => l.id === locationId);
        return loc?.name || "";
    };

    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return items;
        const q = searchQuery.toLowerCase();
        return items.filter(i => 
            i.item_name?.toLowerCase().includes(q) ||
            i.sku?.toLowerCase().includes(q) ||
            i.storage_location?.toLowerCase().includes(q)
        );
    }, [items, searchQuery]);

    const toggleItem = (id) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const selectAll = () => {
        if (selectedIds.size === filteredItems.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredItems.map(i => i.id)));
        }
    };

    const handlePrint = () => {
        const selectedItems = items.filter(i => selectedIds.has(i.id));
        
        // Build labels HTML - 3 columns, 2x1 inch labels
        let labelsHTML = '';
        const allLabels = [];
        
        selectedItems.forEach(item => {
            const barcodeValue = item.sku || item.id.slice(0, 12);
            const locationName = item.storage_location || getLocationName(item.location_id) || '';
            
            for (let i = 0; i < labelsPerItem; i++) {
                allLabels.push({ item, barcodeValue, locationName });
            }
        });

        // Create rows of 3
        for (let i = 0; i < allLabels.length; i += 3) {
            const row = allLabels.slice(i, i + 3);
            const cells = row.map(({ item, barcodeValue, locationName }) => `
                <td style="width:2in;height:1in;border:1px dashed #ccc;padding:4px 6px;vertical-align:top;overflow:hidden;">
                    <div style="font-size:8pt;font-weight:bold;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:1.8in;">
                        ${item.item_name}
                    </div>
                    <div style="text-align:center;margin:2px 0;">
                        <img src="https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(barcodeValue)}&scale=2&height=8&includetext" 
                             style="max-width:1.7in;height:auto;" 
                             onerror="this.outerHTML='<div style=font-size:10pt;font-weight:bold;text-align:center;padding:4px>${barcodeValue}</div>'" />
                    </div>
                    <div style="font-size:7pt;color:#666;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                        ${locationName ? `📍 ${locationName}` : ''}
                    </div>
                </td>
            `).join('');
            
            // Pad empty cells if row has < 3
            const emptyCells = '<td style="width:2in;height:1in;border:1px dashed #ccc;"></td>'.repeat(3 - row.length);
            
            labelsHTML += `<tr>${cells}${emptyCells}</tr>`;
        }

        const html = `
            <style>
                @page { size: letter; margin: 0.5in; }
                body { margin: 0; padding: 0; }
                table { border-collapse: collapse; width: 100%; }
            </style>
            <table>
                ${labelsHTML}
            </table>
        `;

        printHTML(html, 'Barcode Labels');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Tag className="w-5 h-5 text-purple-600" />
                        Print Barcode Labels
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Search + Controls */}
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search items..."
                                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 whitespace-nowrap">Labels each:</span>
                            <Input
                                type="number"
                                min={1}
                                max={20}
                                value={labelsPerItem}
                                onChange={(e) => setLabelsPerItem(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-16 h-9 text-center text-sm"
                            />
                        </div>
                    </div>

                    {/* Select all */}
                    <div className="flex items-center justify-between">
                        <button onClick={selectAll} className="text-xs text-purple-600 hover:text-purple-800 font-medium">
                            {selectedIds.size === filteredItems.length && filteredItems.length > 0 ? 'Deselect All' : 'Select All'}
                        </button>
                        <Badge variant="outline" className="text-xs">
                            {selectedIds.size} selected → {selectedIds.size * labelsPerItem} labels
                        </Badge>
                    </div>

                    {/* Items list */}
                    <div className="border border-gray-200 rounded-xl max-h-[40vh] overflow-y-auto divide-y divide-gray-100">
                        {filteredItems.map(item => (
                            <label
                                key={item.id}
                                className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                                    selectedIds.has(item.id) ? 'bg-purple-50' : ''
                                }`}
                            >
                                <Checkbox
                                    checked={selectedIds.has(item.id)}
                                    onCheckedChange={() => toggleItem(item.id)}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{item.item_name}</p>
                                    <p className="text-xs text-gray-400">
                                        {item.sku ? `SKU: ${item.sku}` : 'No SKU'} 
                                        {item.storage_location ? ` • ${item.storage_location}` : ''}
                                    </p>
                                </div>
                            </label>
                        ))}
                        {filteredItems.length === 0 && (
                            <div className="py-8 text-center text-gray-400 text-sm">No items found</div>
                        )}
                    </div>

                    {/* Print button */}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button 
                            onClick={handlePrint}
                            disabled={selectedIds.size === 0}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            Print {selectedIds.size * labelsPerItem} Labels
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
