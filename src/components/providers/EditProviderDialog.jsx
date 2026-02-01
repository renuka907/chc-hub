import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Globe, Printer, Search, X } from "lucide-react";

export default function EditProviderDialog({ provider, open, onOpenChange, onSave }) {
    const [formData, setFormData] = useState(null);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [showSearch, setShowSearch] = useState(false);
    const isNew = !provider;

    useEffect(() => {
        if (open) {
            if (provider) {
                const parseAddress = (addr) => {
                    if (!addr) return { street: "", suite: "", city: "", state: "", zip: "" };
                    const parts = addr.split(',').map(p => p.trim());
                    if (parts.length >= 3) {
                        const street = parts[0] || "";
                        const cityState = parts[parts.length - 2] || "";
                        const cityStateParts = cityState.split(' ');
                        const state = cityStateParts.length > 1 ? cityStateParts[cityStateParts.length - 2] : "";
                        const zip = cityStateParts.length > 1 ? cityStateParts[cityStateParts.length - 1] : "";
                        const city = cityStateParts.slice(0, cityStateParts.length - 2).join(' ');
                        return { street, suite: "", city, state, zip };
                    }
                    return { street: addr, suite: "", city: "", state: "", zip: "" };
                };

                setFormData({
                    full_name: provider.full_name || "",
                    specialty: provider.specialty || "",
                    category: provider.category || "",
                    email: provider.email || "",
                    phone: provider.phone || "",
                    fax: provider.fax || "",
                    website: provider.website || "",
                    address: provider.address || "",
                    ...parseAddress(provider.address),
                    credentials: provider.credentials || "",
                    bio: provider.bio || "",
                    notes: provider.notes || "",
                    group_name: provider.group_name || "",
                    group_member_ids: provider.group_member_ids ? JSON.parse(provider.group_member_ids) : [],
                    addresses: provider.addresses ? JSON.parse(provider.addresses) : [],
                });
                setShowSearch(false);
            } else {
                setFormData({
                    full_name: "",
                    specialty: "",
                    category: "",
                    email: "",
                    phone: "",
                    fax: "",
                    website: "",
                    address: "",
                    street: "",
                    suite: "",
                    city: "",
                    state: "",
                    zip: "",
                    credentials: "",
                    bio: "",
                    notes: "",
                    group_name: "",
                    group_member_ids: [],
                    addresses: [{ location_name: "Main Office", address: "", phone: "", is_primary: true }],
                });
                setShowSearch(true);
            }
            setSearchTerm("");
            setSearchResults([]);
        }
    }, [provider, open]);

    const handleNPISearch = async () => {
        if (!searchTerm || searchTerm.length < 2) return;
        
        setSearching(true);
        try {
            const { data } = await base44.functions.invoke('searchNPIRegistry', { searchTerm });
            setSearchResults(data.results || []);
        } catch (error) {
            console.error('Search failed:', error);
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    const handleSelectProvider = (npiProvider) => {
        const parseAddress = (addr) => {
            if (!addr) return { street: "", suite: "", city: "", state: "", zip: "" };
            const parts = addr.split(',').map(p => p.trim());
            if (parts.length >= 3) {
                const street = parts[0] || "";
                const cityState = parts[parts.length - 2] || "";
                const cityStateParts = cityState.split(' ');
                const state = cityStateParts.length > 1 ? cityStateParts[cityStateParts.length - 2] : "";
                const zip = cityStateParts.length > 1 ? cityStateParts[cityStateParts.length - 1] : "";
                const city = cityStateParts.slice(0, cityStateParts.length - 2).join(' ');
                return { street, suite: "", city, state, zip };
            }
            return { street: addr, suite: "", city: "", state: "", zip: "" };
        };

        setFormData({
            ...formData,
            full_name: npiProvider.full_name,
            specialty: npiProvider.specialty,
            credentials: npiProvider.credentials,
            phone: npiProvider.phone,
            fax: npiProvider.fax,
            address: npiProvider.address,
            ...parseAddress(npiProvider.address),
            addresses: npiProvider.address ? [{ 
                location_name: "Main Office", 
                address: npiProvider.address, 
                phone: npiProvider.phone,
                is_primary: true 
            }] : formData.addresses,
        });
        setShowSearch(false);
        setSearchResults([]);
        setSearchTerm("");
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const buildAddress = () => {
                const parts = [];

                // Build street part with optional suite
                let streetPart = formData.street || '';
                if (formData.suite && streetPart) {
                    streetPart = `${streetPart}, ${formData.suite}`;
                } else if (formData.suite) {
                    streetPart = formData.suite;
                }
                if (streetPart) parts.push(streetPart);

                // Add city, state, zip
                const cityStateZip = `${formData.city || ''} ${formData.state || ''} ${formData.zip || ''}`.trim();
                if (cityStateZip) parts.push(cityStateZip);

                return parts.join(', ');
            };

            const dataToSave = {
                full_name: formData.full_name,
                specialty: formData.specialty,
                category: formData.category,
                email: formData.email,
                phone: formData.phone,
                fax: formData.fax,
                website: formData.website,
                address: buildAddress(),
                credentials: formData.credentials,
                bio: formData.bio,
                notes: formData.notes,
                group_name: formData.group_name,
                group_member_ids: JSON.stringify(formData.group_member_ids || []),
                addresses: JSON.stringify(formData.addresses || []),
            };

            if (isNew) {
                await base44.entities.Provider.create(dataToSave);
            } else {
                await base44.entities.Provider.update(provider.id, dataToSave);
            }
            onSave();
            onOpenChange(false);
        } catch (error) {
            console.error("Error saving provider:", error);
        } finally {
            setSaving(false);
        }
    };

    if (!formData) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isNew ? "Add Provider" : "Edit Provider"}</DialogTitle>
                </DialogHeader>

                {showSearch && isNew && (
                    <div className="border rounded-lg p-4 bg-purple-50 space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-semibold">Search NPI Registry</Label>
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowSearch(false)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Enter name or NPI number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleNPISearch()}
                            />
                            <Button
                                type="button"
                                onClick={handleNPISearch}
                                disabled={searching || searchTerm.length < 2}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                {searching ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Search className="w-4 h-4" />
                                )}
                            </Button>
                        </div>

                        {searchResults.length > 0 && (
                            <div className="max-h-60 overflow-y-auto space-y-2 mt-3">
                                {searchResults.map((result, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => handleSelectProvider(result)}
                                        className="p-3 bg-white border rounded-lg cursor-pointer hover:bg-purple-100 transition-colors"
                                    >
                                        <div className="font-semibold text-sm">{result.full_name} {result.credentials}</div>
                                        <div className="text-xs text-gray-600">{result.specialty}</div>
                                        <div className="text-xs text-gray-500 mt-1">{result.address}</div>
                                        <div className="text-xs text-purple-600 mt-1">NPI: {result.npi}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {searchResults.length === 0 && searchTerm && !searching && (
                            <p className="text-sm text-gray-500 text-center py-2">No results found</p>
                        )}

                        <div className="border-t pt-3 mt-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowSearch(false)}
                                className="w-full"
                            >
                                Skip and Enter Manually
                            </Button>
                        </div>
                    </div>
                )}

                {!showSearch && isNew && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSearch(true)}
                        className="w-full mb-4"
                    >
                        <Search className="w-4 h-4 mr-2" />
                        Search NPI Registry
                    </Button>
                )}

                <div className="space-y-4">
                    <div>
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            placeholder="Provider's full name"
                        />
                    </div>

                    <div>
                        <Label htmlFor="specialty">Specialty</Label>
                        <Input
                            id="specialty"
                            value={formData.specialty}
                            onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                            placeholder="Medical specialty"
                        />
                    </div>

                    <div>
                        <Label htmlFor="category">Category</Label>
                        <Input
                            id="category"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            placeholder="Provider category (optional)"
                        />
                    </div>

                    <div>
                        <Label htmlFor="credentials">Credentials</Label>
                        <Input
                            id="credentials"
                            value={formData.credentials}
                            onChange={(e) => setFormData({ ...formData, credentials: e.target.value })}
                            placeholder="e.g., MD, DO, NP"
                        />
                    </div>

                    <div>
                        <Label htmlFor="group_name">Group Name</Label>
                        <Input
                            id="group_name"
                            value={formData.group_name}
                            onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                            placeholder="Practice or provider group name"
                        />
                    </div>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="street">Street Address</Label>
                            <Input
                                id="street"
                                value={formData.street}
                                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                                placeholder="Street address"
                            />
                        </div>

                        <div>
                            <Label htmlFor="suite">Suite/Building/Unit</Label>
                            <Input
                                id="suite"
                                value={formData.suite}
                                onChange={(e) => setFormData({ ...formData, suite: e.target.value })}
                                placeholder="Suite, building, or unit number (optional)"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    placeholder="City"
                                />
                            </div>
                            <div>
                                <Label htmlFor="state">State</Label>
                                <Input
                                    id="state"
                                    value={formData.state}
                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    placeholder="State"
                                />
                            </div>
                            <div>
                                <Label htmlFor="zip">Zip Code</Label>
                                <Input
                                    id="zip"
                                    value={formData.zip}
                                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                                    placeholder="Zip"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="Phone number"
                        />
                    </div>

                    <div>
                        <Label htmlFor="fax">Fax</Label>
                        <Input
                            id="fax"
                            type="tel"
                            value={formData.fax}
                            onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                            placeholder="Fax number"
                        />
                    </div>

                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="Email address"
                        />
                    </div>

                    <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                            id="website"
                            type="url"
                            value={formData.website}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            placeholder="https://example.com"
                        />
                    </div>

                    <div>
                        <Label htmlFor="bio">Bio</Label>
                        <textarea
                            id="bio"
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            placeholder="Professional summary"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            rows="3"
                        />
                    </div>

                    <div>
                        <Label htmlFor="notes">Internal Notes</Label>
                        <textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Staff notes (not printed)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            rows="2"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <Label>Additional Locations</Label>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setFormData({
                                    ...formData,
                                    addresses: [...(formData.addresses || []), { location_name: "", address: "", phone: "", is_primary: false }]
                                })}
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Add Location
                            </Button>
                        </div>
                        {(formData.addresses || []).map((addr, idx) => (
                            <div key={idx} className="border rounded-lg p-3 mb-2 space-y-2 bg-gray-50">
                                <div className="flex justify-between items-center">
                                    <Input
                                        value={addr.location_name}
                                        onChange={(e) => {
                                            const newAddresses = [...formData.addresses];
                                            newAddresses[idx].location_name = e.target.value;
                                            setFormData({ ...formData, addresses: newAddresses });
                                        }}
                                        placeholder="Location name (e.g., Main Office)"
                                        className="flex-1 mr-2"
                                    />
                                    {formData.addresses.length > 1 && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                const newAddresses = formData.addresses.filter((_, i) => i !== idx);
                                                setFormData({ ...formData, addresses: newAddresses });
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    )}
                                </div>
                                <Input
                                    value={addr.address}
                                    onChange={(e) => {
                                        const newAddresses = [...formData.addresses];
                                        newAddresses[idx].address = e.target.value;
                                        setFormData({ ...formData, addresses: newAddresses });
                                    }}
                                    placeholder="Address"
                                />
                                <Input
                                    value={addr.phone}
                                    onChange={(e) => {
                                        const newAddresses = [...formData.addresses];
                                        newAddresses[idx].phone = e.target.value;
                                        setFormData({ ...formData, addresses: newAddresses });
                                    }}
                                    placeholder="Phone"
                                />
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={addr.is_primary}
                                        onChange={(e) => {
                                            const newAddresses = formData.addresses.map((a, i) => ({
                                                ...a,
                                                is_primary: i === idx ? e.target.checked : false
                                            }));
                                            setFormData({ ...formData, addresses: newAddresses });
                                        }}
                                    />
                                    Primary Location
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            isNew ? "Add Provider" : "Save"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}