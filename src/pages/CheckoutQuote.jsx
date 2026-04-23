function safeParse(v,f=[]){if(v==null)return f;if(typeof v!=="string")return v;try{return JSON.parse(v)}catch{return f}}
import React, { useState } from "react";
import { entities, uploadFile, invokeLLM, generateImage, sendEmail, agentChat } from "@/api/supabaseHelpers";
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
import { Plus, Trash2, Printer, Calculator, ShoppingCart, ChevronDown, ChevronRight, CheckCircle2, Send } from "lucide-react";
import SendQuoteDialog from "../components/quotes/SendQuoteDialog";
import { Switch } from "@/components/ui/switch";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function CheckoutQuote() {
    const [selectedLocationId, setSelectedLocationId] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedItems, setSelectedItems] = useState([]);
    const [patientName, setPatientName] = useState("");
    const [notes, setNotes] = useState("");
    const [showTotals, setShowTotals] = useState(true);
    const [savedQuote, setSavedQuote] = useState(null);
    const [showSendQuote, setShowSendQuote] = useState(false);
    const [selectedDiscountId, setSelectedDiscountId] = useState("");
    const [expandedCategories, setExpandedCategories] = useState({});
    const [categorySearch, setCategorySearch] = useState({});
    const [successMessage, setSuccessMessage] = useState(null);
    const navigate = useNavigate();

    const queryClient = useQueryClient();

    const { data: locations = [] } = useQuery({
        queryKey: ['clinicLocations'],
        queryFn: () => entities.ClinicLocation.list(),
    });

    const { data: allPricingItems = [] } = useQuery({
        queryKey: ['pricingItems'],
        queryFn: () => entities.PricingItem.filter({ status: 'active' }),
    });

    const { data: discounts = [] } = useQuery({
        queryKey: ['discounts'],
        queryFn: () => entities.Discount.filter({ status: 'active' }),
    });

    const pricingItems = allPricingItems;

    const buildPrintHtml = (quoteData, items, location) => {
        const logoUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695939a556b8082002a35a68/1e5584b38_goldwithlettersContemporary-health-center-logo-retina.png";
        const qrUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695939a556b8082002a35a68/93c585704_CHCPaymentOptions.jpg";
        const itemRows = items.map((item, i) => {
            const sub = (item.price * item.quantity).toFixed(2);
            const tierInfo = item.tier_name ? `<div style="font-size:12px;color:#666">${item.tier_name}${item.sessions > 1 ? ` (${item.sessions} sessions)` : ''}</div>` : '';
            const bg = i % 2 === 1 ? 'background:#f9fafb;' : '';
            return `<tr style="border-bottom:1px solid #ddd;${bg}"><td style="padding:6px 8px"><div style="font-weight:600">${item.name}</div>${tierInfo}</td><td style="padding:6px 8px;text-align:center">${item.quantity}</td><td style="padding:6px 8px;text-align:right">$${item.price.toFixed(2)}</td><td style="padding:6px 8px;text-align:right;font-weight:600">$${sub}</td></tr>`;
        }).join('');

        let totalsHtml = '';
        if (quoteData.show_totals) {
            totalsHtml = `<div style="display:flex;justify-content:flex-end;margin-top:12px"><div style="width:250px">
                <div style="display:flex;justify-content:space-between;padding:4px 0"><span>Subtotal:</span><span style="font-weight:600">$${(quoteData.subtotal || 0).toFixed(2)}</span></div>
                ${(quoteData.discount_amount || 0) > 0 ? `<div style="display:flex;justify-content:space-between;padding:4px 0;color:#059669"><span>Discount:</span><span style="font-weight:600">-$${(quoteData.discount_amount || 0).toFixed(2)}</span></div>` : ''}
                <div style="display:flex;justify-content:space-between;padding:4px 0"><span>Tax (${location?.tax_rate || 0}%):</span><span style="font-weight:600">$${(quoteData.tax_amount || 0).toFixed(2)}</span></div>
                <div style="display:flex;justify-content:space-between;padding:8px 0 0;border-top:2px solid #333;font-size:18px;font-weight:700;color:#1e3a5f"><span>Total:</span><span>$${(quoteData.total || 0).toFixed(2)}</span></div>
            </div></div>`;
        }

        return `<html><head><title>Price Quote - ${quoteData.quote_number}</title>
        <style>
            body { font-family: 'Times New Roman', serif; margin: 0; padding: 20px; color: #000; }
            table { width: 100%; border-collapse: collapse; }
            @media print { @page { margin: 0.5cm; } }
        </style></head><body>
        <div style="text-align:center;margin-bottom:12px"><img src="${logoUrl}" style="height:60px" onerror="this.style.display='none'" /></div>
        <div style="text-align:center;font-size:11px;color:#555;border-bottom:1px solid #ccc;padding-bottom:8px;margin-bottom:12px">
            <div style="font-weight:600">6150 Diamond Center Court #400, Fort Myers, FL 33912</div>
            <div>Phone: 239-561-9191 | Fax: 239-561-9188</div>
            <div>contemporaryhealthcenter.com</div>
        </div>
        <h1 style="text-align:center;font-size:18px;text-transform:uppercase;letter-spacing:2px;border-bottom:1px solid #333;padding-bottom:8px">Price Quote</h1>
        <div style="display:flex;gap:24px;padding:8px 0;border-bottom:1px solid #ddd;margin-bottom:12px;flex-wrap:wrap">
            <div><div style="font-size:12px;color:#888">Quote Number</div><div style="font-weight:700;font-size:16px">${quoteData.quote_number}</div></div>
            <div><div style="font-size:12px;color:#888">Date</div><div style="font-weight:600">${new Date().toLocaleDateString()}</div></div>
            ${location ? `<div><div style="font-size:12px;color:#888">Location</div><div style="font-weight:600">${location.name}</div></div>` : ''}
            ${quoteData.patient_name ? `<div><div style="font-size:12px;color:#888">Patient</div><div style="font-weight:600">${quoteData.patient_name}</div></div>` : ''}
        </div>
        <h3 style="font-size:15px;font-weight:700;margin-bottom:8px">Items</h3>
        <table><thead style="background:#e5e7eb"><tr><th style="padding:6px 8px;text-align:left">Item</th><th style="padding:6px 8px;text-align:center">Qty</th><th style="padding:6px 8px;text-align:right">Price</th><th style="padding:6px 8px;text-align:right">Subtotal</th></tr></thead><tbody>${itemRows}</tbody></table>
        ${totalsHtml}
        ${quoteData.notes ? `<div style="background:#f8f8f8;padding:10px;border:1px solid #ddd;border-radius:4px;margin-top:12px"><div style="font-weight:600;margin-bottom:4px">Notes:</div><div style="white-space:pre-wrap">${quoteData.notes}</div></div>` : ''}
        <div style="border-top:1px solid #ccc;padding-top:10px;margin-top:20px;font-size:12px;color:#888">
            <p>This quote is valid for 30 days from the date of issue.</p>
            <p>Payment is due at the time of service unless required to schedule procedure.</p>
            <p style="font-weight:600;color:#555">Cherry Financing and Care Credit Available</p>
            <div style="text-align:center;margin-top:12px"><img src="${qrUrl}" style="width:160px;height:auto" /></div>
        </div>
        <div style="text-align:center;font-size:11px;color:#888;margin-top:12px;border-top:1px solid #ddd;padding-top:8px">
            Contemporary Health Center | Phone: 239-561-9191 | Document Generated: ${new Date().toLocaleDateString()}
        </div>
        </body></html>`;
    };

    const [isSaving, setIsSaving] = useState(false);

    const saveQuoteMutation = useMutation({
        mutationFn: (quoteData) => entities.Quote.create(quoteData),
        onSuccess: (data) => {
            queryClient.invalidateQueries(['quotes']);
            setSavedQuote(data);
            setIsSaving(false);
            // Navigate to QuoteDetail with autoprint — window.print() works reliably on Safari
            navigate(createPageUrl(`QuoteDetail?id=${data.id}&autoprint=true`));
        },
        onError: () => {
            setIsSaving(false);
        },
    });

    const selectedLocation = locations.find(loc => loc.id === selectedLocationId);

    // Helper: get item's category (category field is primary, categories JSON is fallback)
    const getItemCat = (item) => {
        if (item.category) return item.category;
        if (item.categories) {
            const parsed = safeParse(item.categories);
            if (parsed.length > 0) return parsed[0];
        }
        return null;
    };

    // Get unique categories
    const availableCategories = React.useMemo(() => {
        const cats = new Set();
        pricingItems.forEach(item => {
            const cat = getItemCat(item);
            if (cat) cats.add(cat);
        });
        return ["all", ...Array.from(cats).sort()];
    }, [pricingItems]);

    // Group items by category
    const groupedItems = React.useMemo(() => {
        const groups = {};
        const filtered = pricingItems.filter(item => {
            const normalizeText = (text) => text.toLowerCase().replace(/[^a-z0-9]/g, '');
            const normalizedQuery = normalizeText(searchQuery);
            const matchesSearch = normalizedQuery === '' || 
                                normalizeText(item.name).includes(normalizedQuery) ||
                                normalizeText(item.description || '').includes(normalizedQuery);
            const itemCat = getItemCat(item);
            const matchesCategory = selectedCategory === "all" || itemCat === selectedCategory;
            return matchesSearch && matchesCategory;
        });
        filtered.forEach(item => {
            const cat = getItemCat(item) || 'Other';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(item);
        });
        return groups;
    }, [pricingItems, searchQuery, selectedCategory]);

    const totalFilteredItems = Object.values(groupedItems).reduce((s, arr) => s + arr.length, 0);

    const toggleCategory = (cat) => {
        setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
    };

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
        const tiers = item.pricing_tiers ? safeParse(item.pricing_tiers) : [];
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
        setIsSaving(true);
        const quoteData = {
            location_id: selectedLocationId || null,
            patient_name: patientName || null,
            items: selectedItems,
            discount_id: selectedDiscountId || null,
            discount_amount: calculateDiscountAmount(),
            subtotal: calculateSubtotal(),
            total: calculateTotal(),
            notes: notes || null,
            show_totals: showTotals,
            status: 'draft',
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
        "Treatment": "bg-purple-100 text-purple-800",
        "Treatment Package": "bg-violet-100 text-violet-800",
        "Service": "bg-sky-100 text-sky-800",
        "Lab": "bg-orange-100 text-orange-800",
        "Supplement": "bg-lime-100 text-lime-800",
        "Injectable": "bg-fuchsia-100 text-fuchsia-800",
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
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl p-6 text-white mb-6 no-print">
                <h1 className="text-2xl font-bold flex items-center gap-3">
                    <Calculator className="w-7 h-7" />
                    💰 Checkout Quote Generator
                </h1>
                <p className="text-teal-100 mt-1">Create and print price quotes for patients</p>
                <div className="flex gap-3 mt-3">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                        {pricingItems.length} Items Available
                    </span>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                        {selectedItems.length} Selected
                    </span>
                </div>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between no-print">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-green-800 font-medium">
                            Quote {successMessage.quote_number} saved successfully!
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <Link to={createPageUrl(`QuoteDetail?id=${successMessage.id}`)}>
                            <Button size="sm" variant="outline" className="text-green-700 border-green-300">
                                View Quote
                            </Button>
                        </Link>
                        <Button size="sm" variant="ghost" onClick={() => setSuccessMessage(null)} className="text-green-600">
                            Dismiss
                        </Button>
                    </div>
                </div>
            )}

            {/* Location Selection */}
            <Card className="border-2 border-blue-200 bg-blue-50 no-print">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-blue-900 text-base">
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Clinic Location *
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="No Location Selected" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">No Location</SelectItem>
                            {locations.filter(loc => loc.status === 'active').map(location => (
                                <SelectItem key={location.id} value={location.id}>
                                    {location.name} - Tax: {location.tax_rate}%
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Side-by-side layout: items left, quote right */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
                {/* Left: Item Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle>Available Items ({totalFilteredItems})</CardTitle>
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
                                            ? "bg-teal-600 text-white shadow-md" 
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                                >
                                    {category === "all" ? "All" : category}
                                </button>
                            ))}
                        </div>

                        {/* Collapsible categories */}
                        <div className="space-y-2">
                            {Object.entries(groupedItems).sort(([a],[b]) => a.localeCompare(b)).map(([category, items]) => (
                                <div key={category} className="border rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => toggleCategory(category)}
                                        className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            {expandedCategories[category] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                            <span className="font-semibold text-gray-800">{category}</span>
                                            <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                                        </div>
                                    </button>
                                    {expandedCategories[category] && (
                                        <div className="p-2 space-y-2">
                                            <Input
                                                placeholder={`Search ${category}...`}
                                                value={categorySearch[category] || ""}
                                                onChange={(e) => setCategorySearch(prev => ({ ...prev, [category]: e.target.value }))}
                                                className="h-8 text-sm"
                                            />
                                            <div className="space-y-2 max-h-72 overflow-y-auto">
                                            {items.filter(item => {
                                                const q = (categorySearch[category] || "").toLowerCase();
                                                if (!q) return true;
                                                return item.name.toLowerCase().includes(q) || (item.description || "").toLowerCase().includes(q);
                                            }).map(item => {
                                                const tiers = item.pricing_tiers ? safeParse(item.pricing_tiers) : [];
                                                return (
                                                    <Card key={item.id} className="hover:bg-slate-50 transition-colors">
                                                        <CardContent className="p-3">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div className="font-semibold text-gray-900 text-sm">
                                                                    {item.name}
                                                                </div>
                                                                {tiers.length > 1 && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => addAllTiers(item)}
                                                                        className="text-xs h-7"
                                                                    >
                                                                        Add All
                                                                    </Button>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-wrap gap-1.5 mb-2">
                                                                <Badge className={`text-xs ${typeColors[item.item_type] || 'bg-gray-100 text-gray-800'}`}>
                                                                    {item.item_type}
                                                                </Badge>
                                                                {item.taxable && (
                                                                    <Badge variant="outline" className="text-xs">Taxable</Badge>
                                                                )}
                                                            </div>
                                                            {item.description && (
                                                                <p className="text-xs text-gray-600 mb-2">
                                                                    {item.description}
                                                                </p>
                                                            )}
                                                            <div className="space-y-1.5">
                                                                {tiers.map((tier, idx) => (
                                                                    <div key={idx} className="flex items-center justify-between bg-white border rounded-lg p-2">
                                                                        <div className="flex-1">
                                                                            <div className="text-sm font-medium text-gray-700">
                                                                                {tier.tier_name}
                                                                            </div>
                                                                            <div className="text-base font-bold text-teal-600">
                                                                                ${tier.price.toLocaleString()}
                                                                            </div>
                                                                        </div>
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => addItem(item, tier)}
                                                                            className="bg-teal-600 hover:bg-teal-700 h-8"
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
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {totalFilteredItems === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    No items found
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Right: Quote Builder (sticky so it stays visible while scrolling items) */}
                <div className="lg:sticky lg:top-4 lg:self-start">
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
                                    No items selected — expand a category above to add items
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
                                                       <div className="h-10 flex items-center font-bold text-base text-teal-600">
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
                                <div className="flex justify-between text-xl font-bold text-teal-800 pt-2 border-t">
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

                        <div className="flex gap-2">
                            <Button
                                onClick={handleSaveQuote}
                                disabled={selectedItems.length === 0 || !selectedLocationId || selectedLocationId === "none" || isSaving}
                                className="flex-1 bg-teal-600 hover:bg-teal-700 h-12"
                            >
                                <Printer className="w-5 h-5 mr-2" />
                                {isSaving ? "Generating..." : "Generate & Print Quote"}
                            </Button>
                            <Button
                                onClick={() => setShowSendQuote(true)}
                                disabled={selectedItems.length === 0}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 h-12"
                            >
                                <Send className="w-5 h-5 mr-2" />
                                Send to Patient
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                </div>
            </div>

            <SendQuoteDialog
                open={showSendQuote}
                onOpenChange={setShowSendQuote}
                preselectedItems={selectedItems.map(item => ({
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity || 1,
                }))}
            />
        </div>
    );
}
