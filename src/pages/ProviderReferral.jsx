import React, { useState, useMemo } from "react";
import { entities } from "@/api/supabaseHelpers";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Phone, MapPin, Printer as PrinterIcon, Edit, Plus, X, Mail, Globe, ChevronDown, ChevronUp } from "lucide-react";
import PrintableProviderCard from "@/components/providers/PrintableProviderCard";
import EditProviderDialog from "@/components/providers/EditProviderDialog";

function safeParse(v, f = []) {
    if (v == null) return f;
    if (typeof v !== "string") return v;
    try { return JSON.parse(v); } catch { return f; }
}

export default function ProviderReferral() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSpecialty, setSelectedSpecialty] = useState("");
    const [editingProvider, setEditingProvider] = useState(null);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const queryClient = useQueryClient();

    const { data: providers = [], isLoading } = useQuery({
        queryKey: ['providers'],
        queryFn: () => entities.Provider.filter({ status: 'active' }),
        initialData: [],
    });

    const { data: locations = [] } = useQuery({
        queryKey: ['clinicLocations'],
        queryFn: () => entities.ClinicLocation.list(),
        initialData: [],
    });

    const specialties = useMemo(() => {
        return [...new Set(providers.map(p => p.specialty).filter(Boolean))].sort();
    }, [providers]);

    const filteredProviders = useMemo(() => {
        return providers.filter(p => {
            const term = searchTerm.toLowerCase();
            const matchesSearch = !term || 
                p.full_name?.toLowerCase().includes(term) ||
                p.specialty?.toLowerCase().includes(term) ||
                p.address?.toLowerCase().includes(term);
            const matchesSpecialty = !selectedSpecialty || p.specialty === selectedSpecialty;
            return matchesSearch && matchesSpecialty;
        });
    }, [providers, searchTerm, selectedSpecialty]);

    const groupedBySpecialty = useMemo(() => {
        const groups = {};
        filteredProviders.forEach(p => {
            const spec = p.specialty || "Other";
            if (!groups[spec]) groups[spec] = [];
            groups[spec].push(p);
        });
        return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
    }, [filteredProviders]);

    const handleSaveProvider = () => {
        queryClient.invalidateQueries(['providers']);
        setShowEditDialog(false);
    };

    const handlePrint = () => window.print();

    const handlePrintCard = (providersList) => {
        if (!providersList?.length) return;
        const isSingle = providersList.length === 1;
        const cards = providersList.map(p => {
            const addresses = (() => {
                try {
                    const arr = typeof p.addresses === 'string' ? JSON.parse(p.addresses) : p.addresses;
                    return Array.isArray(arr) ? arr : [];
                } catch { return []; }
            })();
            return `
            <div style="border:2px solid #ccc;padding:${isSingle ? '20px 24px' : '12px 14px'};border-radius:8px;break-inside:avoid;font-size:${isSingle ? '16px' : '13px'};line-height:1.5;margin-bottom:${isSingle ? '16px' : '8px'};">
                <p style="font-size:${isSingle ? '22px' : '16px'};font-weight:bold;margin:0;color:#111;">${p.full_name}</p>
                ${p.credentials ? `<p style="font-size:${isSingle ? '16px' : '13px'};color:#7c3aed;font-weight:600;margin:2px 0 4px;">${p.credentials}</p>` : ''}
                ${p.group_name ? `<p style="margin:2px 0;color:#555;font-style:italic;">${p.group_name}</p>` : ''}
                ${p.specialty ? `<p style="margin:4px 0;color:#555;font-size:${isSingle ? '15px' : '12px'};">Specialty: <b>${p.specialty}</b></p>` : ''}
                <hr style="border:none;border-top:1px solid #ddd;margin:8px 0;">
                ${p.phone ? `<p style="margin:3px 0;color:#333;"><b>Phone:</b> ${p.phone}</p>` : ''}
                ${p.fax ? `<p style="margin:3px 0;color:#333;"><b>Fax:</b> ${p.fax}</p>` : ''}
                ${p.email ? `<p style="margin:3px 0;color:#333;"><b>Email:</b> ${p.email}</p>` : ''}
                ${p.website ? `<p style="margin:3px 0;color:#333;"><b>Website:</b> ${p.website}</p>` : ''}
                ${p.address ? `<p style="margin:3px 0;color:#333;"><b>Address:</b> ${p.address}</p>` : ''}
                ${addresses.length > 0 ? `
                    <hr style="border:none;border-top:1px solid #ddd;margin:8px 0;">
                    <p style="font-weight:bold;margin:4px 0 2px;font-size:${isSingle ? '14px' : '12px'};">Locations:</p>
                    ${addresses.map(a => `
                        <div style="margin:4px 0 6px 12px;padding-left:8px;border-left:3px solid #7c3aed;">
                            ${a.location_name ? `<p style="font-weight:600;margin:0;">${a.location_name}</p>` : ''}
                            ${a.address ? `<p style="margin:1px 0;color:#444;">${a.address}</p>` : ''}
                            ${a.phone ? `<p style="margin:1px 0;color:#444;">Ph: ${a.phone}</p>` : ''}
                            ${a.fax ? `<p style="margin:1px 0;color:#444;">Fx: ${a.fax}</p>` : ''}
                        </div>
                    `).join('')}
                ` : ''}
            </div>
        `}).join('');
        const html = `<html><head><style>
            body{font-family:Arial,sans-serif;margin:24px;}
            .grid{display:grid;grid-template-columns:${isSingle ? '1fr' : '1fr 1fr'};gap:12px;}
            @media print{body{margin:12px;}}
        </style></head><body>
            <div style="text-align:center;margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid #333;">
                <h1 style="font-size:22px;margin:0;">Provider Directory</h1>
                <p style="font-size:12px;color:#888;margin:4px 0 0;">${new Date().toLocaleDateString()}</p>
            </div>
            <div class="grid">${cards}</div></body></html>`;
        const w = window.open('', '', 'width=800,height=900');
        w.document.write(html);
        w.document.close();
        setTimeout(() => w.print(), 250);
    };

    const specColors = {
        'Breast Surgery': 'bg-pink-100 text-pink-700',
        'Cardiology': 'bg-red-100 text-red-700',
        'Dermatology': 'bg-amber-100 text-amber-700',
        'Endocrinology': 'bg-teal-100 text-teal-700',
        'ENT': 'bg-cyan-100 text-cyan-700',
        'Gastroenterology': 'bg-orange-100 text-orange-700',
        'GYN Oncology': 'bg-fuchsia-100 text-fuchsia-700',
        'Medical Marijuana': 'bg-green-100 text-green-700',
        'Mental Health': 'bg-blue-100 text-blue-700',
        'Neurology': 'bg-indigo-100 text-indigo-700',
        'Ophthalmologist': 'bg-sky-100 text-sky-700',
        'Orthopedics': 'bg-slate-100 text-slate-700',
        'PCP': 'bg-emerald-100 text-emerald-700',
        'Physiatrist': 'bg-violet-100 text-violet-700',
        'Plastic Surgery': 'bg-rose-100 text-rose-700',
        'Podiatry': 'bg-lime-100 text-lime-700',
        'Psychiatry': 'bg-purple-100 text-purple-700',
        'Urology': 'bg-yellow-100 text-yellow-700',
        'Vascular Surgeon': 'bg-red-100 text-red-700',
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-violet-600 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Provider Directory</h1>
                        <p className="text-purple-200 text-sm mt-1">{providers.length} providers across {specialties.length} specialties</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Button onClick={() => { setEditingProvider(null); setShowEditDialog(true); }} size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
                            <Plus className="w-4 h-4 mr-1" /> Add
                        </Button>
                        <Button onClick={handlePrint} size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
                            <PrinterIcon className="w-4 h-4 mr-1" /> Print All
                        </Button>
                        {selectedIds.size > 0 && (
                            <>
                                <Button onClick={() => handlePrintCard(filteredProviders.filter(p => selectedIds.has(p.id)))} size="sm" className="bg-white text-purple-700 hover:bg-purple-50 border-0 font-semibold">
                                    <PrinterIcon className="w-4 h-4 mr-1" /> Print Selected ({selectedIds.size})
                                </Button>
                                <Button onClick={() => setSelectedIds(new Set())} size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
                                    <X className="w-4 h-4 mr-1" /> Clear
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search by name, specialty, or location..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <select
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white min-w-[180px]"
                >
                    <option value="">All Specialties</option>
                    {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {(searchTerm || selectedSpecialty) && (
                    <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(""); setSelectedSpecialty(""); }} className="text-gray-500">
                        <X className="w-4 h-4 mr-1" /> Clear
                    </Button>
                )}
            </div>

            {/* Print Component (hidden) */}
            <PrintableProviderCard providers={filteredProviders} locations={locations} clinicName="CHC Hub - Provider Directory" />

            {/* Edit Dialog */}
            <EditProviderDialog provider={editingProvider} open={showEditDialog} onOpenChange={setShowEditDialog} onSave={handleSaveProvider} />

            {/* Provider List */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
                </div>
            ) : filteredProviders.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No providers found.</div>
            ) : (
                <div className="space-y-6">
                    {groupedBySpecialty.map(([specialty, list]) => (
                        <div key={specialty}>
                            <div className="flex items-center gap-2 mb-3">
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${specColors[specialty] || 'bg-gray-100 text-gray-700'}`}>
                                    {specialty}
                                </span>
                                <span className="text-xs text-gray-400">{list.length}</span>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                                {list.map(provider => {
                                    const isExpanded = expandedId === provider.id;
                                    return (
                                        <div key={provider.id} className="hover:bg-gray-50/50 transition-colors">
                                            {/* Main Row */}
                                            <div
                                                className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                                                onClick={() => setExpandedId(isExpanded ? null : provider.id)}
                                            >
                                                <button
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        setSelectedIds(prev => {
                                                            const next = new Set(prev);
                                                            next.has(provider.id) ? next.delete(provider.id) : next.add(provider.id);
                                                            return next;
                                                        });
                                                    }}
                                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                                        selectedIds.has(provider.id) ? 'bg-purple-600 border-purple-600' : 'border-gray-300 hover:border-purple-400'
                                                    }`}
                                                >
                                                    {selectedIds.has(provider.id) && (
                                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                    )}
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-gray-900 truncate">{provider.full_name}</span>
                                                        {provider.credentials && (
                                                            <span className="text-xs text-purple-600 font-medium shrink-0">{provider.credentials}</span>
                                                        )}
                                                    </div>
                                                    {provider.address && (
                                                        <p className="text-xs text-gray-500 truncate mt-0.5">{provider.address}</p>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-3 shrink-0">
                                                    {provider.phone && (
                                                        <a href={`tel:${provider.phone}`} onClick={e => e.stopPropagation()} className="text-xs text-gray-600 hover:text-purple-600 hidden sm:flex items-center gap-1">
                                                            <Phone className="w-3.5 h-3.5" />
                                                            <span className="hidden md:inline">{provider.phone}</span>
                                                        </a>
                                                    )}
                                                    <button onClick={e => { e.stopPropagation(); handlePrintCard([provider]); }} className="p-1.5 hover:bg-gray-200 rounded-lg" title="Print">
                                                        <PrinterIcon className="w-3.5 h-3.5 text-gray-400" />
                                                    </button>
                                                    <button onClick={e => { e.stopPropagation(); setEditingProvider(provider); setShowEditDialog(true); }} className="p-1.5 hover:bg-gray-200 rounded-lg" title="Edit">
                                                        <Edit className="w-3.5 h-3.5 text-gray-400" />
                                                    </button>
                                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                                </div>
                                            </div>

                                            {/* Expanded Details */}
                                            {isExpanded && (
                                                <div className="px-4 pb-4 pt-1 bg-gray-50/80 border-t border-gray-100">
                                                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                                                        {provider.phone && (
                                                            <div className="flex items-center gap-2 text-gray-700">
                                                                <Phone className="w-4 h-4 text-purple-400" />
                                                                <a href={`tel:${provider.phone}`} className="hover:text-purple-600">{provider.phone}</a>
                                                            </div>
                                                        )}
                                                        {provider.fax && (
                                                            <div className="flex items-center gap-2 text-gray-700">
                                                                <PrinterIcon className="w-4 h-4 text-purple-400" />
                                                                <span>Fax: {provider.fax}</span>
                                                            </div>
                                                        )}
                                                        {provider.email && (
                                                            <div className="flex items-center gap-2 text-gray-700">
                                                                <Mail className="w-4 h-4 text-purple-400" />
                                                                <a href={`mailto:${provider.email}`} className="hover:text-purple-600">{provider.email}</a>
                                                            </div>
                                                        )}
                                                        {provider.website && (
                                                            <div className="flex items-center gap-2 text-gray-700">
                                                                <Globe className="w-4 h-4 text-purple-400" />
                                                                <a href={provider.website} target="_blank" rel="noopener noreferrer" className="hover:text-purple-600 truncate">{provider.website}</a>
                                                            </div>
                                                        )}
                                                        {provider.address && (
                                                            <div className="flex items-start gap-2 text-gray-700 sm:col-span-2">
                                                                <MapPin className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                                                                <span>{provider.address}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {provider.bio && (
                                                        <p className="text-sm text-gray-600 mt-3">{provider.bio}</p>
                                                    )}
                                                    {provider.group_name && (
                                                        <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Group:</span> {provider.group_name}</p>
                                                    )}
                                                    {(() => {
                                                        const addrs = safeParse(provider.addresses);
                                                        if (!addrs?.length) return null;
                                                        return (
                                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Additional Locations</p>
                                                                <div className="grid sm:grid-cols-2 gap-2">
                                                                    {addrs.map((addr, i) => (
                                                                        <div key={i} className="bg-white rounded-lg border border-gray-200 p-2.5 text-xs">
                                                                            <p className="font-semibold text-gray-900">{addr.location_name}</p>
                                                                            {addr.address && <p className="text-gray-600 mt-0.5">{addr.address}</p>}
                                                                            {addr.phone && <p className="text-gray-600">Ph: {addr.phone}</p>}
                                                                            {addr.fax && <p className="text-gray-600">Fx: {addr.fax}</p>}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                    {provider.notes && (
                                                        <div className="mt-3 bg-blue-50 rounded-lg p-3 text-xs text-blue-800">
                                                            <span className="font-semibold">Notes:</span> {provider.notes}
                                                        </div>
                                                    )}
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
        </div>
    );
}
