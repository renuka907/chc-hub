import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SearchBar from "../components/SearchBar";
import InventoryForm from "../components/inventory/InventoryForm";
import InventoryAuditForm from "../components/inventory/InventoryAuditForm";
import { Package, Plus, Pencil, Trash2, AlertTriangle, TrendingDown, Calendar, Settings, ClipboardCheck } from "lucide-react";
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

export default function InventoryManagement() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState("all");
    const [selectedLocation, setSelectedLocation] = useState("all");
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);
    const [showExpiringOnly, setShowExpiringOnly] = useState(false);
    const [expiryThresholdDays, setExpiryThresholdDays] = useState(30);
    const [showForm, setShowForm] = useState(false);
    const [showAuditForm, setShowAuditForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const queryClient = useQueryClient();

    React.useEffect(() => {
        base44.auth.me().then(user => setCurrentUser(user)).catch(() => {});
    }, []);

    const { data: inventoryItems = [], isLoading } = useQuery({
        queryKey: ['inventoryItems'],
        queryFn: () => base44.entities.InventoryItem.list('-updated_date', 500),
        refetchInterval: 30000,
        refetchOnWindowFocus: false,
        retry: 1,
    });

    const { data: locations = [] } = useQuery({
        queryKey: ['clinicLocations'],
        queryFn: () => base44.entities.ClinicLocation.list(),
    });

    const { data: pricingItems = [] } = useQuery({
        queryKey: ['pricingItems'],
        queryFn: () => base44.entities.PricingItem.list(),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.InventoryItem.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
            setDeleteConfirm(null);
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

    const normalizeText = (text) => text.toLowerCase().replace(/[-.\s]/g, '');

    const isExpiringSoon = (expiryDate) => {
        if (!expiryDate) return false;
        const today = new Date();
        const expiry = new Date(expiryDate);
        const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry >= 0 && daysUntilExpiry <= expiryThresholdDays;
    };

    const filteredItems = inventoryItems.filter(item => {
        const normalizedQuery = normalizeText(searchQuery);
        const matchesSearch = !normalizedQuery || 
            normalizeText(item.item_name).includes(normalizedQuery) ||
            normalizeText(item.sku || '').includes(normalizedQuery) ||
            normalizeText(item.notes || '').includes(normalizedQuery) ||
            normalizeText(item.supplier || '').includes(normalizedQuery) ||
            normalizeText(item.storage_location || '').includes(normalizedQuery);
        
        const matchesType = selectedType === "all" || item.item_type === selectedType;
        const matchesLocation = selectedLocation === "all" || item.location_id === selectedLocation;
        const matchesLowStock = !showLowStockOnly || (item.quantity <= item.low_stock_threshold);
        const matchesExpiring = !showExpiringOnly || isExpiringSoon(item.expiry_date);
        const isActive = item.status === 'active';
        
        return matchesSearch && matchesType && matchesLocation && matchesLowStock && matchesExpiring && isActive;
    });

    const lowStockCount = inventoryItems.filter(item => 
        item.quantity <= item.low_stock_threshold && item.status === 'active'
    ).length;

    const expiringCount = inventoryItems.filter(item => 
        item.status === 'active' && isExpiringSoon(item.expiry_date)
    ).length;

    const totalValue = inventoryItems
        .filter(item => item.status === 'active')
        .reduce((sum, item) => sum + ((item.cost_per_unit || 0) * item.quantity), 0);

    const typeColors = {
        "Product": "bg-green-100 text-green-800",
        "Supply": "bg-blue-100 text-blue-800",
        "Equipment": "bg-purple-100 text-purple-800",
        "Medication": "bg-red-100 text-red-800"
    };

    const getLocationName = (locationId) => {
        const location = locations.find(loc => loc.id === locationId);
        return location?.name || "N/A";
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

    const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'manager';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-3xl p-6 shadow-md">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                            <Package className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
                            <p className="text-gray-600">Track stock levels and manage supplies</p>
                        </div>
                    </div>
                    {canEdit && (
                        <div className="flex gap-3">
                            <Button 
                                onClick={() => setShowAuditForm(true)} 
                                variant="outline"
                                className="border-orange-600 text-orange-600 hover:bg-orange-50"
                            >
                                <ClipboardCheck className="w-4 h-4 mr-2" />
                                Daily Audit
                            </Button>
                            <Button onClick={() => { setEditingItem(null); setShowForm(true); }} className="bg-orange-600 hover:bg-orange-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Item
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Items</p>
                                <p className="text-2xl font-bold text-gray-900">{inventoryItems.filter(i => i.status === 'active').length}</p>
                            </div>
                            <Package className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Low Stock Alerts</p>
                                <p className="text-2xl font-bold text-red-600">{lowStockCount}</p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card className={expiringCount > 0 ? 'border-2 border-amber-300' : ''}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Expiring Soon</p>
                                <p className="text-2xl font-bold text-amber-600">{expiringCount}</p>
                            </div>
                            <Calendar className="w-8 h-8 text-amber-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Value</p>
                                <p className="text-2xl font-bold text-green-600">${totalValue.toLocaleString()}</p>
                            </div>
                            <TrendingDown className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="bg-white rounded-3xl p-6 shadow-md">
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search inventory items..."
                />
            </div>

            {/* Expiry Threshold Config */}
            <div className="bg-white rounded-3xl p-6 shadow-md">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Settings className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Expiry Alert Threshold:</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min="1"
                            max="365"
                            value={expiryThresholdDays}
                            onChange={(e) => setExpiryThresholdDays(parseInt(e.target.value) || 30)}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900"
                        />
                        <span className="text-sm text-gray-600">days before expiry</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-3xl p-6 shadow-md">
                <div className="flex flex-wrap gap-3 items-center">
                    <button
                        onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                        className={`px-6 py-2.5 rounded-2xl text-sm font-medium transition-all flex items-center gap-2 ${
                            showLowStockOnly 
                                ? "bg-red-500 text-white shadow-md" 
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                        <AlertTriangle className="w-4 h-4" />
                        Low Stock
                    </button>
                    <button
                        onClick={() => setShowExpiringOnly(!showExpiringOnly)}
                        className={`px-6 py-2.5 rounded-2xl text-sm font-medium transition-all flex items-center gap-2 ${
                            showExpiringOnly 
                                ? "bg-amber-500 text-white shadow-md" 
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                        <Calendar className="w-4 h-4" />
                        Expiring Soon
                    </button>
                    <div className="w-px h-6 bg-gray-300" />
                    {["all", "Product", "Supply", "Equipment", "Medication"].map(type => (
                        <button
                            key={type}
                            onClick={() => setSelectedType(type)}
                            className={`px-6 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                                selectedType === type 
                                    ? "bg-orange-600 text-white shadow-md" 
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                            {type === "all" ? "All Types" : type}
                        </button>
                    ))}
                    <div className="w-px h-6 bg-gray-300" />
                    <button
                        onClick={() => setSelectedLocation("all")}
                        className={`px-6 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                            selectedLocation === "all" 
                                ? "bg-orange-600 text-white shadow-md" 
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                        All Locations
                    </button>
                    {locations.filter(loc => loc.status === 'active').map(location => (
                        <button
                            key={location.id}
                            onClick={() => setSelectedLocation(location.id)}
                            className={`px-6 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                                selectedLocation === location.id 
                                    ? "bg-orange-600 text-white shadow-md" 
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                            {location.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Inventory Items Grouped by Location */}
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                </div>
            ) : filteredItems.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No inventory items found</p>
                        <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-8">
                    {(() => {
                        // Group items by location
                        const itemsByLocation = {};
                        filteredItems.forEach(item => {
                            const locationName = getLocationName(item.location_id);
                            if (!itemsByLocation[locationName]) {
                                itemsByLocation[locationName] = [];
                            }
                            itemsByLocation[locationName].push(item);
                        });

                        return Object.entries(itemsByLocation).map(([locationName, items]) => (
                            <div key={locationName}>
                                {/* Location Header */}
                                <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-2xl p-4 mb-4 shadow-md">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Package className="w-6 h-6" />
                                            <div>
                                                <h2 className="text-2xl font-bold">{locationName}</h2>
                                                <p className="text-orange-100 text-sm">{items.length} items</p>
                                            </div>
                                        </div>
                                        {items.filter(i => i.quantity <= i.low_stock_threshold).length > 0 && (
                                            <Badge className="bg-red-500 text-white border-0">
                                                <AlertTriangle className="w-3 h-3 mr-1" />
                                                {items.filter(i => i.quantity <= i.low_stock_threshold).length} Low Stock
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Items Grid */}
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {items.map(item => {
                                        const isLowStock = item.quantity <= item.low_stock_threshold;
                                        const itemExpiringSoon = isExpiringSoon(item.expiry_date);
                                        const daysUntilExpiry = item.expiry_date ? Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                                        const associatedServices = getPricingItemNames(item.associated_pricing_item_ids);
                                        
                                        return (
                                            <Card key={item.id} className={`hover:shadow-lg transition-all duration-300 border-2 ${
                                                isLowStock && itemExpiringSoon ? 'border-red-500 bg-red-50' : 
                                                isLowStock ? 'border-red-300 bg-red-50' : 
                                                itemExpiringSoon ? 'border-amber-300 bg-amber-50' : ''
                                            }`}>
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex flex-wrap gap-2">
                                                            <Badge className={typeColors[item.item_type]}>
                                                                {item.item_type}
                                                            </Badge>
                                                            {isLowStock && (
                                                                <Badge className="bg-red-500 text-white">
                                                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                                                    Low Stock
                                                                </Badge>
                                                            )}
                                                            {itemExpiringSoon && daysUntilExpiry !== null && (
                                                                <Badge className="bg-amber-500 text-white">
                                                                    <Calendar className="w-3 h-3 mr-1" />
                                                                    {daysUntilExpiry === 0 ? 'Expires Today' : `${daysUntilExpiry}d`}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <CardTitle className="text-lg mb-1">{item.item_name}</CardTitle>
                                                    {item.sku && (
                                                        <div className="text-xs text-gray-500">SKU: {item.sku}</div>
                                                    )}
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-2">
                                                        <div className="bg-gray-50 rounded-lg p-3">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-xs text-gray-600">Stock:</span>
                                                                <span className={`text-xl font-bold ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                                                                    {item.quantity} {item.unit}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-gray-600">Alert at:</span>
                                                                <span className="font-medium">{item.low_stock_threshold} {item.unit}</span>
                                                            </div>
                                                            {item.storage_location && (
                                                                <div className="flex justify-between text-xs mt-1 pt-1 border-t border-gray-200">
                                                                    <span className="text-gray-600">Location:</span>
                                                                    <span className="font-semibold text-orange-600">{item.storage_location}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="text-xs space-y-1">
                                                            {item.cost_per_unit && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Cost:</span>
                                                                    <span className="font-medium">${item.cost_per_unit}/{item.unit}</span>
                                                                </div>
                                                            )}
                                                            {item.supplier && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Supplier:</span>
                                                                    <span className="font-medium text-right ml-2">{item.supplier}</span>
                                                                </div>
                                                            )}
                                                            {item.expiry_date && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Expires:</span>
                                                                    <span className={`font-medium ${itemExpiringSoon ? 'text-amber-600' : ''}`}>
                                                                        {new Date(item.expiry_date).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {associatedServices.length > 0 && (
                                                            <div>
                                                                <div className="text-xs text-gray-600 mb-1">Used in:</div>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {associatedServices.slice(0, 2).map((service, idx) => (
                                                                        <Badge key={idx} variant="outline" className="text-xs">
                                                                            {service}
                                                                        </Badge>
                                                                    ))}
                                                                    {associatedServices.length > 2 && (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            +{associatedServices.length - 2}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {canEdit && (
                                                            <div className="flex gap-2 pt-2 border-t">
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="sm"
                                                                    className="flex-1"
                                                                    onClick={() => handleEdit(item)}
                                                                >
                                                                    <Pencil className="w-3 h-3 mr-1" />
                                                                    Edit
                                                                </Button>
                                                                <Button 
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    onClick={() => setDeleteConfirm(item)}
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        ));
                    })()}
                </div>
            )}

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

            <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Inventory Item?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{deleteConfirm?.item_name}"? This action cannot be undone.
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