import React from "react";

function safeParse(val, fallback = []) {
    if (val == null) return fallback;
    if (typeof val !== "string") return val;
    try { return JSON.parse(val); } catch { return fallback; }
}

export default function PrintableProviderCard({ providers, locations, clinicName }) {
    const getClinicName = (locationId) => {
        if (!locationId) return null;
        const clinic = locations.find(l => l.id === locationId);
        return clinic?.name || null;
    };

    const groupedBySpecialty = {};
    providers.forEach(provider => {
        const spec = provider.specialty || "Other";
        if (!groupedBySpecialty[spec]) groupedBySpecialty[spec] = [];
        groupedBySpecialty[spec].push(provider);
    });

    return (
        <div className="hidden print:block w-full">
            <style>{`
                @media print {
                    body { margin: 0; padding: 0; font-size: 11px; }
                    .print-header { text-align: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #333; }
                    .print-header h1 { font-size: 18px; margin: 0 0 2px 0; }
                    .print-header h2 { font-size: 13px; margin: 0; color: #555; font-weight: 600; }
                    .print-header p { font-size: 10px; color: #888; margin: 4px 0 0 0; }
                    .spec-section { margin-bottom: 10px; }
                    .spec-title { font-size: 13px; font-weight: bold; background: #f3f0ff; padding: 3px 8px; margin-bottom: 6px; border-left: 3px solid #7c3aed; }
                    .provider-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
                    .provider-card { border: 1px solid #ddd; padding: 8px 10px; border-radius: 4px; break-inside: avoid; font-size: 10.5px; line-height: 1.4; }
                    .provider-card .name { font-size: 12px; font-weight: bold; margin: 0; }
                    .provider-card .creds { font-size: 10px; color: #7c3aed; font-weight: 600; margin: 0; }
                    .provider-card .detail { margin: 1px 0; color: #444; }
                    .provider-card .detail b { color: #333; font-weight: 600; }
                    .print-footer { margin-top: 12px; padding-top: 6px; border-top: 1px solid #ccc; text-align: center; font-size: 9px; color: #999; }
                }
            `}</style>

            <div className="print-header">
                <h1>{clinicName}</h1>
                <h2>Provider Directory</h2>
                <p>{new Date().toLocaleDateString()}</p>
            </div>

            {Object.entries(groupedBySpecialty).map(([specialty, providerList]) => (
                <div key={specialty} className="spec-section">
                    <div className="spec-title">{specialty}</div>
                    <div className="provider-grid">
                        {providerList.map((provider) => {
                            const clinic = getClinicName(provider.clinic_location_id);
                            return (
                                <div key={provider.id} className="provider-card">
                                    <p className="name">{provider.full_name}</p>
                                    {provider.credentials && <p className="creds">{provider.credentials}</p>}
                                    {provider.phone && <p className="detail"><b>Ph:</b> {provider.phone}</p>}
                                    {provider.fax && <p className="detail"><b>Fx:</b> {provider.fax}</p>}
                                    {provider.email && <p className="detail"><b>Em:</b> {provider.email}</p>}
                                    {provider.address && <p className="detail"><b>Addr:</b> {provider.address}</p>}
                                    {clinic && <p className="detail"><b>Clinic:</b> {clinic}</p>}
                                    {provider.website && <p className="detail"><b>Web:</b> {provider.website}</p>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            <div className="print-footer">
                <p>For internal reference only</p>
            </div>
        </div>
    );
}
