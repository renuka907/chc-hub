import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SearchBar from "../components/SearchBar";
import { FileText, Eye, Calendar, User, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function QuotesManagement() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    
    const { data: quotes = [], isLoading } = useQuery({
        queryKey: ['quotes'],
        queryFn: () => base44.entities.Quote.list('-created_date', 200),
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false,
    });

    const { data: locations = [] } = useQuery({
        queryKey: ['clinicLocations'],
        queryFn: () => base44.entities.ClinicLocation.list(),
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false,
    });

    const filteredQuotes = quotes.filter(quote => {
        const matchesSearch = 
            quote.quote_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            quote.patient_name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || quote.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status) => {
        const colors = {
            'draft': 'bg-gray-100 text-gray-800',
            'sent': 'bg-blue-100 text-blue-800',
            'accepted': 'bg-green-100 text-green-800',
            'expired': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusCount = (status) => {
        return quotes.filter(q => q.status === status).length;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Quotes Management</h1>
                    <p className="text-gray-600">Track and manage all patient quotes</p>
                </div>
                <Link to={createPageUrl("CheckoutQuote")}>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <FileText className="w-4 h-4 mr-2" />
                        Create New Quote
                    </Button>
                </Link>
            </div>

            {/* Search and Stats */}
            <div className="grid md:grid-cols-5 gap-4">
                <Card className="md:col-span-5">
                    <CardContent className="pt-6">
                        <SearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search by quote number or patient name..."
                        />
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter("all")}>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-gray-900">{quotes.length}</div>
                            <div className="text-sm text-gray-600 mt-1">Total Quotes</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter("draft")}>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-gray-600">{getStatusCount('draft')}</div>
                            <div className="text-sm text-gray-600 mt-1">Draft</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter("sent")}>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600">{getStatusCount('sent')}</div>
                            <div className="text-sm text-gray-600 mt-1">Sent</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter("accepted")}>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-green-600">{getStatusCount('accepted')}</div>
                            <div className="text-sm text-gray-600 mt-1">Accepted</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter("expired")}>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-red-600">{getStatusCount('expired')}</div>
                            <div className="text-sm text-gray-600 mt-1">Expired</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Active Filter Badge */}
            {statusFilter !== "all" && (
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Filtering by:</span>
                    <Badge className={getStatusColor(statusFilter)}>
                        {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                    </Badge>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setStatusFilter("all")}
                        className="text-xs"
                    >
                        Clear Filter
                    </Button>
                </div>
            )}

            {/* Quotes List */}
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            ) : filteredQuotes.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No quotes found</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredQuotes.map(quote => {
                        const location = locations.find(l => l.id === quote.clinic_location_id);
                        const items = quote.items ? JSON.parse(quote.items) : [];
                        
                        return (
                            <Card key={quote.id} className="hover:shadow-lg transition-all border-2 hover:border-blue-200">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-gray-900">
                                                    {quote.quote_number}
                                                </h3>
                                                <Badge className={getStatusColor(quote.status)}>
                                                    {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                                                </Badge>
                                            </div>
                                            <div className="space-y-1 text-sm text-gray-600">
                                                {quote.patient_name && (
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4" />
                                                        <span>{quote.patient_name}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{new Date(quote.created_date).toLocaleDateString()}</span>
                                                </div>
                                                {location && (
                                                    <div className="text-gray-500">
                                                        {location.name}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-blue-900">
                                                ${quote.total.toFixed(2)}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {items.length} item{items.length !== 1 ? 's' : ''}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-end pt-4 border-t">
                                        <Link to={createPageUrl(`QuoteDetail?id=${quote.id}`)}>
                                            <Button variant="outline" size="sm">
                                                <Eye className="w-4 h-4 mr-2" />
                                                View Details
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}