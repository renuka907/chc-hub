import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Check } from "lucide-react";

export default function UsageRecorder({ open, onOpenChange, onSuccess }) {
    const [formData, setFormData] = useState({
        inventory_item_id: "",
        item_name: "",
        location_id: "",
        quantity_used: "",
        unit: "",
        usage_date: new Date().toISOString().split('T')[0],
        usage_reason: "procedure",
        procedure_type: "",
        notes: ""
    });
    const [currentUser, setCurrentUser] = React.useState(null);
    const queryClient = useQueryClient();

    React.useEffect(() => {
        base44.auth.me().then(user => setCurrentUser(user)).catch(() => {});
    }, []);

    const { data: inventoryItems = [] } = useQuery({
        queryKey: ['inventoryItems'],
        queryFn: () => base44.entities.InventoryItem.list('', 500),
    });

    const { data: locations = [] } = useQuery({
        queryKey: ['clinicLocations'],
        queryFn: () => base44.entities.ClinicLocation.list(),
    });

    const createUsageMutation = useMutation({
        mutationFn: async (data) => {
            const payload = {
                ...data,
                quantity_used: parseFloat(data.quantity_used),
                recorded_by: currentUser?.email
            };
            return base44.entities.UsageLog.create(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['usageLogs'] });
            setFormData({
                inventory_item_id: "",
                item_name: "",
                location_id: "",
                quantity_used: "",
                unit: "",
                usage_date: new Date().toISOString().split('T')[0],
                usage_reason: "procedure",
                procedure_type: "",
                notes: ""
            });
            onOpenChange(false);
            onSuccess?.();
        }
    });

    const handleSelectItem = (itemId) => {
        const item = inventoryItems.find(i => i.id === itemId);
        if (item) {
            setFormData(prev => ({
                ...prev,
                inventory_item_id: itemId,
                item_name: item.item_name,
                location_id: item.location_id,
                unit: item.unit
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.inventory_item_id && formData.quantity_used && formData.location_id) {
            createUsageMutation.mutate(formData);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Record Item Usage</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Item Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Item *
                        </label>
                        <Select value={formData.inventory_item_id} onValueChange={handleSelectItem}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose an item..." />
                            </SelectTrigger>
                            <SelectContent>
                                {inventoryItems
                                    .filter(item => item.status === 'active')
                                    .map(item => (
                                        <SelectItem key={item.id} value={item.id}>
                                            {item.item_name} ({item.quantity} {item.unit})
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Location (auto-filled) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Location
                        </label>
                        <Input
                            value={formData.location_id ? locations.find(l => l.id === formData.location_id)?.name || "" : ""}
                            disabled
                            className="bg-gray-50"
                        />
                    </div>

                    {/* Quantity Used */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Quantity Used *
                            </label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.quantity_used}
                                onChange={(e) => setFormData(prev => ({ ...prev, quantity_used: e.target.value }))}
                                placeholder="0"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Unit
                            </label>
                            <Input
                                value={formData.unit}
                                disabled
                                className="bg-gray-50"
                            />
                        </div>
                    </div>

                    {/* Usage Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Usage Date *
                        </label>
                        <Input
                            type="date"
                            value={formData.usage_date}
                            onChange={(e) => setFormData(prev => ({ ...prev, usage_date: e.target.value }))}
                            required
                        />
                    </div>

                    {/* Usage Reason */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reason for Usage *
                        </label>
                        <Select value={formData.usage_reason} onValueChange={(value) => setFormData(prev => ({ ...prev, usage_reason: value }))}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="procedure">Procedure</SelectItem>
                                <SelectItem value="waste">Waste</SelectItem>
                                <SelectItem value="stock_adjustment">Stock Adjustment</SelectItem>
                                <SelectItem value="expired">Expired</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Procedure Type (conditional) */}
                    {formData.usage_reason === "procedure" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Procedure Type
                            </label>
                            <Input
                                value={formData.procedure_type}
                                onChange={(e) => setFormData(prev => ({ ...prev, procedure_type: e.target.value }))}
                                placeholder="e.g., Laser Treatment, Injection"
                            />
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes
                        </label>
                        <Input
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Additional details..."
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={createUsageMutation.isPending || !formData.inventory_item_id || !formData.quantity_used}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            <Check className="w-4 h-4 mr-1" />
                            Record Usage
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}