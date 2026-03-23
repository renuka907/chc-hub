function safeParse(v,f=[]){if(v==null)return f;if(typeof v!=="string")return v;try{return JSON.parse(v)}catch{return f}}
import React, { useState, useMemo, useCallback } from "react";
import { entities, getCurrentUser } from "@/api/supabaseHelpers";
import { usePermissions } from "@/components/permissions/usePermissions";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PricingForm from "../components/pricing/PricingForm";
import CategoryManagement from "../components/pricing/CategoryManagement";
import { DollarSign, Plus, Pencil, Star, Tag, Trash2, Printer, Search, X, ChevronDown, ChevronUp, CheckSquare, Square, XCircle, Send, History } from "lucide-react";
import SendQuoteDialog from "../components/quotes/SendQuoteDialog";
import QuoteHistory from "../components/quotes/QuoteHistory";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function PricingManagement() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [showCategoryManagement, setShowCategoryManagement] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [showBulkEdit, setShowBulkEdit] = useState(false);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
    const [bulkProgress, setBulkProgress] = useState(null); // { current, total, action }
    const [showSendQuote, setShowSendQuote] = useState(false);
    const [showQuoteHistory, setShowQuoteHistory] = useState(false);
    const [quotePreselectedItems, setQuotePreselectedItems] = useState([]);
    const queryClient = useQueryClient();

    // Bulk edit dialog state
    const [bulkFields, setBulkFields] = useState({
        updateCategory: false, category: '',
        updateType: false, item_type: '',
        updateTaxable: false, taxable: false,
        updateStatus: false, status: 'active',
        updatePrice: false, priceDirection: 'increase', priceAmount: '', priceMode: '%',
    });

    React.useEffect(() => { getCurrentUser().then(u => { if (u) setCurrentUser(u); }); }, []);

    const { data: pricingItems = [], isLoading } = useQuery({
        queryKey: ['pricingItems'],
        queryFn: () => entities.PricingItem.filter({}),
    });

    const { data: locations = [] } = useQuery({
        queryKey: ['clinicLocations'],
        queryFn: () => entities.ClinicLocation.list(),
    });

    const getItemCats = (item) => {
        // category field is the primary source of truth (set by bulk edit and single edit)
        if (item.category) return [item.category];
        // fallback to categories JSON array for legacy data
        if (item.categories) {
            const parsed = safeParse(item.categories);
            if (parsed.length > 0) return parsed;
        }
        return [];
    };

    const availableCategories = useMemo(() => {
        const cats = new Set();
        pricingItems.forEach(item => getItemCats(item).forEach(c => cats.add(c)));
        return Array.from(cats).sort();
    }, [pricingItems]);

    const filteredItems = useMemo(() => {
        const q = searchQuery.toLowerCase().replace(/[^a-z0-9]/g, '');
        return pricingItems.filter(item => {
            if (item.status && item.status !== 'active') return false;
            if (showFavoritesOnly && !item.is_favorite) return false;
            if (q && !item.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(q) &&
                !(item.description || '').toLowerCase().replace(/[^a-z0-9]/g, '').includes(q)) return false;
            if (selectedCategory !== 'all') {
                const cats = getItemCats(item);
                if (!cats.includes(selectedCategory)) return false;
            }
            return true;
        });
    }, [pricingItems, searchQuery, selectedCategory, showFavoritesOnly]);

    // Group by category for display
    const groupedItems = useMemo(() => {
        const groups = {};
        filteredItems.forEach(item => {
            const cats = getItemCats(item);
            const cat = cats[0] || 'Uncategorized';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(item);
        });
        return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
    }, [filteredItems]);

    const toggleFav = useMutation({
        mutationFn: ({ id, val }) => entities.PricingItem.update(id, { is_favorite: !val }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pricingItems'] }),
    });

    const deleteMut = useMutation({
        mutationFn: (id) => entities.PricingItem.delete(id),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pricingItems'] }); setDeleteConfirm(null); },
    });

    const { can } = usePermissions();
    const canEdit = can('pricing', 'edit') || can('pricing', 'create') || currentUser?.role === 'admin' || currentUser?.role === 'manager';
    const canDelete = can('pricing', 'delete') || currentUser?.role === 'admin';

    const toggleSelect = useCallback((id, e) => {
        e && e.stopPropagation();
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    const selectAll = useCallback(() => {
        if (selectedIds.size === filteredItems.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredItems.map(i => i.id)));
        }
    }, [filteredItems, selectedIds.size]);

    const selectedItems = useMemo(() => pricingItems.filter(i => selectedIds.has(i.id)), [pricingItems, selectedIds]);

    const runBulkEdit = async () => {
        const items = selectedItems;
        setBulkProgress({ current: 0, total: items.length, action: 'Updating' });
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const updates = {};
            if (bulkFields.updateCategory) {
                if (bulkFields.category === '__none__') {
                    updates.category = null;
                    updates.categories = JSON.stringify([]);
                } else {
                    updates.category = bulkFields.category;
                    updates.categories = JSON.stringify([bulkFields.category]);
                }
            }
            if (bulkFields.updateType) updates.item_type = bulkFields.item_type;
            if (bulkFields.updateTaxable) updates.taxable = bulkFields.taxable;
            if (bulkFields.updateStatus) updates.status = bulkFields.status;
            if (bulkFields.updatePrice && bulkFields.priceAmount) {
                const amt = parseFloat(bulkFields.priceAmount);
                if (!isNaN(amt)) {
                    const curPrice = parseFloat(item.price) || 0;
                    let newPrice;
                    if (bulkFields.priceMode === '%') {
                        const delta = curPrice * (amt / 100);
                        newPrice = bulkFields.priceDirection === 'increase' ? curPrice + delta : curPrice - delta;
                    } else {
                        newPrice = bulkFields.priceDirection === 'increase' ? curPrice + amt : curPrice - amt;
                    }
                    updates.price = Math.max(0, Math.round(newPrice * 100) / 100);
                }
            }
            if (Object.keys(updates).length > 0) {
                await entities.PricingItem.update(item.id, updates);
            }
            setBulkProgress({ current: i + 1, total: items.length, action: 'Updating' });
        }
        queryClient.invalidateQueries({ queryKey: ['pricingItems'] });
        setSelectedIds(new Set());
        setShowBulkEdit(false);
        setBulkProgress(null);
        setBulkFields({ updateCategory: false, category: '', updateType: false, item_type: '', updateTaxable: false, taxable: false, updateStatus: false, status: 'active', updatePrice: false, priceDirection: 'increase', priceAmount: '', priceMode: '%' });
    };

    const runBulkDelete = async () => {
        const ids = [...selectedIds];
        setBulkDeleteConfirm(false);
        setBulkProgress({ current: 0, total: ids.length, action: 'Deleting' });
        for (let i = 0; i < ids.length; i++) {
            await entities.PricingItem.delete(ids[i]);
            setBulkProgress({ current: i + 1, total: ids.length, action: 'Deleting' });
        }
        queryClient.invalidateQueries({ queryKey: ['pricingItems'] });
        setSelectedIds(new Set());
        setBulkProgress(null);
    };

    const runBulkFavorite = async (val) => {
        const ids = [...selectedIds];
        setBulkProgress({ current: 0, total: ids.length, action: val ? 'Favoriting' : 'Unfavoriting' });
        for (let i = 0; i < ids.length; i++) {
            await entities.PricingItem.update(ids[i], { is_favorite: val });
            setBulkProgress({ current: i + 1, total: ids.length, action: val ? 'Favoriting' : 'Unfavoriting' });
        }
        queryClient.invalidateQueries({ queryKey: ['pricingItems'] });
        setSelectedIds(new Set());
        setBulkProgress(null);
    };

    const catColors = {
        "Gynecology": "bg-pink-100 text-pink-700",
        "Hormone Therapy": "bg-purple-100 text-purple-700",
        "Mens Health": "bg-blue-100 text-blue-700",
        "Aesthetics": "bg-rose-100 text-rose-700",
        "Body Sculpting": "bg-indigo-100 text-indigo-700",
        "Wellness": "bg-green-100 text-green-700",
        "Syringes": "bg-orange-100 text-orange-700",
        "Treatments": "bg-teal-100 text-teal-700",
        "Product": "bg-emerald-100 text-emerald-700",
        "Uncategorized": "bg-gray-100 text-gray-700",
    };

    const handlePrint = () => {
        const rows = filteredItems.map(item => {
            const tiers = safeParse(item.pricing_tiers);
            const priceStr = tiers.length > 0
                ? tiers.map(t => `${t.tier_name}: $${Number(t.price).toLocaleString()}`).join(' · ')
                : (item.price ? `$${Number(item.price).toLocaleString()}` : '—');
            const cats = getItemCats(item);
            return `<tr style="border-bottom:1px solid #eee;">
                <td style="padding:4px 8px;font-size:11px;">${item.name}</td>
                <td style="padding:4px 8px;font-size:10px;color:#666;">${cats.join(', ')}</td>
                <td style="padding:4px 8px;font-size:11px;text-align:right;font-weight:600;">${priceStr}</td>
            </tr>`;
        }).join('');

        const title = selectedCategory === 'all' ? 'Complete Price List' : `${selectedCategory} — Price List`;
        const w = window.open('', '', 'width=700,height=800');
        w.document.write(`<html><head><style>body{font-family:Arial,sans-serif;margin:20px;}table{width:100%;border-collapse:collapse;}th{text-align:left;border-bottom:2px solid #333;padding:6px 8px;font-size:12px;}@media print{body{margin:10px;}}</style></head><body>
            <h1 style="font-size:18px;margin:0 0 4px;">${title}</h1>
            <p style="font-size:10px;color:#888;margin:0 0 12px;">${new Date().toLocaleDateString()} · ${filteredItems.length} items</p>
            <table><thead><tr><th>Item</th><th>Category</th><th style="text-align:right;">Price</th></tr></thead><tbody>${rows}</tbody></table>
        </body></html>`);
        w.document.close();
        setTimeout(() => w.print(), 250);
    };

    return (
        <div className={`max-w-5xl mx-auto space-y-6 ${selectedIds.size > 0 ? 'pb-20' : ''}`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Pricing</h1>
                        <p className="text-green-200 text-sm mt-1">{pricingItems.length} items · {availableCategories.length} categories</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Button onClick={() => setShowQuoteHistory(!showQuoteHistory)} size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
                            <History className="w-4 h-4 mr-1" /> Quotes
                        </Button>
                        <Button onClick={() => { setQuotePreselectedItems([]); setShowSendQuote(true); }} size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
                            <Send className="w-4 h-4 mr-1" /> Send Quote
                        </Button>
                        <Button onClick={handlePrint} size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
                            <Printer className="w-4 h-4 mr-1" /> Print
                        </Button>
                        {canEdit && (
                            <>
                                <Button onClick={() => setShowCategoryManagement(true)} size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
                                    <Tag className="w-4 h-4 mr-1" /> Categories
                                </Button>
                                <Button onClick={() => { setEditingItem(null); setShowForm(true); }} size="sm" className="bg-white text-green-700 hover:bg-green-50 border-0 font-semibold">
                                    <Plus className="w-4 h-4 mr-1" /> Add Item
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Search + Filters */}
            <div className="space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                            showFavoritesOnly ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        <Star className={`w-3 h-3 ${showFavoritesOnly ? 'fill-white' : ''}`} /> Favorites
                    </button>
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            selectedCategory === 'all' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        All
                    </button>
                    {availableCategories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                selectedCategory === cat ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                    {(searchQuery || selectedCategory !== 'all' || showFavoritesOnly) && (
                        <button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setShowFavoritesOnly(false); }}
                            className="px-3 py-1.5 rounded-full text-xs text-gray-500 hover:bg-gray-100 flex items-center gap-1">
                            <X className="w-3 h-3" /> Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Select All + Results count */}
            <div className="flex items-center gap-3">
                {canEdit && filteredItems.length > 0 && (
                    <button onClick={selectAll} className="flex items-center gap-2 text-xs text-gray-500 hover:text-green-600 transition-colors">
                        {selectedIds.size === filteredItems.length && filteredItems.length > 0
                            ? <CheckSquare className="w-4 h-4 text-teal-500" />
                            : <Square className="w-4 h-4" />}
                        {selectedIds.size === filteredItems.length && filteredItems.length > 0 ? 'Deselect All' : 'Select All'}
                    </button>
                )}
                {filteredItems.length !== pricingItems.length && (
                    <p className="text-xs text-gray-500">{filteredItems.length} of {pricingItems.length} items shown</p>
                )}
            </div>

            {/* Items */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No pricing items found.</div>
            ) : (
                <div className="space-y-6">
                    {groupedItems.map(([category, items]) => (
                        <div key={category}>
                            <div className="flex items-center gap-2 mb-3">
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${catColors[category] || 'bg-gray-100 text-gray-700'}`}>
                                    {category}
                                </span>
                                <span className="text-xs text-gray-400">{items.length}</span>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                                {items.map(item => {
                                    const tiers = safeParse(item.pricing_tiers);
                                    const mainPrice = tiers.length > 0 ? tiers[0].price : item.price;
                                    const isExpanded = expandedId === item.id;

                                    return (
                                        <div key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                            <div
                                                className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                                                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                                            >
                                                {/* Bulk checkbox */}
                                                {canEdit && (
                                                    <button onClick={e => toggleSelect(item.id, e)} className="shrink-0">
                                                        {selectedIds.has(item.id)
                                                            ? <CheckSquare className="w-4 h-4 text-teal-500" />
                                                            : <Square className="w-4 h-4 text-gray-300 hover:text-teal-400" />}
                                                    </button>
                                                )}

                                                {/* Favorite star */}
                                                <button onClick={e => { e.stopPropagation(); toggleFav.mutate({ id: item.id, val: item.is_favorite }); }}
                                                    className="shrink-0">
                                                    <Star className={`w-4 h-4 ${item.is_favorite ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`} />
                                                </button>

                                                {/* Name + type */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-gray-900 truncate">{item.name}</span>
                                                        {item.item_type && (
                                                            <span className="text-[10px] text-gray-400 shrink-0">{item.item_type}</span>
                                                        )}
                                                    </div>
                                                    {item.description && (
                                                        <p className="text-xs text-gray-500 truncate mt-0.5">{item.description}</p>
                                                    )}
                                                </div>

                                                {/* Price */}
                                                <div className="shrink-0 text-right">
                                                    {mainPrice != null ? (
                                                        <span className="font-bold text-green-600">${Number(mainPrice).toLocaleString()}</span>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">—</span>
                                                    )}
                                                    {tiers.length > 1 && (
                                                        <p className="text-[10px] text-gray-400">+{tiers.length - 1} tiers</p>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-1 shrink-0">
                                                    {canEdit && (
                                                        <>
                                                            <button onClick={e => { e.stopPropagation(); setEditingItem(item); setShowForm(true); }}
                                                                className="p-1.5 hover:bg-gray-200 rounded-lg">
                                                                <Pencil className="w-3.5 h-3.5 text-gray-400" />
                                                            </button>
                                                            <button onClick={e => { e.stopPropagation(); setDeleteConfirm(item); }}
                                                                className="p-1.5 hover:bg-red-50 rounded-lg">
                                                                <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                                </div>
                                            </div>

                                            {/* Expanded */}
                                            {isExpanded && (
                                                <div className="px-4 pb-4 pt-1 bg-gray-50/80 border-t border-gray-100">
                                                    {item.description && (
                                                        <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                                                    )}

                                                    {tiers.length > 0 && (
                                                        <div className="mb-3">
                                                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Pricing Tiers</p>
                                                            <div className="grid sm:grid-cols-2 gap-2">
                                                                {tiers.map((tier, i) => (
                                                                    <div key={i} className="bg-white rounded-lg border border-gray-200 p-2.5 flex justify-between items-center">
                                                                        <div>
                                                                            <p className="font-medium text-gray-900 text-sm">{tier.tier_name}</p>
                                                                            {tier.sessions > 1 && (
                                                                                <p className="text-xs text-gray-500">{tier.sessions} {tier.unit_type || 'sessions'}</p>
                                                                            )}
                                                                        </div>
                                                                        <span className="font-bold text-green-600">${Number(tier.price).toLocaleString()}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                                        {item.taxable && <span>💰 Taxable</span>}
                                                        {item.area_based && <span>📐 Area-based</span>}
                                                        {getItemCats(item).length > 1 && (
                                                            <span>🏷️ {getItemCats(item).join(', ')}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <PricingForm open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditingItem(null); }}
                onSuccess={() => { queryClient.invalidateQueries({ queryKey: ['pricingItems'] }); setEditingItem(null); }}
                editItem={editingItem} />

            <CategoryManagement open={showCategoryManagement} onOpenChange={setShowCategoryManagement} />

            <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Pricing Item?</AlertDialogTitle>
                        <AlertDialogDescription>Delete "{deleteConfirm?.name}"? This can't be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMut.mutate(deleteConfirm.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Action Bar */}
            {canEdit && selectedIds.size > 0 && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-4 max-w-xl">
                    <span className="text-sm font-medium whitespace-nowrap">{selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected</span>
                    <div className="h-5 w-px bg-gray-600" />
                    <Button size="sm" onClick={() => setShowBulkEdit(true)} className="bg-teal-600 hover:bg-teal-700 text-white border-0 text-xs">
                        <Pencil className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button size="sm" onClick={() => setBulkDeleteConfirm(true)} className="bg-red-600 hover:bg-red-700 text-white border-0 text-xs">
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                    </Button>
                    <Button size="sm" onClick={() => runBulkFavorite(true)} className="bg-yellow-600 hover:bg-yellow-700 text-white border-0 text-xs">
                        <Star className="w-3 h-3 mr-1 fill-white" /> Fav
                    </Button>
                    <Button size="sm" onClick={() => runBulkFavorite(false)} className="bg-gray-600 hover:bg-gray-700 text-white border-0 text-xs">
                        <Star className="w-3 h-3 mr-1" /> Unfav
                    </Button>
                    <button onClick={() => setSelectedIds(new Set())} className="p-1 hover:bg-gray-700 rounded-lg ml-1">
                        <XCircle className="w-4 h-4 text-gray-400 hover:text-white" />
                    </button>
                </div>
            )}

            {/* Bulk Progress Overlay */}
            {bulkProgress && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-6 shadow-xl text-center min-w-[280px]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-3" />
                        <p className="font-medium text-gray-900">{bulkProgress.action} {bulkProgress.current} of {bulkProgress.total}...</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                            <div className="bg-green-600 h-2 rounded-full transition-all" style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }} />
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Delete Confirm */}
            <AlertDialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {selectedIds.size} Items?</AlertDialogTitle>
                        <AlertDialogDescription>Delete {selectedIds.size} items? This can't be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={runBulkDelete} className="bg-red-600 hover:bg-red-700">Delete All</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Edit Dialog */}
            {showBulkEdit && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowBulkEdit(false)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Edit {selectedIds.size} Items</h2>

                        <div className="space-y-4">
                            {/* Category */}
                            <label className="flex items-start gap-3">
                                <input type="checkbox" checked={bulkFields.updateCategory} onChange={e => setBulkFields(p => ({ ...p, updateCategory: e.target.checked }))}
                                    className="mt-1 accent-teal-600 w-4 h-4" />
                                <div className="flex-1">
                                    <span className="text-sm font-medium text-gray-700">Update Category</span>
                                    {bulkFields.updateCategory && (
                                        <select value={bulkFields.category} onChange={e => setBulkFields(p => ({ ...p, category: e.target.value }))}
                                            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                                            <option value="">Select category...</option>
                                            <option value="__none__">— Remove Category —</option>
                                            {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    )}
                                </div>
                            </label>

                            {/* Item Type */}
                            <label className="flex items-start gap-3">
                                <input type="checkbox" checked={bulkFields.updateType} onChange={e => setBulkFields(p => ({ ...p, updateType: e.target.checked }))}
                                    className="mt-1 accent-teal-600 w-4 h-4" />
                                <div className="flex-1">
                                    <span className="text-sm font-medium text-gray-700">Update Type</span>
                                    {bulkFields.updateType && (
                                        <select value={bulkFields.item_type} onChange={e => setBulkFields(p => ({ ...p, item_type: e.target.value }))}
                                            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                                            <option value="">Select type...</option>
                                            {['Procedure', 'Product', 'Treatment', 'Service', 'Package', 'Lab Test'].map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    )}
                                </div>
                            </label>

                            {/* Taxable */}
                            <label className="flex items-start gap-3">
                                <input type="checkbox" checked={bulkFields.updateTaxable} onChange={e => setBulkFields(p => ({ ...p, updateTaxable: e.target.checked }))}
                                    className="mt-1 accent-teal-600 w-4 h-4" />
                                <div className="flex-1">
                                    <span className="text-sm font-medium text-gray-700">Update Taxable</span>
                                    {bulkFields.updateTaxable && (
                                        <div className="mt-1 flex items-center gap-2">
                                            <button onClick={() => setBulkFields(p => ({ ...p, taxable: !p.taxable }))}
                                                className={`relative w-10 h-5 rounded-full transition-colors ${bulkFields.taxable ? 'bg-teal-500' : 'bg-gray-300'}`}>
                                                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${bulkFields.taxable ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                            </button>
                                            <span className="text-sm text-gray-600">{bulkFields.taxable ? 'Taxable' : 'Not Taxable'}</span>
                                        </div>
                                    )}
                                </div>
                            </label>

                            {/* Status */}
                            <label className="flex items-start gap-3">
                                <input type="checkbox" checked={bulkFields.updateStatus} onChange={e => setBulkFields(p => ({ ...p, updateStatus: e.target.checked }))}
                                    className="mt-1 accent-teal-600 w-4 h-4" />
                                <div className="flex-1">
                                    <span className="text-sm font-medium text-gray-700">Update Status</span>
                                    {bulkFields.updateStatus && (
                                        <select value={bulkFields.status} onChange={e => setBulkFields(p => ({ ...p, status: e.target.value }))}
                                            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    )}
                                </div>
                            </label>

                            {/* Price Adjustment */}
                            <label className="flex items-start gap-3">
                                <input type="checkbox" checked={bulkFields.updatePrice} onChange={e => setBulkFields(p => ({ ...p, updatePrice: e.target.checked }))}
                                    className="mt-1 accent-teal-600 w-4 h-4" />
                                <div className="flex-1">
                                    <span className="text-sm font-medium text-gray-700">Adjust Prices</span>
                                    {bulkFields.updatePrice && (
                                        <div className="mt-2 space-y-2">
                                            <div className="flex gap-2">
                                                <select value={bulkFields.priceDirection} onChange={e => setBulkFields(p => ({ ...p, priceDirection: e.target.value }))}
                                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                                                    <option value="increase">Increase by</option>
                                                    <option value="decrease">Decrease by</option>
                                                </select>
                                                <Input type="number" placeholder="Amount" value={bulkFields.priceAmount}
                                                    onChange={e => setBulkFields(p => ({ ...p, priceAmount: e.target.value }))}
                                                    className="w-24 text-sm" />
                                                <select value={bulkFields.priceMode} onChange={e => setBulkFields(p => ({ ...p, priceMode: e.target.value }))}
                                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                                                    <option value="%">%</option>
                                                    <option value="$">$</option>
                                                </select>
                                            </div>
                                            {/* Preview */}
                                            {bulkFields.priceAmount && selectedItems.slice(0, 3).map(item => {
                                                const cur = parseFloat(item.price) || 0;
                                                const amt = parseFloat(bulkFields.priceAmount) || 0;
                                                let newP;
                                                if (bulkFields.priceMode === '%') {
                                                    const d = cur * (amt / 100);
                                                    newP = bulkFields.priceDirection === 'increase' ? cur + d : cur - d;
                                                } else {
                                                    newP = bulkFields.priceDirection === 'increase' ? cur + amt : cur - amt;
                                                }
                                                newP = Math.max(0, Math.round(newP * 100) / 100);
                                                return (
                                                    <p key={item.id} className="text-xs text-gray-500">
                                                        {item.name}: ${cur.toLocaleString()} → <span className="font-semibold text-green-600">${newP.toLocaleString()}</span>
                                                    </p>
                                                );
                                            })}
                                            {selectedItems.length > 3 && <p className="text-xs text-gray-400">...and {selectedItems.length - 3} more</p>}
                                        </div>
                                    )}
                                </div>
                            </label>
                        </div>

                        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
                            <Button variant="outline" onClick={() => setShowBulkEdit(false)}>Cancel</Button>
                            <Button onClick={runBulkEdit} className="bg-green-600 hover:bg-green-700 text-white"
                                disabled={!(bulkFields.updateCategory || bulkFields.updateType || bulkFields.updateTaxable || bulkFields.updateStatus || bulkFields.updatePrice)}>
                                Apply Changes
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quote History Panel */}
            {showQuoteHistory && (
                <div className="mt-4 bg-white rounded-xl border shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <History className="w-4 h-4 text-purple-600" /> Sent Quotes
                        </h3>
                        <Button size="sm" variant="ghost" onClick={() => setShowQuoteHistory(false)} className="h-7 text-xs">
                            <X className="w-3 h-3" />
                        </Button>
                    </div>
                    <QuoteHistory />
                </div>
            )}

            {/* Send Quote Dialog */}
            <SendQuoteDialog
                open={showSendQuote}
                onOpenChange={setShowSendQuote}
                preselectedItems={quotePreselectedItems}
            />
        </div>
    );
}
