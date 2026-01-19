import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Mail, Phone, MapPin, Star, Filter, X, Printer } from "lucide-react";
import PrintableProviderCard from "@/components/providers/PrintableProviderCard";

export default function ProviderReferral() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSpecialty, setSelectedSpecialty] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [showPrintPreview, setShowPrintPreview] = useState(false);

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
            if (!grouped[provider.specialty]) {
                grouped[provider.specialty] = [];
            }
            grouped[provider.specialty].push(provider);
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

    const handlePrintCard = (provider) => {
        const printContent = `
            <div style="font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #6d28d9; margin-bottom: 20px;">${provider.full_name}</h2>
                ${provider.credentials ? `<p style="color: #8b5cf6; font-weight: bold; margin-bottom: 10px;">${provider.credentials}</p>` : ''}
                <p style="color: #666; font-size: 14px; margin-bottom: 20px;">${provider.specialty}</p>
                
                ${provider.bio ? `<p style="color: #333; margin-bottom: 20px;">${provider.bio}</p>` : ''}
                
                <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-bottom: 20px;">
                    ${provider.email ? `<p style="margin: 8px 0;"><strong>Email:</strong> ${provider.email}</p>` : ''}
                    ${provider.phone ? `<p style="margin: 8px 0;"><strong>Phone:</strong> ${provider.phone}</p>` : ''}
                    ${provider.address ? `<p style="margin: 8px 0;"><strong>Address:</strong> ${provider.address}</p>` : ''}
                    <p style="margin: 8px 0;"><strong>Clinic:</strong> ${getClinicName(provider.clinic_location_id)}</p>
                </div>
                
                ${provider.languages ? `<p style="font-size: 12px; color: #666;">Languages: ${JSON.parse(provider.languages || '[]').join(", ") || "English"}</p>` : ''}
            </div>
        `;
        
        const newWindow = window.open('', '', 'width=600,height=700');
        newWindow.document.write(printContent);
        newWindow.document.close();
        setTimeout(() => newWindow.print(), 250);
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
                        onClick={handlePrint}
                        className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        <Printer className="w-4 h-4" />
                        Print Directory
                    </Button>
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
                                    <Card key={provider.id} className="hover:shadow-lg transition-shadow">
                                        <CardContent className="pt-6">
                                            <div className="flex gap-4">
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
                                                        onClick={() => handlePrintCard(provider)}
                                                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                                        title="Print provider card"
                                                    >
                                                        <Printer className="w-4 h-4 text-gray-600 hover:text-purple-600" />
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
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <MapPin className="w-4 h-4 text-purple-500" />
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