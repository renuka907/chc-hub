function safeParse(v,f=[]){if(v==null)return f;if(typeof v!=="string")return v;try{return JSON.parse(v)}catch{return f}}
import React, { useState } from "react";
import { entities, uploadFile, invokeLLM, generateImage, sendEmail, agentChat } from "@/api/supabaseHelpers";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PrintableDocument from "../components/PrintableDocument";
import EditQuoteDialog from "../components/quotes/EditQuoteDialog";
import { Printer, ArrowLeft, Edit } from "lucide-react";

import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function QuoteDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const quoteId = urlParams.get('id');
    const autoPrint = urlParams.get('autoprint') === 'true';
    const queryClient = useQueryClient();
    const [showEditDialog, setShowEditDialog] = useState(false);

    const { data: quote, isLoading: quoteLoading } = useQuery({
        queryKey: ['quote', quoteId],
        queryFn: () => entities.Quote.filter({ id: quoteId }).then(quotes => quotes[0]),
        enabled: !!quoteId,
    });

    const { data: locations = [] } = useQuery({
        queryKey: ['clinicLocations'],
        queryFn: () => entities.ClinicLocation.list(),
    });

    const { data: discounts = [] } = useQuery({
        queryKey: ['discounts'],
        queryFn: () => entities.Discount.list(),
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }) => entities.Quote.update(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quote', quoteId] });
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
        },
    });
    const location = quote ? locations.find(l => l.id === (quote.clinic_location_id || quote.location_id)) : null;
    const items = quote ? safeParse(quote.items) : [];
    const appliedDiscount = quote?.discount_id ? discounts.find(d => d.id === quote.discount_id) : null;

    const getStatusColor = (status) => {
        const colors = {
            'draft': 'bg-gray-100 text-gray-800',
            'sent': 'bg-blue-100 text-blue-800',
            'accepted': 'bg-green-100 text-green-800',
            'expired': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const handleStatusChange = (newStatus) => {
        updateStatusMutation.mutate({ id: quoteId, status: newStatus });
    };

    const triggerPrint = () => {
        window.print();
    };

    // Auto-trigger print when quote loads
    React.useEffect(() => {
        if (quote && autoPrint) {
            setTimeout(triggerPrint, 500);
        }
    }, [quote, autoPrint]);

    if (quoteLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading quote...</p>
                </div>
            </div>
        );
    }

    if (!quote) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-gray-600">Quote not found or the link is invalid.</p>
                    <Link to={createPageUrl("QuotesManagement")}>
                        <Button variant="outline">Return to Quotes</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page { margin: 0.25in 0.4in 0.2in 0.4in; size: letter; }
                    html, body, #root, main { background: white !important; background-image: none !important; }
                    body > div, #root > div { background: white !important; background-image: none !important; }
                    body * { visibility: hidden; }
                    .printable-document, .printable-document * { visibility: visible; color: #000 !important; }
                    .printable-document { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; max-width: 100% !important; font-size: 11px !important; line-height: 1.3 !important; }
                    .printable-document .mb-4, .printable-document .mb-6 { margin-bottom: 2px !important; }
                    .printable-document .mt-8 { margin-top: 2px !important; }
                    .printable-document .p-8 { padding: 0 !important; }
                    .printable-document .pb-6 { padding-bottom: 2px !important; }
                    .printable-document .space-y-6 > * + * { margin-top: 4px !important; }
                    .printable-document h1 { font-size: 14px !important; margin-bottom: 2px !important; padding-bottom: 2px !important; }
                    .printable-document h3 { font-size: 12px !important; margin-bottom: 2px !important; }
                    .printable-document .text-sm { font-size: 10px !important; }
                    .printable-document .text-xs { font-size: 9px !important; }
                    .printable-document .text-xl { font-size: 13px !important; }
                    .printable-document .text-lg { font-size: 12px !important; }
                    .printable-document table { font-size: 11px !important; border-collapse: collapse !important; }
                    .printable-document table th, .printable-document table td { padding: 2px 4px !important; line-height: 1.2 !important; }
                    .printable-document img.logo-img { max-height: 35px !important; }
                    .printable-document img[alt="Scan for Payment Options"] { width: 55px !important; height: auto !important; }
                    .printable-document .grid { gap: 0 8px !important; }
                    .printable-document .p-4 { padding: 3px !important; }
                    .printable-document .pt-4 { padding-top: 2px !important; }
                    .printable-document .pb-3 { padding-bottom: 1px !important; }
                    .printable-document .gap-y-1 { gap: 0 !important; }
                    .printable-document .space-y-2 > * + * { margin-top: 1px !important; }
                    .printable-document .pb-2 { padding-bottom: 1px !important; }
                    .printable-document .pt-2 { padding-top: 2px !important; }
                    .printable-document .mt-2, .printable-document .mt-3 { margin-top: 2px !important; }
                    .printable-document .rounded-lg { border-radius: 4px !important; }
                    .printable-document .border-t { border-top-width: 1px !important; }
                    .printable-document .w-64 { width: 200px !important; }
                    .printable-document thead,
                    .printable-document [class*="bg-slate"],
                    .printable-document [class*="bg-gray"] { background: white !important; background-color: white !important; }
                    .no-print { display: none !important; }
                    nav, header, aside, footer, [class*="sidebar"], [class*="Sidebar"] { display: none !important; }
                }
            `}} />
            {/* Action Bar */}
            <div className="flex items-center justify-between no-print">
                <Link to={createPageUrl("QuotesManagement")}>
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Quotes
                    </Button>
                </Link>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Status:</span>
                        <Select value={quote.status} onValueChange={handleStatusChange}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="sent">Sent</SelectItem>
                                <SelectItem value="accepted">Accepted</SelectItem>
                                <SelectItem value="expired">Expired</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button onClick={() => setShowEditDialog(true)} variant="outline">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Items
                    </Button>
                    <Button onClick={triggerPrint} className="bg-teal-600 hover:bg-teal-700">
                        <Printer className="w-4 h-4 mr-2" />
                        Print / PDF
                    </Button>
                </div>
            </div>

            {/* Printable Content */}
            <PrintableDocument title="Price Quote" logoUrl={quote?.image_url || undefined}>
                <div className="space-y-6">
                    {/* Header Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 pb-3 border-b text-sm">
                        <div>
                            <span className="text-gray-500">Quote #: </span>
                            <span className="font-bold">{quote.quote_number || `Q-${quote.id?.slice(0,8).toUpperCase()}`}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">Date: </span>
                            <span className="font-semibold">{new Date().toLocaleDateString()}</span>
                        </div>
                        {quote.patient_name && (
                            <div>
                                <span className="text-gray-500">Patient: </span>
                                <span className="font-semibold">{quote.patient_name}</span>
                            </div>
                        )}
                        {location && (
                            <div>
                                <span className="text-gray-500">Clinic: </span>
                                <span className="font-semibold">{location.name}</span>
                            </div>
                        )}
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
                                {items.map((item, index) => {
                                    const itemSubtotal = (item.price || 0) * (item.quantity || 1);
                                    const itemTax = item.taxable ? itemSubtotal * (location?.tax_rate || 0) / 100 : 0;
                                    return (
                                        <tr key={index} className="border-b">
                                            <td className="p-3">
                                                <div className="font-medium">{item.name}</div>
                                                {item.tier_name && (
                                                    <div className="text-sm text-gray-600">
                                                        {item.tier_name}
                                                        {item.sessions > 1 && ` (${item.sessions} ${item.unit_type || 'sessions'})`}
                                                    </div>
                                                )}
                                                {item.taxable && (
                                                    <div className="text-xs text-gray-500">
                                                        Taxable (Tax: ${itemTax.toFixed(2)})
                                                    </div>
                                                )}
                                            </td>
                                            <td className="text-center p-3">{item.quantity || 1}</td>
                                            <td className="text-right p-3">${(item.price || 0).toFixed(2)}</td>
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
                    {(quote.show_totals !== false) && (
                        <div className="flex justify-end">
                            <div className="w-64 space-y-2">
                                <div className="flex justify-between pb-2">
                                    <span>Subtotal:</span>
                                    <span className="font-semibold">${(quote.subtotal || 0).toFixed(2)}</span>
                                </div>
                                {(quote.discount_amount || 0) > 0 && appliedDiscount && (
                                    <div className="flex justify-between pb-2 text-green-600">
                                        <span>Discount ({appliedDiscount.name}):</span>
                                        <span className="font-semibold">-${(quote.discount_amount || 0).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pb-2">
                                    <span>Tax ({location?.tax_rate || 0}%):</span>
                                    <span className="font-semibold">${(() => {
                                        const stored = quote.tax_amount ?? quote.tax;
                                        if (stored && stored > 0) return stored.toFixed(2);
                                        const derived = (quote.total || 0) - (quote.subtotal || 0) + (quote.discount_amount || 0);
                                        return (derived > 0 ? derived : 0).toFixed(2);
                                    })()}</span>
                                </div>
                                <div className="flex justify-between text-xl font-bold text-blue-900 pt-2 border-t-2">
                                    <span>Total:</span>
                                    <span>${(quote.total || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {quote.notes && (
                        <div className="bg-slate-50 p-4 rounded-lg border">
                            <div className="font-semibold mb-2">Notes:</div>
                            <div className="text-gray-700 whitespace-pre-wrap">{quote.notes}</div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="text-sm text-gray-500 border-t pt-4 mt-8">
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                                <p>This quote is valid for 30 days from the date of issue.</p>
                                <p className="mt-2">Payment is due at the time of service unless other arrangements have been made.</p>
                                <p className="mt-3 font-semibold text-gray-700">Cherry Financing and Care Credit Available</p>
                            </div>
                            <div className="flex-shrink-0 text-center">
                                <img 
                                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695939a556b8082002a35a68/93c585704_CHCPaymentOptions.jpg"
                                    alt="Scan for Payment Options"
                                    style={{width: '90px', height: 'auto'}}
                                />
                                <p className="text-xs mt-1">Scan for Payment Options</p>
                            </div>
                        </div>
                    </div>
                </div>
            </PrintableDocument>

            <EditQuoteDialog
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
                quote={quote}
                onSuccess={() => {
                    queryClient.invalidateQueries(['quote', quoteId]);
                    queryClient.invalidateQueries(['quotes']);
                }}
            />
        </div>
    );
}
