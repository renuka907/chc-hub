import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SearchBar from "../components/SearchBar";
import DiscountForm from "../components/discounts/DiscountForm";
import { Percent, Plus, Pencil, Trash2, TrendingDown, DollarSign, Tag } from "lucide-react";
import { format } from "date-fns";
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

export default function DiscountManagement() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("active");
    const [showForm, setShowForm] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const queryClient = useQueryClient();

    React.useEffect(() => {
        base44.auth.me().then(user => setCurrentUser(user)).catch(() => {});
    }, []);

    const { data: discounts = [], isLoading } = useQuery({
        queryKey: ['discounts'],
        queryFn: () => base44.entities.Discount.list('-created_date', 200),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.Discount.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['discounts'] });
            setDeleteConfirm(null);
        },
    });

    const handleSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['discounts'] });
        setEditingDiscount(null);
    };

    const handleEdit = (discount) => {
        setEditingDiscount(discount);
        setShowForm(true);
    };

    const filteredDiscounts = discounts.filter(discount => {
        const matchesSearch = discount.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (discount.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (discount.code || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = selectedType === "all" || discount.discount_type === selectedType;
        const matchesStatus = selectedStatus === "all" || discount.status === selectedStatus;
        return matchesSearch && matchesType && matchesStatus;
    });

    const typeColors = {
        "percentage": "bg-blue-100 text-blue-800",
        "fixed_amount": "bg-green-100 text-green-800",
        "bogo": "bg-purple-100 text-purple-800"
    };

    const statusColors = {
        "active": "bg-green-100 text-green-800",
        "inactive": "bg-gray-100 text-gray-800",
        "expired": "bg-red-100 text-red-800"
    };

    const typeLabels = {
        "percentage": "Percentage Off",
        "fixed_amount": "Fixed Amount",
        "bogo": "Buy One Get One"
    };

    const getDiscountDisplay = (discount) => {
        if (discount.discount_type === "percentage") {
            return `${discount.discount_value}% OFF`;
        } else if (discount.discount_type === "fixed_amount") {
            return `$${discount.discount_value} OFF`;
        } else {
            return "BOGO";
        }
    };

    const totalDiscountValue = filteredDiscounts.reduce((sum, d) => sum + (d.total_discount_amount || 0), 0);
    const totalUses = filteredDiscounts.reduce((sum, d) => sum + (d.current_uses || 0), 0);

    const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'manager';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-3xl p-6 shadow-md">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                            <Percent className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Discount Management</h1>
                            <p className="text-gray-600">Create and manage discounts and promotions</p>
                        </div>
                    </div>
                    {canEdit && (
                        <Button onClick={() => { setEditingDiscount(null); setShowForm(true); }} className="bg-purple-600 hover:bg-purple-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Discount
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-600 font-medium">Active Discounts</p>
                                <p className="text-3xl font-bold text-blue-900">
                                    {discounts.filter(d => d.status === 'active').length}
                                </p>
                            </div>
                            <Tag className="w-10 h-10 text-blue-600 opacity-50" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-600 font-medium">Total Uses</p>
                                <p className="text-3xl font-bold text-green-900">{totalUses}</p>
                            </div>
                            <TrendingDown className="w-10 h-10 text-green-600 opacity-50" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-purple-600 font-medium">Total Discount Given</p>
                                <p className="text-3xl font-bold text-purple-900">${totalDiscountValue.toLocaleString()}</p>
                            </div>
                            <DollarSign className="w-10 h-10 text-purple-600 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="bg-white rounded-3xl p-6 shadow-md">
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search discounts by name, code, or description..."
                />
            </div>

            {/* Filters */}
            <div className="bg-white rounded-3xl p-6 shadow-md">
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                        <span className="text-sm font-medium text-gray-700 py-2">Status:</span>
                        {["all", "active", "inactive", "expired"].map(status => (
                            <button
                                key={status}
                                onClick={() => setSelectedStatus(status)}
                                className={`px-6 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                                    selectedStatus === status 
                                        ? "bg-purple-600 text-white shadow-md" 
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <span className="text-sm font-medium text-gray-700 py-2">Type:</span>
                        {["all", "percentage", "fixed_amount", "bogo"].map(type => (
                            <button
                                key={type}
                                onClick={() => setSelectedType(type)}
                                className={`px-6 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                                    selectedType === type 
                                        ? "bg-purple-600 text-white shadow-md" 
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                            >
                                {type === "all" ? "All Types" : typeLabels[type]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Discounts List */}
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                </div>
            ) : filteredDiscounts.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <Percent className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No discounts found</p>
                        <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 gap-6">
                    {filteredDiscounts.map(discount => (
                        <Card key={discount.id} className="hover:shadow-lg transition-all duration-300 border-2">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex flex-wrap gap-2">
                                        <Badge className={typeColors[discount.discount_type]}>
                                            {typeLabels[discount.discount_type]}
                                        </Badge>
                                        <Badge className={statusColors[discount.status]}>
                                            {discount.status}
                                        </Badge>
                                        {discount.code && (
                                            <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                                                CODE: {discount.code}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <CardTitle className="text-xl mb-2">{discount.name}</CardTitle>
                                <div className="text-3xl font-bold text-purple-600 mb-2">
                                    {getDiscountDisplay(discount)}
                                </div>
                                {discount.description && (
                                    <p className="text-sm text-gray-600 mt-2">{discount.description}</p>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Valid Period:</span>
                                        <span className="font-medium">
                                            {discount.valid_from ? format(new Date(discount.valid_from), 'MMM d, yyyy') : 'No start'} - {discount.valid_to ? format(new Date(discount.valid_to), 'MMM d, yyyy') : 'No end'}
                                        </span>
                                    </div>
                                    
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Applies To:</span>
                                        <span className="font-medium">
                                            {discount.applicable_to === 'all_items' ? 'All Items' : 
                                             discount.applicable_to === 'specific_items' ? 'Specific Items' : 
                                             'Specific Categories'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Usage:</span>
                                        <span className="font-medium">
                                            {discount.current_uses || 0} {discount.max_uses ? `/ ${discount.max_uses}` : '/ Unlimited'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Total Discount Given:</span>
                                        <span className="font-bold text-purple-600">
                                            ${(discount.total_discount_amount || 0).toLocaleString()}
                                        </span>
                                    </div>

                                    {canEdit && (
                                        <div className="flex gap-2 mt-4 pt-4 border-t">
                                            <Button 
                                                variant="outline" 
                                                className="flex-1"
                                                onClick={() => handleEdit(discount)}
                                            >
                                                <Pencil className="w-4 h-4 mr-2" />
                                                Edit
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => setDeleteConfirm(discount)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <DiscountForm
                open={showForm}
                onOpenChange={(open) => {
                    setShowForm(open);
                    if (!open) setEditingDiscount(null);
                }}
                onSuccess={handleSuccess}
                editDiscount={editingDiscount}
            />

            <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Discount?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{deleteConfirm?.name}"? This action cannot be undone.
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