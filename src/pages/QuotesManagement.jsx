function safeParse(v,f=[]){if(v==null)return f;if(typeof v!=="string")return v;try{return JSON.parse(v)}catch{return f}}
import React, { useState } from "react";
import { entities, uploadFile, invokeLLM, generateImage, sendEmail, agentChat } from "@/api/supabaseHelpers";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SearchBar from "../components/SearchBar";
import { FileText, Eye, Calendar, User, Filter, Calculator } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function QuotesManagement() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    
    const { data: quotes = [], isLoading } = useQuery({
        queryKey: ['quotes'],
        queryFn: () => entities.Quote.list('-created_at', 200),
    });

    const { data: locations = [] } = useQuery({
        queryKey: ['clinicLocations'],
        queryFn: () => entities.ClinicLocation.list(),
    });

    const filteredQuotes = quotes.filter(quote => {
        const matchesSearch = 
            (quote.quote_number || quote.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
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
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl p-6 text-white mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3">
                            <Calculator className="w-7 h-7" />
                            Quotes Management
                        </h1>
                        <p className="text-teal-100 mt-1">Track and manage all patient quotes</p>
                    </div>
                    <Link to={createPageUrl("CheckoutQuote")}>
                        <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 border">
                            <FileText className="w-4 h-4 mr-2" />
                            Create New Quote
                        </Button>
                    </Link>
                </div>
                <div className="flex flex-wrap gap-3 mt-4">
                    {[
                        { label: 'Total', count: quotes.length, filter: 'all', color: 'bg-white/20' },
                        { label: 'Draft', count: getStatusCount('draft'), filter: 'draft', color: 'bg-white/15' },
                        { label: 'Sent', count: getStatusCount('sent'), filter: 'sent', color: 'bg-white/15' },
                        { label: 'Accepted', count: getStatusCount('accepted'), filter: 'accepted', color: 'bg-white/15' },
                        { label: 'Expired', count: getStatusCount('expired'), filter: 'expired', color: 'bg-white/15' },
                    ].map(s => (
                        <button
                            key={s.filter}
                            onClick={() => setStatusFilter(s.filter)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                statusFilter === s.filter ? 'bg-white text-teal-700 shadow-md' : `${s.color} text-white hover:bg-white/25`
                            }`}
                        >
                            <span className="font-bold text-lg mr-1.5">{s.count}</span>{s.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search by quote number or patient name..."
                    />
                </CardContent>
            </Card>

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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                </div>
            ) : filteredQuotes.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No quotes found</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {(() => {
                        // Group quotes by month/year
                        const grouped = {};
                        filteredQuotes.forEach(quote => {
                            const date = new Date(quote.created_at);
                            const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
                            const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                            if (!grouped[key]) grouped[key] = { label, quotes: [] };
                            grouped[key].quotes.push(quote);
                        });
                        // Sort by most recent month first
                        const sortedKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

                        return sortedKeys.map(key => {
                            const group = grouped[key];
                            const monthTotal = group.quotes.reduce((sum, q) => sum + (q.total || 0), 0);
                            return (
                                <div key={key}>
                                    <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-teal-200">
                                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                            <Calendar className="w-5 h-5 text-teal-600" />
                                            {group.label}
                                        </h2>
                                        <div className="flex items-center gap-3 text-sm">
                                            <span className="text-gray-500">{group.quotes.length} quote{group.quotes.length !== 1 ? 's' : ''}</span>
                                            <span className="font-bold text-teal-700">${monthTotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div className="grid gap-3">
                                        {group.quotes.map(quote => {
                                            const location = locations.find(l => l.id === (quote.clinic_location_id || quote.location_id));
                                            const items = safeParse(quote.items);
                                            return (
                                                <Card key={quote.id} className="hover:shadow-lg transition-all border hover:border-teal-200">
                                                    <CardContent className="p-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="font-bold text-gray-900">
                                                                        {quote.quote_number || `Q-${quote.id?.slice(0,8).toUpperCase()}`}
                                                                    </span>
                                                                    <Badge className={`text-xs ${getStatusColor(quote.status)}`}>
                                                                        {(quote.status || 'draft').charAt(0).toUpperCase() + (quote.status || 'draft').slice(1)}
                                                                    </Badge>
                                                                    {quote.patient_name && (
                                                                        <span className="text-sm text-gray-500">• {quote.patient_name}</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                                                    <span>{new Date(quote.created_at).toLocaleDateString()}</span>
                                                                    <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
                                                                    {location && <span>{location.name}</span>}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xl font-bold text-teal-800">
                                                                    ${(quote.total || 0).toFixed(2)}
                                                                </span>
                                                                <Link to={createPageUrl(`QuoteDetail?id=${quote.id}`)}>
                                                                    <Button variant="outline" size="sm" className="h-8">
                                                                        <Eye className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        });
                    })()}
                </div>
            )}
        </div>
    );
}
