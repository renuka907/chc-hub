function safeParse(v,f=[]){if(v==null)return f;if(typeof v!=="string")return v;try{return JSON.parse(v)}catch{return f}}
import React, { useState, useMemo } from "react";
import { entities, getCurrentUser } from "@/api/supabaseHelpers";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DiscountForm from "../components/discounts/DiscountForm";
import { Percent, Plus, Pencil, Trash2, Search, X, ChevronDown, ChevronUp, Tag } from "lucide-react";
import { format } from "date-fns";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function DiscountManagement() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("active");
    const [showForm, setShowForm] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const queryClient = useQueryClient();

    React.useEffect(() => { getCurrentUser().then(u => { if (u) setCurrentUser(u); }); }, []);

    const { data: discounts = [], isLoading } = useQuery({
        queryKey: ['discounts'],
        queryFn: () => entities.Discount.list('-created_at', 200),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => entities.Discount.delete(id),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['discounts'] }); setDeleteConfirm(null); },
    });

    const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'manager';

    const typeLabels = { percentage: "% Off", fixed_amount: "$ Off", bogo: "BOGO" };
    const typeColors = { percentage: "bg-blue-100 text-blue-700", fixed_amount: "bg-green-100 text-green-700", bogo: "bg-purple-100 text-purple-700" };
    const statusColors = { active: "text-green-600", inactive: "text-gray-400", expired: "text-red-500" };

    const getDisplay = (d) => d.discount_type === "percentage" ? `${d.discount_value}%` : d.discount_type === "fixed_amount" ? `$${d.discount_value}` : "BOGO";

    const filteredDiscounts = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return discounts.filter(d => {
            if (q && !d.name.toLowerCase().includes(q) && !(d.code || '').toLowerCase().includes(q)) return false;
            if (selectedType !== 'all' && d.discount_type !== selectedType) return false;
            if (selectedStatus !== 'all' && d.status !== selectedStatus) return false;
            return true;
        });
    }, [discounts, searchQuery, selectedType, selectedStatus]);

    const activeCount = discounts.filter(d => d.status === 'active').length;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Percent className="w-6 h-6" /> Discounts
                        </h1>
                        <p className="text-purple-200 text-sm mt-1">{activeCount} active · {discounts.length} total</p>
                    </div>
                    {canEdit && (
                        <Button onClick={() => { setEditingDiscount(null); setShowForm(true); }} size="sm" className="bg-white text-purple-700 hover:bg-purple-50 border-0 font-semibold">
                            <Plus className="w-4 h-4 mr-1" /> Create Discount
                        </Button>
                    )}
                </div>
            </div>

            {/* Search + Filters */}
            <div className="space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input placeholder="Search by name or code..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
                <div className="flex flex-wrap gap-2">
                    {["all", "active", "inactive", "expired"].map(s => (
                        <button key={s} onClick={() => setSelectedStatus(s)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedStatus === s ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            {s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                    <span className="w-px h-6 bg-gray-200 self-center" />
                    {["all", "percentage", "fixed_amount", "bogo"].map(t => (
                        <button key={t} onClick={() => setSelectedType(t)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedType === t ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            {t === 'all' ? 'All Types' : typeLabels[t]}
                        </button>
                    ))}
                    {(searchQuery || selectedType !== 'all' || selectedStatus !== 'active') && (
                        <button onClick={() => { setSearchQuery(''); setSelectedType('all'); setSelectedStatus('active'); }}
                            className="px-3 py-1.5 rounded-full text-xs text-gray-500 hover:bg-gray-100 flex items-center gap-1">
                            <X className="w-3 h-3" /> Clear
                        </button>
                    )}
                </div>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
                </div>
            ) : filteredDiscounts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No discounts found.</div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                    {filteredDiscounts.map(discount => {
                        const isExpanded = expandedId === discount.id;
                        return (
                            <div key={discount.id} className="hover:bg-gray-50/50 transition-colors">
                                <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : discount.id)}>
                                    {/* Discount badge */}
                                    <div className={`shrink-0 w-14 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${typeColors[discount.discount_type] || 'bg-gray-100 text-gray-700'}`}>
                                        {getDisplay(discount)}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-900 truncate">{discount.name}</span>
                                            <span className={`text-xs font-medium ${statusColors[discount.status] || 'text-gray-400'}`}>
                                                ● {discount.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                            {discount.code && <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{discount.code}</span>}
                                            {discount.valid_to && <span>Expires {format(new Date(discount.valid_to), 'MMM d, yyyy')}</span>}
                                        </div>
                                    </div>

                                    {/* Usage */}
                                    <div className="shrink-0 text-right hidden sm:block">
                                        <span className="text-xs text-gray-500">{discount.current_uses || 0} uses</span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        {canEdit && (
                                            <>
                                                <button onClick={e => { e.stopPropagation(); setEditingDiscount(discount); setShowForm(true); }} className="p-1.5 hover:bg-gray-200 rounded-lg">
                                                    <Pencil className="w-3.5 h-3.5 text-gray-400" />
                                                </button>
                                                <button onClick={e => { e.stopPropagation(); setDeleteConfirm(discount); }} className="p-1.5 hover:bg-red-50 rounded-lg">
                                                    <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                                                </button>
                                            </>
                                        )}
                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="px-4 pb-4 pt-1 bg-gray-50/80 border-t border-gray-100">
                                        {discount.description && <p className="text-sm text-gray-600 mb-3">{discount.description}</p>}
                                        <div className="grid sm:grid-cols-2 gap-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Type</span>
                                                <span className="font-medium">{typeLabels[discount.discount_type]}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Applies To</span>
                                                <span className="font-medium">
                                                    {discount.applicable_to === 'all_items' ? 'All Items' : discount.applicable_to === 'specific_items' ? 'Specific Items' : 'Categories'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Valid</span>
                                                <span className="font-medium">
                                                    {discount.valid_from ? format(new Date(discount.valid_from), 'MMM d') : '—'} → {discount.valid_to ? format(new Date(discount.valid_to), 'MMM d, yyyy') : 'No end'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Usage</span>
                                                <span className="font-medium">{discount.current_uses || 0} / {discount.max_uses || '∞'}</span>
                                            </div>
                                            {(discount.total_discount_amount || 0) > 0 && (
                                                <div className="flex justify-between sm:col-span-2">
                                                    <span className="text-gray-500">Total Discounted</span>
                                                    <span className="font-bold text-purple-600">${(discount.total_discount_amount || 0).toLocaleString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <DiscountForm open={showForm} onOpenChange={open => { setShowForm(open); if (!open) setEditingDiscount(null); }}
                onSuccess={() => { queryClient.invalidateQueries({ queryKey: ['discounts'] }); setEditingDiscount(null); }}
                editDiscount={editingDiscount} />

            <AlertDialog open={!!deleteConfirm} onOpenChange={open => !open && setDeleteConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Discount?</AlertDialogTitle>
                        <AlertDialogDescription>Delete "{deleteConfirm?.name}"? This can't be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(deleteConfirm.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
