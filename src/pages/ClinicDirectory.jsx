import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MapPin, Phone, Mail, Building2, Percent, Pencil, Star, Plus, Trash2 } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ClinicDirectory() {
    const [editingLocation, setEditingLocation] = useState(null);
    const [formData, setFormData] = useState({});
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const queryClient = useQueryClient();

    React.useEffect(() => {
        base44.auth.me().then(user => setCurrentUser(user)).catch(() => {});
    }, []);

    const { data: locations = [], isLoading } = useQuery({
        queryKey: ['clinicLocations'],
        queryFn: () => base44.entities.ClinicLocation.list('-created_date', 100),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.ClinicLocation.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clinicLocations'] });
            setEditingLocation(null);
        },
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.ClinicLocation.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clinicLocations'] });
            setEditingLocation(null);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.ClinicLocation.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clinicLocations'] });
            setDeleteConfirm(null);
        },
    });

    const toggleFavorite = async (locationId, currentValue) => {
        await base44.entities.ClinicLocation.update(locationId, { is_favorite: !currentValue });
        queryClient.invalidateQueries({ queryKey: ['clinicLocations'] });
    };

    const activeLocations = locations.filter(loc => {
        const isActive = loc.status === 'active';
        const matchesFavorite = !showFavoritesOnly || loc.is_favorite;
        return isActive && matchesFavorite;
    });

    const handleEdit = (location) => {
        setEditingLocation(location);
        setFormData({
            name: location.name,
            address: location.address,
            phone: location.phone,
            email: location.email || '',
            tax_rate: location.tax_rate,
        });
    };

    const handleAddNew = () => {
        setEditingLocation({ isNew: true });
        setFormData({
            name: '',
            address: '',
            phone: '',
            email: '',
            tax_rate: 0,
            status: 'active'
        });
    };

    const handleSave = () => {
        if (editingLocation?.isNew) {
            createMutation.mutate(formData);
        } else {
            updateMutation.mutate({
                id: editingLocation.id,
                data: formData,
            });
        }
    };

    const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'manager';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Clinic Directory</h1>
                    <p className="text-gray-600">Contact information for all clinic locations</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant={showFavoritesOnly ? "default" : "outline"}
                        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        className={showFavoritesOnly ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                    >
                        <Star className={`w-4 h-4 mr-2 ${showFavoritesOnly ? 'fill-white' : ''}`} />
                        {showFavoritesOnly ? 'Show All' : 'Favorites'}
                    </Button>
                    {canEdit && (
                        <Button
                            onClick={handleAddNew}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Location
                        </Button>
                    )}
                </div>
            </div>

            {/* Locations Grid */}
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            ) : activeLocations.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No clinic locations found</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 gap-6">
                    {activeLocations.map(location => (
                        <Card key={location.id} className="hover:shadow-lg transition-shadow border-2 relative">
                            <button
                                onClick={() => toggleFavorite(location.id, location.is_favorite)}
                                className="absolute top-4 right-4 z-10 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform"
                            >
                                <Star className={`w-4 h-4 ${location.is_favorite ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}`} />
                            </button>
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-slate-50">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Building2 className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl">{location.name}</CardTitle>
                                            <Badge variant="outline" className="mt-2 bg-white">
                                                Active Location
                                            </Badge>
                                        </div>
                                    </div>
                                    {canEdit && (
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(location)}
                                                className="text-gray-400 hover:text-blue-600"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDeleteConfirm(location)}
                                                className="text-gray-400 hover:text-red-600"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                {/* Address */}
                                <div className="flex items-start space-x-3">
                                    <MapPin className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                                    <div>
                                        <div className="font-medium text-sm text-gray-500 mb-1">Address</div>
                                        <div className="text-gray-900">{location.address}</div>
                                    </div>
                                </div>

                                {/* Phone */}
                                <div className="flex items-start space-x-3">
                                    <Phone className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                                    <div>
                                        <div className="font-medium text-sm text-gray-500 mb-1">Phone</div>
                                        <a href={`tel:${location.phone}`} className="text-blue-600 hover:underline">
                                            {location.phone}
                                        </a>
                                    </div>
                                </div>

                                {/* Email */}
                                {location.email && (
                                    <div className="flex items-start space-x-3">
                                        <Mail className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                                        <div>
                                            <div className="font-medium text-sm text-gray-500 mb-1">Email</div>
                                            <a href={`mailto:${location.email}`} className="text-blue-600 hover:underline">
                                                {location.email}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {/* Tax Rate */}
                                <div className="flex items-start space-x-3 pt-4 border-t">
                                    <Percent className="w-5 h-5 text-slate-600 mt-1 flex-shrink-0" />
                                    <div>
                                        <div className="font-medium text-sm text-gray-500 mb-1">Tax Rate</div>
                                        <div className="text-gray-900 font-semibold">{location.tax_rate}%</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={!!editingLocation} onOpenChange={(open) => !open && setEditingLocation(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingLocation?.isNew ? 'Add New' : 'Edit'} Clinic Location</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Location Name</Label>
                            <Input
                                id="name"
                                value={formData.name || ''}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                value={formData.address || ''}
                                onChange={(e) => setFormData({...formData, address: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={formData.phone || ''}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email || ''}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                            <Input
                                id="tax_rate"
                                type="number"
                                step="0.01"
                                value={formData.tax_rate || ''}
                                onChange={(e) => setFormData({...formData, tax_rate: parseFloat(e.target.value)})}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingLocation(null)}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSave} 
                            disabled={updateMutation.isPending || createMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {(updateMutation.isPending || createMutation.isPending) ? 'Saving...' : (editingLocation?.isNew ? 'Create Location' : 'Save Changes')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Clinic Location?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{deleteConfirm?.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteMutation.mutate(deleteConfirm.id)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}