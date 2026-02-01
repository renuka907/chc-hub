import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Mail, Phone, MapPin, Star, Filter, X, Printer, Edit, Plus, CheckSquare } from "lucide-react";
import PrintableProviderCard from "@/components/providers/PrintableProviderCard";
import EditProviderDialog from "@/components/providers/EditProviderDialog";

export default function ProviderReferral() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSpecialty, setSelectedSpecialty] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const [editingProvider, setEditingProvider] = useState(null);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [selectedProviders, setSelectedProviders] = useState(new Set());
    const queryClient = useQueryClient();

    const { data: providers, isLoading } = useQuery({
        queryKey: ['providers'],
        queryFn: () => base44.entities.Provider.filter({ status: 'active' }),
        initialData: [],
    });

    const { data: locations } = useQuery({
        queryKey: ['clinicLocations'],
        queryFn: () => base44.entities.ClinicLocation.list(),
        initialData: [],
    });

    const specialties = useMemo(() => {
        const unique = [...new Set(providers.map(p => p.specialty))];
        return unique.sort();
    }, [providers]);

    const filteredProviders = useMemo(() => {
        return providers.filter(provider => {
            const matchesSearch = 
                provider.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                provider.specialty.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSpecialty = !selectedSpecialty || provider.specialty === selectedSpecialty;
            return matchesSearch && matchesSpecialty;
        });
    }, [providers, searchTerm, selectedSpecialty]);

    const groupedBySpecialty = useMemo(() => {
        const grouped = {};
        filteredProviders.forEach(provider => {
            // Normalize specialty to title case for grouping
            const normalizedSpecialty = provider.specialty
                .toLowerCase()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            
            if (!grouped[normalizedSpecialty]) {
                grouped[normalizedSpecialty] = [];
            }
            grouped[normalizedSpecialty].push(provider);
        });
        return grouped;
    }, [filteredProviders]);

    const getClinicName = (locationId) => {
        if (!locationId) return "Not assigned";
        const clinic = locations.find(l => l.id === locationId);
        return clinic?.name || "Not assigned";
    };

    const handlePrint = () => {
        window.print();
    };

    const handlePrintCard = (providersToprint = null) => {
        const providers = providersToprint || (selectedProviders.size > 0 ? 
            filteredProviders.filter(p => selectedProviders.has(p.id)) : 
            []);
        
        if (providers.length === 0) return;
        
        const printContent = providers.map(provider => {
            const addresses = provider.addresses ? JSON.parse(provider.addresses) : [];
            const addressesHTML = addresses.length > 0 ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                    <p style="font-weight: bold; margin-bottom: 10px;">All Locations:</p>
                    ${addresses.map(addr => `
                        <div style="margin-left: 20px; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #f3f4f6;">
                            <p style="font-weight: 600; color: #374151;">
                                ${addr.location_name}
                                ${addr.is_primary ? '<span style="margin-left: 10px; font-size: 11px; background: #ede9fe; color: #6d28d9; padding: 2px 8px; border-radius: 4px;">Primary</span>' : ''}
                            </p>
                            ${addr.address ? `<p style="margin: 4px 0; font-size: 13px; color: #6b7280;">${addr.address}</p>` : ''}
                            ${addr.phone ? `<p style="margin: 4px 0; font-size: 13px; color: #6b7280;">Phone: ${addr.phone}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : '';

            return `
                <div style="font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; page-break-after: always;">
                    <h2 style="color: #6d28d9; margin-bottom: 20px;">${provider.full_name}</h2>
                    ${provider.credentials ? `<p style="color: #8b5cf6; font-weight: bold; margin-bottom: 10px;">${provider.credentials}</p>` : ''}
                    <p style="color: #666; font-size: 14px; margin-bottom: 20px;">${provider.specialty}</p>
                    ${provider.group_name ? `<p style="color: #666; font-size: 14px; margin-bottom: 15px;"><strong>Group:</strong> ${provider.group_name}</p>` : ''}
                    
                    ${provider.bio ? `<p style="color: #333; margin-bottom: 20px;">${provider.bio}</p>` : ''}
                    
                    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-bottom: 20px;">
                        ${provider.email ? `<p style="margin: 8px 0;"><strong>Email:</strong> ${provider.email}</p>` : ''}
                        ${provider.phone ? `<p style="margin: 8px 0;"><strong>Phone:</strong> ${provider.phone}</p>` : ''}
                        ${provider.address ? `<p style="margin: 8px 0;"><strong>Address:</strong> ${provider.address}</p>` : ''}
                        <p style="margin: 8px 0;"><strong>Clinic:</strong> ${getClinicName(provider.clinic_location_id)}</p>
                    </div>
                    
                    ${addressesHTML}
                    
                    ${provider.languages ? `<p style="font-size: 12px; color: #666;">Languages: ${JSON.parse(provider.languages || '[]').join(", ") || "English"}</p>` : ''}
                </div>
            `;
        }).join('');
        
        const newWindow = window.open('', '', 'width=600,height=700');
        newWindow.document.write(printContent);
        newWindow.document.close();
        setTimeout(() => newWindow.print(), 250);
    };

    const handleEditProvider = (provider) => {
        setEditingProvider(provider);
        setShowEditDialog(true);
    };

    const handleSaveProvider = () => {
        queryClient.invalidateQueries({ queryKey: ['providers'] });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Provider Directory</h1>
                <p className="text-gray-600 mt-2">Find specialists by their medical specialty</p>
            </div>

            {/* Search and Filters */}
            <div className="space-y-4">
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <Input
                            placeholder="Search by name or specialty..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className="gap-2"
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                    </Button>
                    <Button
                        onClick={() => {
                            setEditingProvider(null);
                            setShowEditDialog(true);
                        }}
                        className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                    >
                        <Plus className="w-4 h-4" />
                        Add Provider
                    </Button>
                    <Button
                        onClick={handlePrint}
                        className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        <Printer className="w-4 h-4" />
                        Print Directory
                    </Button>
                    {selectedProviders.size > 0 && (
                        <Button
                            onClick={() => handlePrintCard()}
                            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Printer className="w-4 h-4" />
                            Print Selected ({selectedProviders.size})
                        </Button>
                    )}
                </div>

                {showFilters && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-2">
                                        Filter by Specialty
                                    </label>
                                    <select
                                        value={selectedSpecialty}
                                        onChange={(e) => setSelectedSpecialty(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    >
                                        <option value="">All Specialties</option>
                                        {specialties.map(spec => (
                                            <option key={spec} value={spec}>
                                                {spec}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {(selectedSpecialty || searchTerm) && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSearchTerm("");
                                            setSelectedSpecialty("");
                                        }}
                                        className="text-purple-600 hover:bg-purple-50"
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Clear Filters
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Print Preview Component */}
            <PrintableProviderCard 
                providers={filteredProviders} 
                locations={locations}
                clinicName="CHC Hub - Provider Directory"
            />

            {/* Edit Provider Dialog */}
            <EditProviderDialog 
                provider={editingProvider}
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
                onSave={handleSaveProvider}
            />

            {/* Results */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
            ) : filteredProviders.length === 0 ? (
                <Card>
                    <CardContent className="pt-12 text-center">
                        <p className="text-gray-600">No providers found matching your search.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-8">
                    {Object.entries(groupedBySpecialty).map(([specialty, providerList]) => (
                        <div key={specialty}>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-purple-200">
                                {specialty}
                            </h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {providerList.map((provider) => (
                                    <Card key={provider.id} className="hover:shadow-lg transition-shadow relative">
                                        <button
                                            onClick={() => {
                                                const newSelected = new Set(selectedProviders);
                                                if (newSelected.has(provider.id)) {
                                                    newSelected.delete(provider.id);
                                                } else {
                                                    newSelected.add(provider.id);
                                                }
                                                setSelectedProviders(newSelected);
                                            }}
                                            className={`absolute top-3 left-3 w-6 h-6 border-2 rounded flex items-center justify-center transition-colors ${
                                                selectedProviders.has(provider.id) 
                                                    ? 'bg-purple-600 border-purple-600' 
                                                    : 'border-gray-300 bg-white hover:border-purple-400'
                                            }`}
                                        >
                                            {selectedProviders.has(provider.id) && (
                                                <CheckSquare className="w-4 h-4 text-white" />
                                            )}
                                        </button>
                                        <CardContent className="pt-6">
                                            <div className="flex gap-4 ml-8">
                                                {provider.profile_image_url && (
                                                    <img
                                                        src={provider.profile_image_url}
                                                        alt={provider.full_name}
                                                        className="w-16 h-16 rounded-full object-cover"
                                                    />
                                                )}
                                                <div className="flex-1">
                                                    <div>
                                                        <h3 className="font-bold text-gray-900">
                                                            {provider.full_name}
                                                        </h3>
                                                        {provider.credentials && (
                                                            <p className="text-sm text-purple-600 font-medium">
                                                                {provider.credentials}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    {provider.accepting_referrals && (
                                                         <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                                                             <Star className="w-3 h-3" />
                                                             Open
                                                         </span>
                                                     )}
                                                    <button
                                                        onClick={() => handlePrintCard([provider])}
                                                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                                        title="Print provider card"
                                                    >
                                                        <Printer className="w-4 h-4 text-gray-600 hover:text-purple-600" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditProvider(provider)}
                                                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                                        title="Edit provider"
                                                    >
                                                        <Edit className="w-4 h-4 text-gray-600 hover:text-purple-600" />
                                                    </button>
                                                </div>
                                            </div>

                                            {provider.bio && (
                                                <p className="text-sm text-gray-600 mt-3">{provider.bio}</p>
                                            )}

                                            <div className="mt-4 space-y-2 text-sm">
                                                {provider.email && (
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <Mail className="w-4 h-4 text-purple-500" />
                                                        <a href={`mailto:${provider.email}`} className="hover:text-purple-600">
                                                            {provider.email}
                                                        </a>
                                                    </div>
                                                )}
                                                {provider.phone && (
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <Phone className="w-4 h-4 text-purple-500" />
                                                        <a href={`tel:${provider.phone}`} className="hover:text-purple-600">
                                                            {provider.phone}
                                                        </a>
                                                    </div>
                                                )}
                                                {provider.address && (
                                                    <div className="flex items-start gap-2 text-gray-700 text-sm">
                                                        <MapPin className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                                                        <span>{provider.address}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 text-gray-700 text-xs text-gray-500">
                                                    <MapPin className="w-4 h-4 text-gray-400" />
                                                    {getClinicName(provider.clinic_location_id)}
                                                </div>
                                            </div>

                                            {provider.languages && (
                                                <div className="mt-3 pt-3 border-t">
                                                    <p className="text-xs text-gray-600">
                                                        Languages: {JSON.parse(provider.languages || '[]').join(", ") || "English"}
                                                    </p>
                                                </div>
                                            )}

                                            {provider.notes && (
                                                <div className="mt-3 pt-3 border-t bg-blue-50 p-3 rounded">
                                                    <p className="text-xs font-semibold text-blue-900 mb-1">Notes</p>
                                                    <p className="text-xs text-blue-800">{provider.notes}</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}