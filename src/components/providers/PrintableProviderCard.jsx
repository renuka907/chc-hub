import React from "react";
import { Mail, Phone, MapPin } from "lucide-react";

export default function PrintableProviderCard({ providers, locations, clinicName }) {
    const getClinicName = (locationId) => {
        if (!locationId) return "Not assigned";
        const clinic = locations.find(l => l.id === locationId);
        return clinic?.name || "Not assigned";
    };

    const groupedBySpecialty = {};
    providers.forEach(provider => {
        if (!groupedBySpecialty[provider.specialty]) {
            groupedBySpecialty[provider.specialty] = [];
        }
        groupedBySpecialty[provider.specialty].push(provider);
    });

    return (
        <div className="hidden print:block w-full">
            {/* Header */}
            <div className="text-center mb-8 pb-4 border-b-2 border-gray-800">
                <h1 className="text-3xl font-bold mb-2">{clinicName}</h1>
                <h2 className="text-xl font-semibold text-gray-700">Provider Directory</h2>
                <p className="text-sm text-gray-600 mt-2">{new Date().toLocaleDateString()}</p>
            </div>

            {/* Providers by Specialty */}
            {Object.entries(groupedBySpecialty).map(([specialty, providerList]) => (
                <div key={specialty} className="mb-8 page-break">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-400">
                        {specialty}
                    </h3>

                    <div className="space-y-4">
                        {providerList.map((provider) => (
                            <div key={provider.id} className="border border-gray-300 p-4 break-inside-avoid">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-bold text-gray-900">
                                            {provider.full_name}
                                        </h4>
                                        {provider.credentials && (
                                            <p className="text-sm font-semibold text-gray-700">
                                                {provider.credentials}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {provider.bio && (
                                    <p className="text-sm text-gray-600 mb-2 font-semibold">
                                        {provider.bio}
                                    </p>
                                )}

                                <div className="text-sm space-y-1">
                                    {provider.phone && (
                                        <div className="flex gap-2">
                                            <span className="font-semibold text-gray-700 w-16">Phone:</span>
                                            <span>{provider.phone}</span>
                                        </div>
                                    )}
                                    {provider.address && (
                                        <div className="flex gap-2">
                                            <span className="font-semibold text-gray-700 w-16">Address:</span>
                                            <span>{provider.address}</span>
                                        </div>
                                    )}
                                    {provider.email && (
                                        <div className="flex gap-2">
                                            <span className="font-semibold text-gray-700 w-16">Email:</span>
                                            <span>{provider.email}</span>
                                        </div>
                                    )}
                                </div>

                                {provider.languages && (
                                    <p className="text-xs text-gray-600 mt-2">
                                        Languages: {JSON.parse(provider.languages || '[]').join(", ") || "English"}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Footer */}
            <div className="mt-8 pt-4 border-t-2 border-gray-800 text-center text-xs text-gray-600">
                <p>This directory is for internal reference only</p>
            </div>

            <style>{`
                @media print {
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    .page-break {
                        page-break-inside: avoid;
                    }
                }
            `}</style>
        </div>
    );
}