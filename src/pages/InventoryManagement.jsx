import React, { useState } from "react";
import { entities, uploadFile, invokeLLM, generateImage, sendEmail, agentChat, getCurrentUser } from "@/api/supabaseHelpers";
import { usePermissions } from "@/components/permissions/usePermissions";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import SearchBar from "../components/SearchBar";
import InventoryForm from "../components/inventory/InventoryForm";
import InventoryAuditForm from "../components/inventory/InventoryAuditForm";
import InventoryAI from "../components/inventory/InventoryAI";
import BarcodeLabels from "../components/inventory/BarcodeLabels";
import { Package, PackageOpen, Plus, Pencil, Trash2, AlertTriangle, TrendingDown, TrendingUp, Calendar, Settings, ClipboardCheck, Sparkles, Check, Barcode, Search, Filter, ChevronDown, ChevronUp, DollarSign, Archive, RotateCcw, X, Minus, Copy, Tag, ScanLine } from "lucide-react";
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

function CameraScanDialog({ onClose, items, onItemFound, onLinkBarcode, onUpdateQuantity, onAddToLocation, locations = [] }) {
    const videoRef = React.useRef(null);
    const streamRef = React.useRef(null);
    const intervalRef = React.useRef(null);
    const html5ScannerRef = React.useRef(null);
    const [scannedCode, setScannedCode] = React.useState(null);
    const [matchedItem, setMatchedItem] = React.useState(null);
    const [linkSearch, setLinkSearch] = React.useState('');
    const [showLink, setShowLink] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [scanning, setScanning] = React.useState(false);
    const [manualCode, setManualCode] = React.useState('');
    const [useHtml5Scanner, setUseHtml5Scanner] = React.useState(false);
    const [selectedLocation, setSelectedLocation] = React.useState(() => {
        // Persist location across scans via sessionStorage
        return sessionStorage.getItem('scanner-location') || '';
    });

    const stopCamera = React.useCallback(() => {
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
        if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
        if (html5ScannerRef.current) {
            html5ScannerRef.current.stop().catch(() => {});
            html5ScannerRef.current = null;
        }
    }, []);

    const startHtml5Scanner = React.useCallback(async (processCodeFn) => {
        try {
            setError(null);
            const { Html5Qrcode } = await import('html5-qrcode');
            const scanner = new Html5Qrcode('camera-scanner-fallback');
            html5ScannerRef.current = scanner;
            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.5 },
                (decodedText) => {
                    scanner.stop().catch(() => {});
                    html5ScannerRef.current = null;
                    setScanning(false);
                    processCodeFn(decodedText);
                },
                () => {} // ignore scan failures
            );
            setScanning(true);
        } catch (e) {
            console.error('html5-qrcode fallback error:', e);
            setError('Could not start camera scanner. Please allow camera permissions or enter the barcode manually.');
        }
    }, []);

    const startCamera = React.useCallback(async () => {
        setError(null);
        setScanning(false);

        // Use BarcodeDetector if available (Chrome/Edge), otherwise use html5-qrcode fallback
        if (!('BarcodeDetector' in window)) {
            setUseHtml5Scanner(true);
            return; // html5 scanner will start via useEffect after DOM renders
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setScanning(true);

                const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code', 'data_matrix'] });
                intervalRef.current = setInterval(async () => {
                    if (!videoRef.current || videoRef.current.readyState < 2) return;
                    try {
                        const barcodes = await detector.detect(videoRef.current);
                        if (barcodes.length > 0) {
                            const code = barcodes[0].rawValue;
                            stopCamera();
                            processCode(code);
                        }
                    } catch (e) { /* ignore detection errors */ }
                }, 200);
            }
        } catch (e) {
            setError('Camera access denied. Please allow camera permissions and try again.');
        }
    }, []);

    const processCode = (code) => {
        setScannedCode(code);
        // If location selected, prefer match at that location; otherwise match any
        const allMatches = items.filter(i => i.sku === code || (i.sku && i.sku.trim() === code.trim()));
        let match = null;
        if (selectedLocation && allMatches.length > 0) {
            match = allMatches.find(i => i.location_id === selectedLocation) || allMatches[0];
        } else {
            match = allMatches[0] || null;
        }
        if (match) {
            setMatchedItem(match);
        }
    };

    React.useEffect(() => {
        if (!useHtml5Scanner) {
            startCamera();
        }
        return () => stopCamera();
    }, []);

    // Start html5-qrcode fallback when DOM element is ready
    React.useEffect(() => {
        if (useHtml5Scanner && !scannedCode) {
            const timer = setTimeout(() => {
                startHtml5Scanner(processCode);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [useHtml5Scanner, scannedCode]);

    const handleRescan = () => {
        setScannedCode(null);
        setMatchedItem(null);
        setShowLink(false);
        setLinkSearch('');
        setManualCode('');
        if (useHtml5Scanner) {
            // html5 scanner will restart via useEffect when scannedCode becomes null
        } else {
            startCamera();
        }
    };

    const handleManualSubmit = () => {
        if (manualCode.trim()) {
            stopCamera();
            processCode(manualCode.trim());
        }
    };

    const filteredItems = items.filter(i => {
        if (!linkSearch.trim()) return false;
        const q = linkSearch.toLowerCase();
        return (i.item_name || '').toLowerCase().includes(q) || (i.sku || '').toLowerCase().includes(q);
    });

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => { stopCamera(); onClose(); }}>
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-bold text-lg">📷 Scan Barcode</h3>
                    <button onClick={() => { stopCamera(); onClose(); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-4 space-y-3">
                    {/* Sticky location picker */}
                    <div className="flex items-center gap-2 bg-purple-50 rounded-lg p-2 border border-purple-200">
                        <span className="text-xs font-semibold text-purple-700 whitespace-nowrap">📍 Location:</span>
                        <select
                            value={selectedLocation}
                            onChange={(e) => {
                                setSelectedLocation(e.target.value);
                                sessionStorage.setItem('scanner-location', e.target.value);
                            }}
                            className="flex-1 px-2 py-1.5 bg-white border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                        >
                            <option value="">All Locations</option>
                            {locations.filter(l => l.status === 'active').map(loc => (
                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                        </select>
                    </div>

                    {!scannedCode && (
                        <>
                            {useHtml5Scanner ? (
                                /* html5-qrcode fallback for iOS/Safari */
                                <div>
                                    <div id="camera-scanner-fallback" className="rounded-lg overflow-hidden bg-black" style={{ minHeight: 250 }} />
                                    {error ? (
                                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">{error}</div>
                                    ) : scanning ? (
                                        <p className="text-center text-sm text-gray-500 mt-3 animate-pulse">Point camera at a barcode...</p>
                                    ) : (
                                        <p className="text-center text-sm text-gray-500 mt-3">Starting camera...</p>
                                    )}
                                </div>
                            ) : (
                                /* Native BarcodeDetector for Chrome/Edge */
                                <div className="rounded-lg overflow-hidden bg-black relative" style={{ minHeight: 220 }}>
                                    <video ref={videoRef} className="w-full h-full object-cover" playsInline muted style={{ minHeight: 220 }} />
                                    {scanning && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="border-2 border-purple-400 rounded-lg" style={{ width: 250, height: 100, boxShadow: '0 0 0 9999px rgba(0,0,0,0.3)' }} />
                                        </div>
                                    )}
                                </div>
                            )}
                            {!useHtml5Scanner && error && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">{error}</div>
                            )}
                            {!useHtml5Scanner && !error && scanning && (
                                <p className="text-center text-sm text-gray-500 animate-pulse">Point camera at a barcode...</p>
                            )}
                            {!useHtml5Scanner && !error && !scanning && (
                                <p className="text-center text-sm text-gray-500">Starting camera...</p>
                            )}
                            {/* Manual entry fallback */}
                            <div className="flex gap-2 mt-3">
                                <input
                                    value={manualCode}
                                    onChange={e => setManualCode(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
                                    placeholder="Or type barcode manually..."
                                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                />
                                <Button onClick={handleManualSubmit} disabled={!manualCode.trim()} size="sm">Go</Button>
                            </div>
                        </>
                    )}
                    {scannedCode && (
                        <>
                            <div className="bg-gray-50 rounded-lg p-3 border">
                                <p className="text-xs text-gray-500">Scanned</p>
                                <p className="font-mono font-bold text-lg">{scannedCode}</p>
                            </div>
                            {matchedItem ? (
                                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                    <p className="text-sm font-semibold text-green-800 mb-1">✅ Item Found!</p>
                                    <p className="font-semibold">{matchedItem.item_name}</p>
                                    <p className="text-xs text-gray-500">SKU: {matchedItem.sku}</p>
                                    {matchedItem.location_id && (
                                        <p className="text-xs text-purple-600">📍 {locations.find(l => l.id === matchedItem.location_id)?.name || 'Unknown location'}</p>
                                    )}
                                    {/* Show move/add options if item is at a different location than selected */}
                                    {selectedLocation && matchedItem.location_id !== selectedLocation && (
                                        <div className="mt-2 space-y-1.5">
                                            <p className="text-[11px] text-amber-600 font-medium">⚠️ This item is at a different location</p>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        if (onUpdateQuantity) {
                                                            await onUpdateQuantity(matchedItem.id, matchedItem.quantity, { location_id: selectedLocation });
                                                        }
                                                        setMatchedItem({ ...matchedItem, location_id: selectedLocation });
                                                    } catch (err) {
                                                        console.error('Failed to move item:', err);
                                                    }
                                                }}
                                                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-xs font-semibold transition-colors"
                                            >
                                                📦 Move to {locations.find(l => l.id === selectedLocation)?.name || 'selected location'}
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        if (onAddToLocation) {
                                                            const newItem = await onAddToLocation(matchedItem, selectedLocation);
                                                            if (newItem) {
                                                                setMatchedItem({ ...newItem, location_id: selectedLocation });
                                                            }
                                                        }
                                                    } catch (err) {
                                                        console.error('Failed to add item to location:', err);
                                                    }
                                                }}
                                                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-semibold transition-colors"
                                            >
                                                ➕ Add to {locations.find(l => l.id === selectedLocation)?.name || 'selected location'}
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 bg-white rounded-lg p-2 border border-green-200">
                                        <span className="text-xs font-medium text-gray-600">Qty:</span>
                                        <button
                                            onClick={() => {
                                                const newQty = Math.max(0, (matchedItem.quantity || 0) - 1);
                                                setMatchedItem({ ...matchedItem, quantity: newQty });
                                                if (onUpdateQuantity) onUpdateQuantity(matchedItem.id, newQty);
                                            }}
                                            disabled={(matchedItem.quantity || 0) <= 0}
                                            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-lg disabled:opacity-30 transition-colors"
                                        >−</button>
                                        <input
                                            type="number"
                                            value={matchedItem.quantity || 0}
                                            onChange={(e) => {
                                                const newQty = Math.max(0, parseInt(e.target.value) || 0);
                                                setMatchedItem({ ...matchedItem, quantity: newQty });
                                                if (onUpdateQuantity) onUpdateQuantity(matchedItem.id, newQty);
                                            }}
                                            className="w-16 text-center text-lg font-bold border border-gray-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-purple-300"
                                        />
                                        <button
                                            onClick={() => {
                                                const newQty = (matchedItem.quantity || 0) + 1;
                                                setMatchedItem({ ...matchedItem, quantity: newQty });
                                                if (onUpdateQuantity) onUpdateQuantity(matchedItem.id, newQty);
                                            }}
                                            className="w-8 h-8 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-700 flex items-center justify-center font-bold text-lg transition-colors"
                                        >+</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                                        <p className="text-sm font-semibold text-amber-800">⚠️ No matching item</p>
                                        <p className="text-xs text-amber-700">This barcode isn't linked to any inventory item yet.</p>
                                    </div>
                                    {!showLink ? (
                                        <Button onClick={() => setShowLink(true)} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                                            🔗 Link to Existing Item
                                        </Button>
                                    ) : (
                                        <div className="space-y-2">
                                            <input
                                                value={linkSearch}
                                                onChange={e => setLinkSearch(e.target.value)}
                                                placeholder="Search inventory to link..."
                                                className="w-full px-3 py-2 border rounded-lg text-sm"
                                                autoFocus
                                            />
                                            <div className="max-h-40 overflow-y-auto space-y-1">
                                                {filteredItems.slice(0, 15).map(item => (
                                                    <button key={item.id} onClick={() => {
                                                        if (onLinkBarcode) onLinkBarcode(item, scannedCode);
                                                        setMatchedItem({ ...item, sku: scannedCode });
                                                        setShowLink(false);
                                                    }} className="w-full text-left p-2 rounded hover:bg-purple-50 text-sm">
                                                        <span className="font-medium">{item.item_name}</span>
                                                        {item.sku && <span className="text-xs text-gray-400 ml-2">SKU: {item.sku}</span>}
                                                    </button>
                                                ))}
                                                {linkSearch.trim() && !filteredItems.length && (
                                                    <p className="text-xs text-gray-400 text-center py-2">No items match</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="flex gap-2 pt-2">
                                <Button onClick={handleRescan} variant="outline" className="flex-1">📷 Scan Again</Button>
                                <Button onClick={() => { stopCamera(); onClose(); }} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">Done</Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function InventoryManagement() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState("all");
    const [selectedLocation, setSelectedLocation] = useState("all");
    const [selectedStorageLocation, setSelectedStorageLocation] = useState("all");
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);
    const [showExpiringOnly, setShowExpiringOnly] = useState(false);
    const [expiryThresholdDays, setExpiryThresholdDays] = useState(30);
    const [showForm, setShowForm] = useState(false);
    const [showAuditForm, setShowAuditForm] = useState(false);
    const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
    const [showBarcodeLabels, setShowBarcodeLabels] = useState(false);
    const [showScannerInput, setShowScannerInput] = useState(false);
    const [showCameraScanner, setShowCameraScanner] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [showAI, setShowAI] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState("list");
    const [expandedItem, setExpandedItem] = useState(null);
    const [sortColumn, setSortColumn] = useState("item_name");
    const [sortDirection, setSortDirection] = useState("asc");
    const queryClient = useQueryClient();

    React.useEffect(() => {
        getCurrentUser().then(u => { if (u) setCurrentUser(u); });
    }, []);

    const { data: inventoryItems = [], isLoading } = useQuery({
        queryKey: ['inventoryItems'],
        queryFn: async () => {
            let all = [], offset = 0;
            const PAGE = 1000;
            while (true) {
                const { data, error } = await supabase
                    .from('inventory_items').select('*').order('updated_at', { ascending: false }).range(offset, offset + PAGE - 1);
                if (error) throw error;
                if (!data || data.length === 0) break;
                all = all.concat(data);
                if (data.length < PAGE) break;
                offset += PAGE;
            }
            return all;
        },
        refetchInterval: 30000,
        refetchOnWindowFocus: false,
        retry: 1,
    });

    const { data: locations = [] } = useQuery({
        queryKey: ['clinicLocations'],
        queryFn: () => entities.ClinicLocation.list(),
    });

    const { data: pricingItems = [] } = useQuery({
        queryKey: ['pricingItems'],
        queryFn: () => entities.PricingItem.list(),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => entities.InventoryItem.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
            setDeleteConfirm(null);
        },
    });

    const archiveMutation = useMutation({
        mutationFn: (id) => entities.InventoryItem.update(id, { status: 'archived' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
        },
    });

    const unarchiveMutation = useMutation({
        mutationFn: (id) => entities.InventoryItem.update(id, { status: 'active' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
        },
    });

    const toggleOpenedMutation = useMutation({
        mutationFn: async ({ id, newCondition }) => {
            const { data, error } = await supabase.from('inventory_items').update({ item_condition: newCondition }).eq('id', id).select().single();
            if (error) throw error;
            return data;
        },
        onMutate: async ({ id, newCondition }) => {
            await queryClient.cancelQueries({ queryKey: ['inventoryItems'] });
            const prev = queryClient.getQueryData(['inventoryItems']);
            queryClient.setQueryData(['inventoryItems'], old =>
                (old || []).map(item => item.id === id ? { ...item, item_condition: newCondition } : item)
            );
            return { prev };
        },
        onError: (err, vars, ctx) => {
            console.error('Toggle opened failed:', err);
            if (ctx?.prev) queryClient.setQueryData(['inventoryItems'], ctx.prev);
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['inventoryItems'] }),
    });

    const quickQuantityMutation = useMutation({
        mutationFn: ({ id, quantity }) => entities.InventoryItem.update(id, { quantity }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
        },
    });

    const bulkArchiveMutation = useMutation({
        mutationFn: async () => {
            for (const id of selectedItems) {
                await entities.InventoryItem.update(id, { status: 'archived' });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
            setSelectedItems(new Set());
        },
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: async () => {
            for (const id of selectedItems) {
                await entities.InventoryItem.delete(id);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
            setSelectedItems(new Set());
        },
    });

    const bulkStatusMutation = useMutation({
        mutationFn: async (newStatus) => {
            for (const id of selectedItems) {
                await entities.InventoryItem.update(id, { status: newStatus });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
            setSelectedItems(new Set());
        },
    });

    const handleSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
        setEditingItem(null);
        setShowForm(false);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setShowForm(true);
    };

    const handleDuplicate = (item) => {
        const dup = { ...item };
        delete dup.id;
        delete dup.created_at;
        delete dup.updated_at;
        delete dup.created_by;
        dup.item_name = (dup.item_name || '') + ' (Copy)';
        setEditingItem(dup);
        setShowForm(true);
    };

    const normalizeText = (text) => text.toLowerCase().replace(/[-.\s]/g, '');

    const availableStorageLocations = React.useMemo(() => {
        const locs = new Set();
        inventoryItems.forEach(item => {
            if (item.storage_location && item.status === 'active') {
                locs.add(item.storage_location);
            }
        });
        return ["all", ...Array.from(locs).sort()];
    }, [inventoryItems]);

    const isExpiringSoon = (expiryDate) => {
        if (!expiryDate) return false;
        const today = new Date();
        const expiry = new Date(expiryDate);
        const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry >= 0 && daysUntilExpiry <= expiryThresholdDays;
    };

    const isExpired = (expiryDate) => {
        if (!expiryDate) return false;
        return new Date(expiryDate) < new Date();
    };

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortDirection(d => d === "asc" ? "desc" : "asc");
        } else {
            setSortColumn(column);
            setSortDirection("asc");
        }
    };

    const SortArrow = ({ column }) => {
        if (sortColumn !== column) return <ChevronUp className="w-3 h-3 text-gray-300 ml-0.5 inline" />;
        return sortDirection === "asc"
            ? <ChevronUp className="w-3 h-3 text-purple-600 ml-0.5 inline" />
            : <ChevronDown className="w-3 h-3 text-purple-600 ml-0.5 inline" />;
    };

    const filteredItems = inventoryItems
        .filter(item => {
            const normalizedQuery = normalizeText(searchQuery);
            const matchesSearch = !normalizedQuery || 
                normalizeText(item.item_name).includes(normalizedQuery) ||
                normalizeText(item.sku || '').includes(normalizedQuery) ||
                normalizeText(item.notes || '').includes(normalizedQuery) ||
                normalizeText(item.supplier || '').includes(normalizedQuery) ||
                normalizeText(item.storage_location || '').includes(normalizedQuery);
            
            const matchesType = selectedType === "all" || item.item_type === selectedType;
            const matchesLocation = selectedLocation === "all" || item.location_id === selectedLocation;
            const matchesStorageLocation = selectedStorageLocation === "all" || item.storage_location === selectedStorageLocation;
            const matchesLowStock = !showLowStockOnly || (item.quantity <= item.low_stock_threshold);
            const matchesExpiring = !showExpiringOnly || isExpiringSoon(item.expiry_date);
            const matchesStatus = showArchived ? item.status === 'archived' : item.status === 'active';

            return matchesSearch && matchesType && matchesLocation && matchesStorageLocation && matchesLowStock && matchesExpiring && matchesStatus;
        })
        .sort((a, b) => {
            const dir = sortDirection === "asc" ? 1 : -1;
            switch (sortColumn) {
                case "item_name": return dir * (a.item_name || "").localeCompare(b.item_name || "");
                case "item_type": return dir * (a.item_type || "").localeCompare(b.item_type || "");
                case "quantity": return dir * ((a.quantity || 0) - (b.quantity || 0));
                case "storage_location": return dir * (a.storage_location || "").localeCompare(b.storage_location || "");
                case "supplier": return dir * (a.supplier || "").localeCompare(b.supplier || "");
                case "expiry_date": {
                    const da = a.expiry_date ? new Date(a.expiry_date).getTime() : Infinity;
                    const db = b.expiry_date ? new Date(b.expiry_date).getTime() : Infinity;
                    return dir * (da - db);
                }
                case "location_id": {
                    const locA = locations.find(l => l.id === a.location_id)?.name || "Unassigned";
                    const locB = locations.find(l => l.id === b.location_id)?.name || "Unassigned";
                    return dir * locA.localeCompare(locB);
                }
                default: return 0;
            }
        });

    const activeItems = inventoryItems.filter(i => i.status === 'active');
    const lowStockCount = activeItems.filter(item => item.quantity <= item.low_stock_threshold).length;
    const expiringCount = activeItems.filter(item => isExpiringSoon(item.expiry_date)).length;
    const expiredCount = activeItems.filter(item => isExpired(item.expiry_date)).length;
    const totalValue = activeItems.reduce((sum, item) => sum + ((item.cost_per_unit || 0) * item.quantity), 0);
    const totalItems = activeItems.length;
    const activeFiltersCount = [selectedType !== 'all', selectedLocation !== 'all', selectedStorageLocation !== 'all', showLowStockOnly, showExpiringOnly].filter(Boolean).length;

    const typeColors = {
        "Product": "bg-emerald-500",
        "Supply": "bg-blue-500",
        "Equipment": "bg-violet-500",
        "Medication": "bg-rose-500"
    };

    const typeColorsBg = {
        "Product": "bg-emerald-50 text-emerald-700 border-emerald-200",
        "Supply": "bg-blue-50 text-blue-700 border-blue-200",
        "Equipment": "bg-violet-50 text-violet-700 border-violet-200",
        "Medication": "bg-rose-50 text-rose-700 border-rose-200"
    };

    const getLocationName = (locationId) => {
        const location = locations.find(loc => loc.id === locationId);
        return location?.name || "Unassigned";
    };

    const getPricingItemNames = (itemIds) => {
        if (!itemIds) return [];
        try {
            const ids = JSON.parse(itemIds);
            return ids.map(id => {
                const item = pricingItems.find(p => p.id === id);
                return item?.name || id;
            });
        } catch (e) {
            return [];
        }
    };

    const { can } = usePermissions();
    const canEdit = can('inventory', 'edit') || can('inventory', 'create') || currentUser?.role === 'admin' || currentUser?.role === 'manager';

    const toggleItemSelection = (itemId) => {
        const newSelection = new Set(selectedItems);
        if (newSelection.has(itemId)) {
            newSelection.delete(itemId);
        } else {
            newSelection.add(itemId);
        }
        setSelectedItems(newSelection);
    };

    const selectAll = () => {
        if (selectedItems.size === filteredItems.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(filteredItems.map(i => i.id)));
        }
    };

    const handleBarcodeScanned = (barcode) => {
        const foundItem = inventoryItems.find(
            item => item.sku === barcode || (item.sku && item.sku.includes(barcode))
        );
        if (foundItem) {
            setEditingItem(foundItem);
            setShowForm(true);
        } else {
            setEditingItem(null);
            setShowForm(true);
        }
    };

    const clearAllFilters = () => {
        setSelectedType("all");
        setSelectedLocation("all");
        setSelectedStorageLocation("all");
        setShowLowStockOnly(false);
        setShowExpiringOnly(false);
        setSearchQuery("");
    };

    const getStockPercentage = (item) => {
        if (!item.low_stock_threshold || item.low_stock_threshold === 0) return 100;
        const fullStock = item.low_stock_threshold * 3;
        return Math.min(100, Math.round((item.quantity / fullStock) * 100));
    };

    return (
        <div className="space-y-3">
            {/* Compact Header */}
            <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-500 rounded-2xl py-3 px-5 shadow-md relative overflow-hidden">
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <Package className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-white">Inventory</h1>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button 
                            onClick={() => setShowAI(!showAI)} 
                            size="sm"
                            className={`rounded-xl h-8 text-xs transition-all ${showAI ? 'bg-white text-purple-700' : 'bg-white/20 text-white hover:bg-white/30 border-0'}`}
                        >
                            <Sparkles className="w-3.5 h-3.5 mr-1" />
                            AI
                        </Button>
                        {canEdit && (
                            <>
                                <Button 
                                    onClick={() => setShowCameraScanner(true)} 
                                    size="sm"
                                    className="bg-white/20 text-white hover:bg-white/30 border-0 rounded-xl h-8 text-xs"
                                >
                                    <Barcode className="w-3.5 h-3.5 mr-1" />
                                    Scan
                                </Button>
                                <Button 
                                    onClick={() => setShowBarcodeLabels(true)} 
                                    size="sm"
                                    className="bg-white/20 text-white hover:bg-white/30 border-0 rounded-xl h-8 text-xs"
                                >
                                    <Tag className="w-3.5 h-3.5 mr-1" />
                                    Labels
                                </Button>
                                <Button 
                                    onClick={() => setShowAuditForm(true)} 
                                    size="sm"
                                    className="bg-white/20 text-white hover:bg-white/30 border-0 rounded-xl h-8 text-xs"
                                >
                                    <ClipboardCheck className="w-3.5 h-3.5 mr-1" />
                                    Audit
                                </Button>
                                <Button 
                                    onClick={() => { setEditingItem(null); setShowForm(true); }} 
                                    size="sm"
                                    className="bg-white text-purple-700 hover:bg-white/90 rounded-xl font-semibold h-8 text-xs"
                                >
                                    <Plus className="w-3.5 h-3.5 mr-1" />
                                    Add Item
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* AI Assistant */}
            {showAI && (
                <InventoryAI 
                    inventoryItems={activeItems} 
                    locations={locations} 
                />
            )}

            {/* Stats Badges */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">
                    📦 {inventoryItems.length} items
                </span>
                <button
                    onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        showLowStockOnly ? 'bg-red-100 text-red-700 border-red-300 ring-2 ring-red-200' :
                        lowStockCount > 0 ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-gray-50 text-gray-500 border-gray-200'
                    }`}
                >
                    ⚠️ {lowStockCount} low stock
                </button>
                <button
                    onClick={() => setShowExpiringOnly(!showExpiringOnly)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        showExpiringOnly ? 'bg-amber-100 text-amber-700 border-amber-300 ring-2 ring-amber-200' :
                        expiringCount > 0 ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' : 'bg-gray-50 text-gray-500 border-gray-200'
                    }`}
                >
                    ⏰ {expiringCount} expiring
                </button>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200">
                    💰 ${totalValue.toLocaleString()}
                </span>
            </div>

            {/* Search Bar + Filters + View Toggle */}
            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search items, SKU, supplier..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition-all shadow-sm"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        </button>
                    )}
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm ${
                        showFilters || activeFiltersCount > 0
                            ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    <Filter className="w-4 h-4" />
                    <span className="hidden sm:inline">Filters</span>
                    {activeFiltersCount > 0 && (
                        <span className="w-5 h-5 bg-purple-600 text-white rounded-full text-xs flex items-center justify-center">
                            {activeFiltersCount}
                        </span>
                    )}
                </button>
                <div className="hidden sm:flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <button 
                        onClick={() => setViewMode("grid")}
                        className={`p-2 transition-all ${viewMode === 'grid' ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
                    </button>
                    <button 
                        onClick={() => setViewMode("list")}
                        className={`p-2 transition-all ${viewMode === 'list' ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><rect x="1" y="1" width="14" height="3" rx="1"/><rect x="1" y="6" width="14" height="3" rx="1"/><rect x="1" y="11" width="14" height="3" rx="1"/></svg>
                    </button>
                </div>
            </div>

            {/* Collapsible Filters */}
            {showFilters && (
                <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4 shadow-sm">
                    {/* Type Filters */}
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Type</p>
                        <div className="flex flex-wrap gap-2">
                            {["all", "Product", "Supply", "Equipment", "Medication"].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setSelectedType(type)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                        selectedType === type 
                                            ? type === 'all' ? 'bg-purple-600 text-white' : `${typeColors[type]} text-white`
                                            : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    {type === "all" ? "All Types" : type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Location + Storage Filters */}
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Location</p>
                            <select
                                value={selectedLocation}
                                onChange={(e) => setSelectedLocation(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                            >
                                <option value="all">All Locations</option>
                                {locations.filter(loc => loc.status === 'active').map(location => (
                                    <option key={location.id} value={location.id}>{location.name}</option>
                                ))}
                            </select>
                        </div>
                        {availableStorageLocations.length > 1 && (
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Storage Location</p>
                                <select
                                    value={selectedStorageLocation}
                                    onChange={(e) => setSelectedStorageLocation(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                                >
                                    {availableStorageLocations.map(loc => (
                                        <option key={loc} value={loc}>{loc === "all" ? "All Storage Locations" : loc}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Expiry Threshold + Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Expiry alert:</span>
                            <input
                                type="number"
                                min="1"
                                max="365"
                                value={expiryThresholdDays}
                                onChange={(e) => setExpiryThresholdDays(parseInt(e.target.value) || 30)}
                                className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-purple-300"
                            />
                            <span className="text-xs text-gray-500">days</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowArchived(!showArchived)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    showArchived ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <Archive className="w-3.5 h-3.5" />
                                {showArchived ? 'Viewing Archived' : 'Show Archived'}
                            </button>
                            {activeFiltersCount > 0 && (
                                <button
                                    onClick={clearAllFilters}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 border border-red-200 hover:bg-red-100"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Clear All
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Actions Bar */}
            {selectedItems.size > 0 && canEdit && (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-3 flex items-center justify-between animate-in slide-in-from-top">
                    <div className="flex items-center gap-3">
                        <Checkbox
                            checked={selectedItems.size === filteredItems.length}
                            onCheckedChange={selectAll}
                        />
                        <span className="text-sm font-semibold text-purple-800">
                            {selectedItems.size} selected
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => bulkStatusMutation.mutate('active')}
                            className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 rounded-lg text-xs h-8"
                        >
                            <Check className="w-3.5 h-3.5 mr-1" /> Active
                        </Button>
                        <Button size="sm" variant="outline" 
                            onClick={async () => {
                                const items = Array.from(selectedIds);
                                for (const id of items) {
                                    await supabase.from('inventory_items').update({ item_condition: 'opened' }).eq('id', id);
                                }
                                queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
                                setSelectedIds(new Set());
                            }}
                            className="text-amber-600 border-amber-300 hover:bg-amber-50 rounded-lg text-xs h-8"
                        >
                            <PackageOpen className="w-3.5 h-3.5 mr-1" /> Opened
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => bulkArchiveMutation.mutate()}
                            className="text-gray-600 border-gray-300 hover:bg-gray-50 rounded-lg text-xs h-8"
                        >
                            <Archive className="w-3.5 h-3.5 mr-1" /> Archive
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => bulkDeleteMutation.mutate()}
                            className="rounded-lg text-xs h-8"
                        >
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedItems(new Set())}
                            className="rounded-lg text-xs h-8"
                        >
                            <X className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Results count */}
            <div className="flex items-center justify-between px-1">
                <p className="text-sm text-gray-500">
                    {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
                    {activeFiltersCount > 0 && ` (filtered)`}
                </p>
                {canEdit && filteredItems.length > 0 && (
                    <button onClick={selectAll} className="text-xs text-purple-600 hover:text-purple-800 font-medium">
                        {selectedItems.size === filteredItems.length ? 'Deselect All' : 'Select All'}
                    </button>
                )}
            </div>

            {/* Inventory Items */}
            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-200 border-t-purple-600 mx-auto mb-3"></div>
                        <p className="text-sm text-gray-500">Loading inventory...</p>
                    </div>
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 text-center py-16">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No items found</p>
                    <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
                    {activeFiltersCount > 0 && (
                        <button onClick={clearAllFilters} className="mt-4 text-sm text-purple-600 hover:text-purple-800 font-medium">
                            Clear all filters
                        </button>
                    )}
                </div>
            ) : viewMode === 'grid' ? (
                /* Grid View — slightly tighter cards */
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filteredItems.map(item => {
                        const isLowStock = item.quantity <= item.low_stock_threshold;
                        const itemExpiringSoon = isExpiringSoon(item.expiry_date);
                        const itemExpired = isExpired(item.expiry_date);
                        const daysUntilExpiry = item.expiry_date ? Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                        const stockPct = getStockPercentage(item);

                        return (
                            <div 
                                key={item.id} 
                                className={`bg-white rounded-xl border overflow-hidden transition-all hover:shadow-md group ${
                                    selectedItems.has(item.id) ? 'ring-2 ring-purple-400 border-purple-300' :
                                    itemExpired ? 'border-red-200' :
                                    isLowStock ? 'border-red-200' : 
                                    itemExpiringSoon ? 'border-amber-200' : 'border-gray-100'
                                }`}
                            >
                                <div className={`h-1 ${typeColors[item.item_type] || 'bg-gray-300'}`} />
                                
                                <div className="p-3 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
                                                {item.item_name}
                                                {item.item_condition === 'opened' && <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">OPENED</span>}
                                            </h3>
                                            {item.sku && <p className="text-[11px] text-gray-400 mt-0.5">SKU: {item.sku}</p>}
                                        </div>
                                        {canEdit && (
                                            <Checkbox
                                                checked={selectedItems.has(item.id)}
                                                onCheckedChange={() => toggleItemSelection(item.id)}
                                                className="mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity data-[state=checked]:opacity-100"
                                            />
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-1">
                                        <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium border ${typeColorsBg[item.item_type]}`}>
                                            {item.item_type}
                                        </span>
                                        {isLowStock && (
                                            <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-600 border border-red-200">Low</span>
                                        )}
                                        {itemExpired && (
                                            <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-red-100 text-red-700 border border-red-300">Expired</span>
                                        )}
                                        {itemExpiringSoon && !itemExpired && (
                                            <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-600 border border-amber-200">
                                                {daysUntilExpiry === 0 ? 'Today' : `${daysUntilExpiry}d`}
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex items-baseline justify-between mb-1">
                                            <span className={`text-base font-bold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                                                {item.quantity}
                                            </span>
                                            <span className="text-[11px] text-gray-400">{item.unit}</span>
                                        </div>
                                        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all ${
                                                    isLowStock ? 'bg-red-500' : stockPct > 60 ? 'bg-emerald-500' : 'bg-amber-500'
                                                }`}
                                                style={{ width: `${stockPct}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                                        <div>
                                            <span className="text-gray-400">Location</span>
                                            <p className="text-gray-700 font-medium truncate">{item.storage_location || '—'}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Supplier</span>
                                            <p className="text-gray-700 font-medium truncate">{item.supplier || '—'}</p>
                                        </div>
                                        {item.expiry_date && (
                                            <div>
                                                <span className="text-gray-400">Expires</span>
                                                <p className={`font-medium ${itemExpired ? 'text-red-600' : itemExpiringSoon ? 'text-amber-600' : 'text-gray-700'}`}>
                                                    {new Date(item.expiry_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        )}
                                        {item.cost_per_unit > 0 && (
                                            <div>
                                                <span className="text-gray-400">Cost</span>
                                                <p className="text-gray-700 font-medium">${item.cost_per_unit.toFixed(2)}</p>
                                            </div>
                                        )}
                                    </div>

                                    {canEdit && (
                                        <div className="flex items-center gap-1 pt-1.5 border-t border-gray-100">
                                            {item.status === 'archived' ? (
                                                <Button 
                                                    variant="ghost" size="sm"
                                                    className="flex-1 text-xs h-7 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                                    onClick={() => unarchiveMutation.mutate(item.id)}
                                                >
                                                    <RotateCcw className="w-3 h-3 mr-1" /> Restore
                                                </Button>
                                            ) : (
                                                <>
                                                    <Button 
                                                        variant="ghost" size="sm"
                                                        className="flex-1 text-xs h-7 text-gray-600 hover:bg-gray-50 rounded-lg"
                                                        onClick={() => handleEdit(item)}
                                                    >
                                                        <Pencil className="w-3 h-3 mr-1" /> Edit
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" size="sm"
                                                        className="text-xs h-7 w-7 p-0 text-gray-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                                                        onClick={() => handleDuplicate(item)}
                                                        title="Duplicate item"
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" size="sm"
                                                        className={`text-xs h-7 w-7 p-0 rounded-lg ${item.item_condition === 'opened' ? 'text-amber-500 hover:bg-amber-50' : 'text-gray-400 hover:bg-amber-50 hover:text-amber-600'}`}
                                                        onClick={() => toggleOpenedMutation.mutate({ id: item.id, newCondition: item.item_condition === 'opened' ? 'unopened' : 'opened' })}
                                                        title={item.item_condition === 'opened' ? 'Mark as sealed' : 'Mark as opened'}
                                                    >
                                                        <PackageOpen className="w-3 h-3" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" size="sm"
                                                        className="text-xs h-7 w-7 p-0 text-gray-400 hover:bg-gray-50 rounded-lg"
                                                        onClick={() => archiveMutation.mutate(item.id)}
                                                    >
                                                        <Archive className="w-3 h-3" />
                                                    </Button>
                                                </>
                                            )}
                                            <Button 
                                                variant="ghost" size="sm"
                                                className="text-xs h-7 w-7 p-0 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg"
                                                onClick={() => setDeleteConfirm(item)}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* List View — proper data table */
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    {/* Sortable Table Header */}
                    <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide select-none">
                        <div className="col-span-1 flex items-center">
                            {canEdit && (
                                <Checkbox
                                    checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                                    onCheckedChange={selectAll}
                                />
                            )}
                        </div>
                        <div className="col-span-3 flex items-center cursor-pointer hover:text-purple-600" onClick={() => handleSort("item_name")}>
                            Item <SortArrow column="item_name" />
                        </div>
                        <div className="col-span-1 text-center cursor-pointer hover:text-purple-600" onClick={() => handleSort("item_type")}>
                            Type <SortArrow column="item_type" />
                        </div>
                        <div className="col-span-1 text-center cursor-pointer hover:text-purple-600" onClick={() => handleSort("quantity")}>
                            Stock <SortArrow column="quantity" />
                        </div>
                        <div className="col-span-1 cursor-pointer hover:text-purple-600" onClick={() => handleSort("storage_location")}>
                            Location <SortArrow column="storage_location" />
                        </div>
                        <div className="col-span-1 cursor-pointer hover:text-purple-600" onClick={() => handleSort("supplier")}>
                            Supplier <SortArrow column="supplier" />
                        </div>
                        <div className="col-span-1 cursor-pointer hover:text-purple-600" onClick={() => handleSort("expiry_date")}>
                            Expires <SortArrow column="expiry_date" />
                        </div>
                        <div className="col-span-1 cursor-pointer hover:text-purple-600" onClick={() => handleSort("location_id")}>
                            Building <SortArrow column="location_id" />
                        </div>
                        <div className="col-span-2 text-right">Actions</div>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {filteredItems.map((item, idx) => {
                            const isLowStock = item.quantity <= item.low_stock_threshold;
                            const itemExpiringSoon = isExpiringSoon(item.expiry_date);
                            const itemExpired = isExpired(item.expiry_date);

                            return (
                                <div key={item.id} className={`px-4 py-2 transition-colors ${
                                    selectedItems.has(item.id) ? 'bg-purple-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                                } hover:bg-gray-100/50`}>
                                    {/* Desktop row */}
                                    <div className="hidden sm:grid sm:grid-cols-12 gap-2 items-center">
                                        <div className="col-span-1 flex items-center">
                                            {canEdit && (
                                                <Checkbox
                                                    checked={selectedItems.has(item.id)}
                                                    onCheckedChange={() => toggleItemSelection(item.id)}
                                                />
                                            )}
                                        </div>
                                        <div className="col-span-3 min-w-0">
                                            <p className="font-medium text-sm text-gray-900 truncate">
                                                {item.item_name}
                                                {item.item_condition === 'opened' && <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">OPENED</span>}
                                            </p>
                                            {item.sku && <p className="text-[11px] text-gray-400">SKU: {item.sku}</p>}
                                        </div>
                                        <div className="col-span-1 text-center">
                                            <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium border ${typeColorsBg[item.item_type]}`}>
                                                {item.item_type}
                                            </span>
                                        </div>
                                        <div className="col-span-1 flex items-center justify-center gap-1">
                                            {canEdit && item.status === 'active' && (
                                                <button
                                                    onClick={() => item.quantity > 0 && quickQuantityMutation.mutate({ id: item.id, quantity: item.quantity - 1 })}
                                                    disabled={item.quantity <= 0 || quickQuantityMutation.isPending}
                                                    className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-xs disabled:opacity-30 transition-colors"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                            )}
                                            <span className={`text-sm font-bold min-w-[2ch] text-center ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                                                {item.quantity}
                                            </span>
                                            {canEdit && item.status === 'active' && (
                                                <button
                                                    onClick={() => quickQuantityMutation.mutate({ id: item.id, quantity: item.quantity + 1 })}
                                                    disabled={quickQuantityMutation.isPending}
                                                    className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-xs disabled:opacity-30 transition-colors"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="col-span-1 text-xs text-gray-600 truncate">{item.storage_location || '—'}</div>
                                        <div className="col-span-1 text-xs text-gray-600 truncate">{item.supplier || '—'}</div>
                                        <div className="col-span-1">
                                            {item.expiry_date ? (
                                                <span className={`text-xs font-medium ${itemExpired ? 'text-red-600' : itemExpiringSoon ? 'text-amber-600' : 'text-gray-500'}`}>
                                                    {new Date(item.expiry_date).toLocaleDateString()}
                                                </span>
                                            ) : <span className="text-xs text-gray-300">—</span>}
                                        </div>
                                        <div className="col-span-1">
                                            <span className="text-xs text-gray-600 truncate block">
                                                {getLocationName(item.location_id)}
                                            </span>
                                        </div>
                                        <div className="col-span-2 flex justify-end gap-0.5">
                                            {canEdit && (
                                                <>
                                                    {item.status === 'archived' ? (
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-emerald-600"
                                                            onClick={() => unarchiveMutation.mutate(item.id)}>
                                                            <RotateCcw className="w-3.5 h-3.5" />
                                                        </Button>
                                                    ) : (
                                                        <>
                                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500"
                                                                onClick={() => handleEdit(item)}>
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600"
                                                                onClick={() => handleDuplicate(item)} title="Duplicate item">
                                                                <Copy className="w-3.5 h-3.5" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm"
                                                                className={`h-7 w-7 p-0 ${item.item_condition === 'opened' ? 'text-amber-500 hover:text-gray-500' : 'text-gray-400 hover:text-amber-500'}`}
                                                                onClick={() => toggleOpenedMutation.mutate({ id: item.id, newCondition: item.item_condition === 'opened' ? 'unopened' : 'opened' })}
                                                                title={item.item_condition === 'opened' ? 'Mark as sealed' : 'Mark as opened'}>
                                                                <PackageOpen className="w-3.5 h-3.5" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400"
                                                                onClick={() => archiveMutation.mutate(item.id)}>
                                                                <Archive className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </>
                                                    )}
                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                                                        onClick={() => setDeleteConfirm(item)}>
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {/* Mobile row — Name, Stock, Type only */}
                                    <div className="sm:hidden flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 min-w-0">
                                            {canEdit && (
                                                <Checkbox
                                                    checked={selectedItems.has(item.id)}
                                                    onCheckedChange={() => toggleItemSelection(item.id)}
                                                />
                                            )}
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm text-gray-900 truncate">
                                                    {item.item_name}
                                                    {item.item_condition === 'opened' && <span className="ml-1 px-1 py-0.5 rounded text-[9px] font-semibold bg-amber-100 text-amber-700">OPENED</span>}
                                                </p>
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${typeColorsBg[item.item_type]}`}>
                                                    {item.item_type}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {canEdit && item.status === 'active' && (
                                                <button
                                                    onClick={() => item.quantity > 0 && quickQuantityMutation.mutate({ id: item.id, quantity: item.quantity - 1 })}
                                                    disabled={item.quantity <= 0}
                                                    className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center disabled:opacity-30"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                            )}
                                            <span className={`text-sm font-bold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                                                {item.quantity}
                                            </span>
                                            {canEdit && item.status === 'active' && (
                                                <button
                                                    onClick={() => quickQuantityMutation.mutate({ id: item.id, quantity: item.quantity + 1 })}
                                                    className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            )}
                                            {canEdit && (
                                                <>
                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 ml-1"
                                                        onClick={() => handleEdit(item)}>
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600"
                                                        onClick={() => handleDuplicate(item)} title="Duplicate">
                                                        <Copy className="w-3.5 h-3.5" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Forms & Modals */}
            <InventoryForm
                open={showForm}
                onOpenChange={(open) => {
                    setShowForm(open);
                    if (!open) setEditingItem(null);
                }}
                onSuccess={handleSuccess}
                editItem={editingItem}
            />

            <InventoryAuditForm
                open={showAuditForm}
                onOpenChange={setShowAuditForm}
                onSuccess={handleSuccess}
            />

            <BarcodeLabels
                open={showBarcodeLabels}
                onOpenChange={setShowBarcodeLabels}
                items={activeItems}
                locations={locations}
            />

            {showCameraScanner && (
                <CameraScanDialog
                    onClose={() => setShowCameraScanner(false)}
                    items={inventoryItems}
                    locations={locations}
                    onItemFound={(item) => {
                        setSearchQuery(item.item_name || '');
                        setShowCameraScanner(false);
                    }}
                    onLinkBarcode={async (item, barcode) => {
                        try {
                            await entities.InventoryItem.update(item.id, { sku: barcode });
                            queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
                        } catch (err) {
                            console.error('Failed to link barcode:', err);
                        }
                    }}
                    onUpdateQuantity={async (id, quantity, extraFields = {}) => {
                        try {
                            await entities.InventoryItem.update(id, { quantity, ...extraFields });
                            queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
                        } catch (err) {
                            console.error('Failed to update item:', err);
                        }
                    }}
                    onAddToLocation={async (sourceItem, locationId) => {
                        try {
                            // Duplicate the item at the new location with quantity 0
                            const newItemData = {
                                item_name: sourceItem.item_name,
                                item_type: sourceItem.item_type,
                                sku: sourceItem.sku,
                                unit: sourceItem.unit,
                                quantity: 0,
                                low_stock_threshold: sourceItem.low_stock_threshold,
                                reorder_quantity: sourceItem.reorder_quantity,
                                cost_per_unit: sourceItem.cost_per_unit,
                                supplier: sourceItem.supplier,
                                notes: sourceItem.notes,
                                storage_location: sourceItem.storage_location,
                                location_id: locationId,
                                status: 'active',
                                item_condition: 'unopened',
                            };
                            const created = await entities.InventoryItem.create(newItemData);
                            queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
                            return created;
                        } catch (err) {
                            console.error('Failed to add item to location:', err);
                            return null;
                        }
                    }}
                />
            )}

            <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Inventory Item?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{deleteConfirm?.item_name}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteMutation.mutate(deleteConfirm.id)}
                            className="bg-red-600 hover:bg-red-700 rounded-xl"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
