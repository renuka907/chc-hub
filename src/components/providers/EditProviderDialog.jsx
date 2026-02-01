import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Globe } from "lucide-react";

export default function EditProviderDialog({ provider, open, onOpenChange, onSave }) {
    const [formData, setFormData] = useState(null);
    const [saving, setSaving] = useState(false);
    const isNew = !provider;

    useEffect(() => {
        if (open) {
            if (provider) {
                setFormData({
                    full_name: provider.full_name || "",
                    specialty: provider.specialty || "",
                    category: provider.category || "",
                    email: provider.email || "",
                    phone: provider.phone || "",
                    website: provider.website || "",
                    address: provider.address || "",
                    credentials: provider.credentials || "",
                    bio: provider.bio || "",
                    notes: provider.notes || "",
                    group_name: provider.group_name || "",
                    group_member_ids: provider.group_member_ids ? JSON.parse(provider.group_member_ids) : [],
                    addresses: provider.addresses ? JSON.parse(provider.addresses) : [],
                });
            } else {
                setFormData({
                    full_name: "",
                    specialty: "",
                    category: "",
                    email: "",
                    phone: "",
                    website: "",
                    address: "",
                    credentials: "",
                    bio: "",
                    notes: "",
                    group_name: "",
                    group_member_ids: [],
                    addresses: [{ location_name: "Main Office", address: "", phone: "", is_primary: true }],
                });
            }
        }
    }, [provider, open]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const dataToSave = {
                ...formData,
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

                    <div>
                        <Label htmlFor="address">Address</Label>
                        <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Office address"
                        />
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