import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import SearchBar from "../components/SearchBar";
import PrintableDocument from "../components/PrintableDocument";
import { Plus, Trash2, Printer, Calculator, ShoppingCart } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function CheckoutQuote() {
    const [selectedLocationId, setSelectedLocationId] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedItems, setSelectedItems] = useState([]);
    const [patientName, setPatientName] = useState("");
    const [notes, setNotes] = useState("");
    const [showTotals, setShowTotals] = useState(true);
    const [savedQuote, setSavedQuote] = useState(null);
    const [selectedDiscountId, setSelectedDiscountId] = useState("");

    const queryClient = useQueryClient();

    const { data: locations = [] } = useQuery({
        queryKey: ['clinicLocations'],
        queryFn: () => base44.entities.ClinicLocation.list(),
    });

    const { data: allPricingItems = [] } = useQuery({
        queryKey: ['pricingItems'],
        queryFn: () => base44.entities.PricingItem.filter({ status: 'active' }),
    });

    const { data: discounts = [] } = useQuery({
        queryKey: ['discounts'],
        queryFn: () => base44.entities.Discount.filter({ status: 'active' }),
    });

    const pricingItems = allPricingItems;

    const saveQuoteMutation = useMutation({
        mutationFn: (quoteData) => base44.entities.Quote.create(quoteData),
        onSuccess: (data) => {
            queryClient.invalidateQueries(['quotes']);
            setSavedQuote(data);
            setTimeout(() => {
                // Wait for all images to load before printing
                const images = document.querySelectorAll('.printable-quote img');
                let loadedCount = 0;
                const totalImages = images.length;
                
                if (totalImages === 0) {
                    window.print();
                    return;
                }
                
                const checkAllLoaded = () => {
                    loadedCount++;
                    if (loadedCount === totalImages) {
                        window.print();
                    }
                };
                
                images.forEach(img => {
                    if (img.complete) {
                        checkAllLoaded();
                    } else {
                        img.onload = checkAllLoaded;
                        img.onerror = checkAllLoaded;
                    }
                });
            }, 300);
        },
    });

    const selectedLocation = locations.find(loc => loc.id === selectedLocationId);

    // Get unique categories
    const availableCategories = React.useMemo(() => {
        const cats = new Set();
        pricingItems.forEach(item => {
            if (item.categories) {
                try {
                    const itemCats = JSON.parse(item.categories);
                    itemCats.forEach(cat => cats.add(cat));
                } catch (e) {}
            }
            if (item.category) {
                cats.add(item.category);
            }
        });
        return ["all", ...Array.from(cats).sort()];
    }, [pricingItems]);

    const filteredItems = pricingItems.filter(item => {
        // Search filter
        const normalizeText = (text) => text.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normalizedQuery = normalizeText(searchQuery);
        const matchesSearch = normalizedQuery === '' || 
                            normalizeText(item.name).includes(normalizedQuery) ||
                            normalizeText(item.description || '').includes(normalizedQuery);
        
        // Category filter
        let itemCategories = [];
        if (item.categories) {
            try {
                itemCategories = JSON.parse(item.categories);
            } catch (e) {}
        } else if (item.category) {
            itemCategories = [item.category];
        }
        const matchesCategory = selectedCategory === "all" || itemCategories.includes(selectedCategory);
        
        return matchesSearch && matchesCategory;
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
            quantity: 1 
        }]);
    };

    const addAllTiers = (item) => {
        const tiers = item.pricing_tiers ? JSON.parse(item.pricing_tiers) : [];
        const newItems = tiers.map(tier => ({
            id: item.id,
            name: item.name,
            item_type: item.item_type,
            category: item.category,
            taxable: item.taxable,
            tier_name: tier.tier_name,
            price: tier.price,
            sessions: tier.sessions,
            quantity: 1
        }));
        setSelectedItems([...selectedItems, ...newItems]);
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

    const handleSaveQuote = () => {
        const quoteData = {
            quote_number: `Q-${Math.floor(10000 + Math.random() * 90000)}`,
            clinic_location_id: selectedLocationId,
            patient_name: patientName || undefined,
            items: JSON.stringify(selectedItems),
            discount_id: selectedDiscountId || undefined,
            discount_amount: calculateDiscountAmount(),
            subtotal: calculateSubtotal(),
            tax_amount: calculateTax(),
            total: calculateTotal(),
            notes: notes || undefined,
            status: 'draft',
            show_totals: showTotals
        };

        saveQuoteMutation.mutate(quoteData);
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
        "Consultation": "bg-amber-100 text-amber-800",
        "Treatment": "bg-purple-100 text-purple-800"
    };

    const getStatusColor = (status) => {
        const colors = {
            'draft': 'bg-gray-100 text-gray-800',
            'sent': 'bg-blue-100 text-blue-800',
            'accepted': 'bg-green-100 text-green-800',
            'expired': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="space-y-6">
            {/* Print Styles */}
            <style>
                {`
                    @media print {
                        @page {
                            margin: 0.3cm 0.3cm 0.3cm 0.3cm;
                        }
                        body * {
                            visibility: hidden;
                        }
                        .printable-quote,
                        .printable-quote * {
                            visibility: visible;
                            color: #000 !important;
                        }
                        .printable-quote {
                            position: absolute !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 100%;
                            padding: 0 5px 0 5px !important;
                            font-size: 15px !important;
                            line-height: 1.5 !important;
                        }
                        .printable-quote h1 {
                            font-size: 20px !important;
                            margin-bottom: 4px !important;
                        }
                        .printable-quote h3 {
                            font-size: 16px !important;
                            margin-bottom: 4px !important;
                        }
                        .printable-quote .space-y-6 > * + * {
                            margin-top: 1px !important;
                        }
                        .printable-quote table {
                            font-size: 13px !important;
                            border-collapse: collapse !important;
                        }
                        .printable-quote table th,
                        .printable-quote table td {
                            padding: 2px 4px !important;
                            line-height: 1.3 !important;
                            border-bottom: 1px solid #333 !important;
                        }
                        .printable-quote table thead tr {
                            background-color: #e5e7eb !important;
                        }
                        .printable-quote table tbody tr:nth-child(even) {
                            background-color: #f9fafb !important;
                        }
                        .printable-quote .text-xl {
                            font-size: 18px !important;
                        }
                        .printable-quote .grid {
                            gap: 4px !important;
                        }
                        .printable-quote img {
                            max-height: 50px !important;
                        }
                        .printable-quote img.qr-code {
                            max-height: none !important;
                            max-width: 160px !important;
                            width: 160px !important;
                            height: 160px !important;
                            object-fit: contain !important;
                        }
                        .printable-quote .pb-6 {
                            padding-bottom: 4px !important;
                        }
                        .printable-quote .mb-4 {
                            margin-bottom: 2px !important;
                        }
                        .printable-quote .p-3 {
                            padding: 1px 3px !important;
                        }
                        .printable-quote .p-4 {
                            padding: 2px !important;
                        }
                        .printable-quote .pt-4 {
                            padding-top: 2px !important;
                        }
                        .printable-quote .mt-8 {
                            margin-top: 1px !important;
                        }
                        .printable-quote .mt-6 {
                            margin-top: 1px !important;
                        }
                        .printable-quote .mb-6 {
                            margin-bottom: 2px !important;
                        }
                        .printable-quote .text-sm {
                            font-size: 13px !important;
                        }
                        .printable-quote .text-xs {
                            font-size: 12px !important;
                        }
                        .no-print {
                            display: none !important;
                        }
                    }
                `}
            </style>

            {/* Printable Quote (hidden on screen, shown when printing) */}
            {savedQuote && (
                <div className="printable-quote fixed top-0 left-[-9999px] w-full bg-white">
                    <PrintableDocument title="Price Quote">
                        <div className="space-y-2">
                            {/* Header Info */}
                            <div className="pb-2 border-b space-y-2">
                                <div>
                                    <div className="text-sm text-gray-500 mb-1">Quote Number</div>
                                    <div className="font-bold text-lg">{savedQuote.quote_number}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <div className="text-sm text-gray-500 mb-1">Date</div>
                                        <div className="font-semibold">{new Date().toLocaleDateString()}</div>
                                    </div>
                                    {selectedLocation && (
                                        <div>
                                            <div className="text-sm text-gray-500 mb-1">Clinic Location</div>
                                            <div className="font-semibold">{selectedLocation.name}</div>
                                        </div>
                                    )}
                                </div>
                                {savedQuote.patient_name && (
                                    <div>
                                        <div className="text-sm text-gray-500 mb-1">Patient Name</div>
                                        <div className="font-semibold">{savedQuote.patient_name}</div>
                                    </div>
                                )}
                                <div className="no-print">
                                    <div className="text-sm text-gray-500 mb-1">Status</div>
                                    <Badge className={getStatusColor(savedQuote.status)}>
                                        {savedQuote.status.charAt(0).toUpperCase() + savedQuote.status.slice(1)}
                                    </Badge>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div>
                                <h3 className="font-bold text-lg mb-4">Items</h3>
                                <table className="w-full">
                                    <thead className="bg-slate-100">
                                        <tr>
                                            <th className="text-left p-3 font-semibold">Item</th>
                                            <th className="text-center p-3 font-semibold">Qty</th>
                                            <th className="text-right p-3 font-semibold">Price</th>
                                            <th className="text-right p-3 font-semibold">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedItems.map((item, index) => {
                                            const itemSubtotal = item.price * item.quantity;
                                            return (
                                                <tr key={index} className="border-b">
                                                    <td className="p-3">
                                                        <div className="font-medium">{item.name}</div>
                                                        {item.tier_name && (
                                                            <div className="text-sm text-gray-600">
                                                                {item.tier_name}
                                                                {item.sessions > 1 && ` (${item.sessions} sessions)`}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="text-center p-3">{item.quantity}</td>
                                                    <td className="text-right p-3">${item.price.toFixed(2)}</td>
                                                    <td className="text-right p-3 font-semibold">
                                                        ${itemSubtotal.toFixed(2)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals */}
                            {savedQuote.show_totals && (
                                <div className="flex justify-end">
                                    <div className="w-64 space-y-2">
                                        <div className="flex justify-between pb-2">
                                            <span>Subtotal:</span>
                                            <span className="font-semibold">${savedQuote.subtotal.toFixed(2)}</span>
                                        </div>
                                        {savedQuote.discount_amount > 0 && (
                                            <div className="flex justify-between pb-2 text-green-600">
                                                <span>Discount:</span>
                                                <span className="font-semibold">-${savedQuote.discount_amount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between pb-2">
                                            <span>Tax ({selectedLocation?.tax_rate || 0}%):</span>
                                            <span className="font-semibold">${savedQuote.tax_amount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-xl font-bold text-blue-900 pt-2 border-t-2">
                                            <span>Total:</span>
                                            <span>${savedQuote.total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {savedQuote.notes && (
                                <div className="bg-slate-50 p-4 rounded-lg border">
                                    <div className="font-semibold mb-2">Notes:</div>
                                    <div className="text-gray-700 whitespace-pre-wrap">{savedQuote.notes}</div>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="text-sm text-gray-500 border-t pt-4 mt-8">
                                <p>This quote is valid for 30 days from the date of issue.</p>
                                <p className="mt-2">Payment is due at the time of service unless required to schedule procedure.</p>
                                <p className="mt-3 font-semibold text-gray-700">Cherry Financing and Care Credit Available</p>
                                
                                {/* QR Code for Payment Options */}
                                <div className="mt-6 text-center">
                                    <img 
                                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695939a556b8082002a35a68/93c585704_CHCPaymentOptions.jpg"
                                        alt="Scan for Payment Options"
                                        className="mx-auto qr-code"
                                        style={{width: '160px', height: 'auto'}}
                                    />
                                </div>
                            </div>
                        </div>
                    </PrintableDocument>
                </div>
            )}

            {/* Header */}
            <div className="no-print">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout Quote Generator</h1>
                <p className="text-gray-600">Create price quotes for patients</p>
            </div>

            {/* Location Selection */}
            <Card className="border-2 border-blue-200 bg-blue-50 no-print">
                <CardHeader>
                    <CardTitle className="flex items-center text-blue-900">
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Select Clinic Location *
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select a clinic location" />
                        </SelectTrigger>
                        <SelectContent>
                            {locations.filter(loc => loc.status === 'active').map(location => (
                                <SelectItem key={location.id} value={location.id}>
                                    {location.name} - Tax: {location.tax_rate}%
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {(
                <div className="grid grid-cols-2 gap-6 no-print">
                    {/* Left: Item Selection */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Available Items ({filteredItems.length})</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <SearchBar
                                    value={searchQuery}
                                    onChange={setSearchQuery}
                                    placeholder="Search by name, description..."
                                />

                                {/* Category Filter */}
                                <div className="flex flex-wrap gap-2">
                                    {availableCategories.map(category => (
                                        <button
                                            key={category}
                                            onClick={() => setSelectedCategory(category)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                                selectedCategory === category 
                                                    ? "bg-blue-600 text-white shadow-md" 
                                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }`}
                                        >
                                            {category === "all" ? "All" : category}
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {filteredItems.map(item => {
                                        const tiers = item.pricing_tiers ? JSON.parse(item.pricing_tiers) : [];
                                        return (
                                            <Card key={item.id} className="hover:bg-slate-50 transition-colors">
                                                <CardContent className="p-4">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="font-semibold text-gray-900">
                                                            {item.name}
                                                        </div>
                                                        {tiers.length > 1 && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => addAllTiers(item)}
                                                                className="text-xs"
                                                            >
                                                                Add All
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 mb-3">
                                                        <Badge className={typeColors[item.item_type]}>
                                                            {item.item_type}
                                                        </Badge>
                                                        <Badge className={categoryColors[item.category]}>
                                                            {item.category}
                                                        </Badge>
                                                        {item.taxable && (
                                                            <Badge variant="outline">Taxable</Badge>
                                                        )}
                                                    </div>
                                                    {item.description && (
                                                        <p className="text-sm text-gray-600 mb-3">
                                                            {item.description}
                                                        </p>
                                                    )}
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
                                    <Label>Patient Name (Optional)</Label>
                                    <Input
                                        value={patientName}
                                        onChange={(e) => setPatientName(e.target.value)}
                                        placeholder="Enter patient name..."
                                    />
                                </div>

                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <Label htmlFor="show-totals" className="cursor-pointer">Hide Total Price on Printed Quote</Label>
                                    <Switch
                                        id="show-totals"
                                        checked={!showTotals}
                                        onCheckedChange={(checked) => setShowTotals(!checked)}
                                    />
                                </div>

                                <div>
                                    <Label>Selected Items</Label>
                                    {selectedItems.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                                            No items selected
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                            {selectedItems.map((item, index) => (
                                               <Card key={index} className="bg-slate-50">
                                                   <CardContent className="p-4">
                                                       <div className="flex items-start justify-between mb-3">
                                                           <div className="flex-1">
                                                               <div className="font-semibold text-base">{item.name}</div>
                                                               <div className="text-sm text-gray-600 mt-1">
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
                                                       <div className="grid grid-cols-3 gap-3">
                                                           <div>
                                                               <Label className="text-sm mb-1.5 block">Price</Label>
                                                               <Input
                                                                   type="number"
                                                                   min="0"
                                                                   step="0.01"
                                                                   value={item.price}
                                                                   onChange={(e) => updatePrice(index, e.target.value)}
                                                                   className="h-10"
                                                               />
                                                           </div>
                                                           <div>
                                                               <Label className="text-sm mb-1.5 block">Qty</Label>
                                                               <Input
                                                                   type="number"
                                                                   min="1"
                                                                   value={item.quantity}
                                                                   onChange={(e) => updateQuantity(index, e.target.value)}
                                                                   className="h-10"
                                                               />
                                                           </div>
                                                           <div>
                                                               <Label className="text-sm mb-1.5 block">Total</Label>
                                                               <div className="h-10 flex items-center font-bold text-base text-blue-600">
                                                                   ${(item.price * item.quantity).toFixed(2)}
                                                               </div>
                                                           </div>
                                                       </div>
                                                       <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                                                           <input
                                                               type="checkbox"
                                                               id={`tax-${index}`}
                                                               checked={item.taxable}
                                                               onChange={() => toggleTaxable(index)}
                                                               className="w-4 h-4 rounded"
                                                           />
                                                           <Label htmlFor={`tax-${index}`} className="text-sm cursor-pointer">
                                                               Taxable Item
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

                                <Button
                                    onClick={handleSaveQuote}
                                    disabled={selectedItems.length === 0 || !selectedLocationId || saveQuoteMutation.isPending}
                                    className="w-full bg-blue-600 hover:bg-blue-700 h-12"
                                >
                                    <Printer className="w-5 h-5 mr-2" />
                                    {saveQuoteMutation.isPending ? "Generating..." : "Generate & Print Quote"}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}