import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function EditProviderDialog({ provider, open, onOpenChange, onSave }) {
    const [formData, setFormData] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (provider) {
            setFormData({
                full_name: provider.full_name || "",
                specialty: provider.specialty || "",
                email: provider.email || "",
                phone: provider.phone || "",
                address: provider.address || "",
                credentials: provider.credentials || "",
                bio: provider.bio || "",
            });
        }
    }, [provider, open]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await base44.entities.Provider.update(provider.id, formData);
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
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Provider</DialogTitle>
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
                        <Label htmlFor="credentials">Credentials</Label>
                        <Input
                            id="credentials"
                            value={formData.credentials}
                            onChange={(e) => setFormData({ ...formData, credentials: e.target.value })}
                            placeholder="e.g., MD, DO, NP"
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
                            "Save"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}