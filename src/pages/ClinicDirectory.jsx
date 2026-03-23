import React, { useState } from "react";
import { entities, getCurrentUser } from "@/api/supabaseHelpers";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MapPin, Phone, Mail, Building2, Pencil, Plus, Trash2, Percent } from "lucide-react";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ClinicDirectory() {
    const [editingLocation, setEditingLocation] = useState(null);
    const [formData, setFormData] = useState({});
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const queryClient = useQueryClient();

    React.useEffect(() => { getCurrentUser().then(u => { if (u) setCurrentUser(u); }); }, []);

    const { data: locations = [], isLoading } = useQuery({
        queryKey: ['clinicLocations'],
        queryFn: () => entities.ClinicLocation.list('-created_at', 100),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => entities.ClinicLocation.update(id, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clinicLocations'] }); setEditingLocation(null); },
    });

    const createMutation = useMutation({
        mutationFn: (data) => entities.ClinicLocation.create(data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clinicLocations'] }); setEditingLocation(null); },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => entities.ClinicLocation.delete(id),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clinicLocations'] }); setDeleteConfirm(null); },
    });

    const activeLocations = locations.filter(loc => loc.status === 'active');
    const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'manager';

    const handleEdit = (location) => {
        setEditingLocation(location);
        setFormData({ name: location.name, address: location.address, phone: location.phone, email: location.email || '', tax_rate: location.tax_rate || 0 });
    };

    const handleAddNew = () => {
        setEditingLocation({ isNew: true });
        setFormData({ name: '', address: '', phone: '', email: '', tax_rate: 0, status: 'active' });
    };

    const handleSave = () => {
        if (editingLocation?.isNew) createMutation.mutate(formData);
        else updateMutation.mutate({ id: editingLocation.id, data: formData });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Building2 className="w-6 h-6" /> Clinic Directory
                        </h1>
                        <p className="text-blue-200 text-sm mt-1">{activeLocations.length} active locations</p>
                    </div>
                    {canEdit && (
                        <Button onClick={handleAddNew} size="sm" className="bg-white text-blue-700 hover:bg-blue-50 border-0 font-semibold">
                            <Plus className="w-4 h-4 mr-1" /> Add Location
                        </Button>
                    )}
                </div>
            </div>

            {/* Locations */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                </div>
            ) : activeLocations.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No clinic locations found.</div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                    {activeLocations.map(location => (
                        <div key={location.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                                            <Building2 className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-lg">{location.name}</h3>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-2 text-sm">
                                        {location.address && (
                                            <div className="flex items-start gap-2 text-gray-700">
                                                <MapPin className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                                                <span>{location.address}</span>
                                            </div>
                                        )}
                                        {location.phone && (
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Phone className="w-4 h-4 text-blue-400" />
                                                <a href={`tel:${location.phone}`} className="hover:text-blue-600">{location.phone}</a>
                                            </div>
                                        )}
                                        {location.email && (
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Mail className="w-4 h-4 text-blue-400" />
                                                <a href={`mailto:${location.email}`} className="hover:text-blue-600">{location.email}</a>
                                            </div>
                                        )}
                                        {location.tax_rate != null && (
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Percent className="w-4 h-4 text-blue-400" />
                                                <span>Tax: {location.tax_rate}%</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {canEdit && (
                                    <div className="flex gap-1 shrink-0">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(location)} className="h-8 w-8 text-gray-400 hover:text-blue-600">
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(location)} className="h-8 w-8 text-gray-400 hover:text-red-600">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit/Add Dialog */}
            <Dialog open={!!editingLocation} onOpenChange={() => setEditingLocation(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingLocation?.isNew ? 'Add Location' : 'Edit Location'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div><Label>Name</Label><Input value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                        <div><Label>Address</Label><Input value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
                        <div><Label>Phone</Label><Input value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                        <div><Label>Email</Label><Input value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                        <div><Label>Tax Rate (%)</Label><Input type="number" step="0.01" value={formData.tax_rate ?? ''} onChange={e => setFormData({...formData, tax_rate: parseFloat(e.target.value) || 0})} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingLocation(null)}>Cancel</Button>
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Location</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to delete {deleteConfirm?.name}?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(deleteConfirm.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
