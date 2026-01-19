import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function EditSpecialDialog({ special, open, onOpenChange, onSave }) {
    const [formData, setFormData] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open && special) {
            const formatDateForInput = (dateString) => {
                if (!dateString) return "";
                const date = new Date(dateString + "T00:00:00");
                return date.toISOString().split('T')[0];
            };
            
            setFormData({
                title: special.title || "",
                date_from: formatDateForInput(special.date_from),
                date_to: formatDateForInput(special.date_to),
            });
        }
    }, [special, open]);

    const handleSave = async () => {
        if (!formData.date_from || !formData.date_to) {
            alert("Please fill in all required fields");
            return;
        }

        if (new Date(formData.date_from) > new Date(formData.date_to)) {
            alert("Start date must be before end date");
            return;
        }

        setSaving(true);
        try {
            await base44.entities.Special.update(special.id, formData);
            onSave();
            onOpenChange(false);
        } catch (error) {
            console.error("Error saving special:", error);
            alert("Failed to save special");
        } finally {
            setSaving(false);
        }
    };

    if (!formData) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Special</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label htmlFor="edit_title">Title</Label>
                        <Input
                            id="edit_title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., Summer Sale 2026"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="edit_date_from">Start Date</Label>
                            <Input
                                id="edit_date_from"
                                type="date"
                                value={formData.date_from}
                                onChange={(e) => setFormData({ ...formData, date_from: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit_date_to">End Date</Label>
                            <Input
                                id="edit_date_to"
                                type="date"
                                value={formData.date_to}
                                onChange={(e) => setFormData({ ...formData, date_to: e.target.value })}
                                required
                            />
                        </div>
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
                            "Save Changes"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}