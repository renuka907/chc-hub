import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
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

    const { data: allQuotes = [], isLoading: quotesLoading } = useQuery({
        queryKey: ['quotes'],
        queryFn: () => base44.entities.Quote.list('-created_date', 200),
        staleTime: Infinity,
        cacheTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false,
    });

    const quote = allQuotes.find(q => q.id === quoteId);

    const { data: locations = [] } = useQuery({
        queryKey: ['clinicLocations'],
        queryFn: () => base44.entities.ClinicLocation.list(),
        staleTime: 5 * 60 * 1000,
    });

    const { data: discounts = [] } = useQuery({
        queryKey: ['discounts'],
        queryFn: () => base44.entities.Discount.list(),
        staleTime: 5 * 60 * 1000,
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }) => base44.entities.Quote.update(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quote', quoteId] });
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
        },
    });
    const location = quote ? locations.find(l => l.id === quote.clinic_location_id) : null;
    const items = quote ? (quote.items ? JSON.parse(quote.items) : []) : [];
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
        if (quote) {
            updateStatusMutation.mutate({ id: quoteId, status: newStatus });
        }
    };

    // Auto-trigger print when quote loads
    React.useEffect(() => {
        if (quote && autoPrint) {
            // Wait a bit for rendering to complete
            setTimeout(() => {
                window.print();
            }, 500);
        }
    }, [quote, autoPrint]);

    if (!quote && !quotesLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500">Quote not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Print Styles */}
            <style>
                {`
                    @media print {
                        @page {
                            margin: 0.3cm;
                        }
                        body * {
                            visibility: hidden;
                        }
                        .printable-document,
                        .printable-document * {
                            visibility: visible;
                            color: #000 !important;
                        }
                        .printable-document {
                            position: absolute !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 100%;
                            padding: 5px !important;
                            font-size: 15px !important;
                            line-height: 1.5 !important;
                        }
                        .printable-document h1 {
                            font-size: 20px !important;
                            margin-bottom: 4px !important;
                        }
                        .printable-document h3 {
                            font-size: 16px !important;
                            margin-bottom: 4px !important;
                        }
                        .printable-document .space-y-6 > * + * {
                            margin-top: 6px !important;
                        }
                        .printable-document table {
                            font-size: 14px !important;
                            border-collapse: collapse !important;
                        }
                        .printable-document table th,
                        .printable-document table td {
                            padding: 4px 6px !important;
                            line-height: 1.4 !important;
                            border-bottom: 1.5px solid #333 !important;
                        }
                        .printable-document table thead tr {
                            background-color: #e5e7eb !important;
                        }
                        .printable-document table tbody tr:nth-child(even) {
                            background-color: #f9fafb !important;
                        }
                        .printable-document .text-xl {
                            font-size: 18px !important;
                        }
                        .printable-document .grid {
                            gap: 4px !important;
                        }
                        .printable-document img {
                            max-height: 50px !important;
                        }
                        .printable-document .pb-6 {
                            padding-bottom: 4px !important;
                        }
                        .printable-document .mb-4 {
                            margin-bottom: 4px !important;
                        }
                        .printable-document .p-3 {
                            padding: 2px 4px !important;
                        }
                        .printable-document .p-4 {
                            padding: 4px !important;
                        }
                        .printable-document .pt-4 {
                            padding-top: 4px !important;
                        }
                        .printable-document .mt-8 {
                            margin-top: 6px !important;
                        }
                        .printable-document .text-sm {
                            font-size: 13px !important;
                        }
                        .printable-document .text-xs {
                            font-size: 12px !important;
                        }
                        .no-print {
                            display: none !important;
                        }
                    }
                `}
            </style>

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
                        <Select value={quote?.status || 'draft'} onValueChange={handleStatusChange}>
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
                    <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700">
                        <Printer className="w-4 h-4 mr-2" />
                        Print / PDF
                    </Button>
                </div>
            </div>

            {/* Printable Content */}
            {quote && (
            <PrintableDocument title="Price Quote">
                <div className="space-y-6">
                    {/* Header Info */}
                    <div className="grid md:grid-cols-2 gap-6 pb-6 border-b">
                        <div>
                            <div className="text-sm text-gray-500 mb-1">Quote Number</div>
                            <div className="font-bold text-lg">{quote.quote_number}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500 mb-1">Date</div>
                            <div className="font-semibold">{new Date().toLocaleDateString()}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500 mb-1">Status</div>
                            <Badge className={getStatusColor(quote.status)}>
                                {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                            </Badge>
                        </div>
                        {quote.patient_name && (
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Patient Name</div>
                                <div className="font-semibold">{quote.patient_name}</div>
                            </div>
                        )}
                        {location && (
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Clinic Location</div>
                                <div className="font-semibold">{location.name}</div>
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
                                    const itemSubtotal = item.price * item.quantity;
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
                    {quote.show_totals !== false && (
                        <div className="flex justify-end">
                            <div className="w-64 space-y-2">
                                <div className="flex justify-between pb-2">
                                    <span>Subtotal:</span>
                                    <span className="font-semibold">${quote.subtotal.toFixed(2)}</span>
                                </div>
                                {quote.discount_amount > 0 && appliedDiscount && (
                                    <div className="flex justify-between pb-2 text-green-600">
                                        <span>Discount ({appliedDiscount.name}):</span>
                                        <span className="font-semibold">-${quote.discount_amount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pb-2">
                                    <span>Tax ({location?.tax_rate}%):</span>
                                    <span className="font-semibold">${quote.tax_amount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xl font-bold text-blue-900 pt-2 border-t-2">
                                    <span>Total:</span>
                                    <span>${quote.total.toFixed(2)}</span>
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
                        <p>This quote is valid for 30 days from the date of issue.</p>
                        <p className="mt-2">Payment is due at the time of service unless other arrangements have been made.</p>
                        <p className="mt-3 font-semibold text-gray-700">Cherry Financing and CareCredit Available</p>
                    </div>
                    </div>
                    </PrintableDocument>
                    )}

                    {quote && (
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