import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from "../permissions/usePermissions";

export default function RoleManagementDialog({ open, onOpenChange, user: selectedUser }) {
    const [selectedRole, setSelectedRole] = useState(selectedUser?.role || 'staff');
    const queryClient = useQueryClient();

    const updateRoleMutation = useMutation({
        mutationFn: async () => {
            await base44.entities.User.update(selectedUser.id, { role: selectedRole });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success("User role updated successfully");
            onOpenChange(false);
        },
        onError: () => {
            toast.error("Failed to update user role");
        }
    });

    const rolePermissions = {
        admin: ['Full system access', 'Manage users', 'All create/edit/delete', 'Manage shared links'],
        manager: ['Manage forms & content', 'View discounts & users', 'Create & edit', 'Limited delete'],
        staff: ['Create & edit forms', 'View pricing', 'Limited permissions', 'No user management'],
        read_only: ['View-only access', 'Cannot create/edit', 'Cannot delete', 'Cannot share']
    };

    const roleColors = {
        admin: 'bg-purple-100 text-purple-800 border-purple-300',
        manager: 'bg-blue-100 text-blue-800 border-blue-300',
        staff: 'bg-green-100 text-green-800 border-green-300',
        read_only: 'bg-gray-100 text-gray-800 border-gray-300'
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Manage User Role: {selectedUser?.full_name || selectedUser?.email}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label>Select Role</Label>
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-purple-100 text-purple-800">Admin</Badge>
                                        <span className="text-sm text-gray-600">Full Access</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="manager">
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-blue-100 text-blue-800">Manager</Badge>
                                        <span className="text-sm text-gray-600">Manage Content</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="staff">
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-green-100 text-green-800">Staff</Badge>
                                        <span className="text-sm text-gray-600">Create & Edit</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="read_only">
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-gray-100 text-gray-800">Read-Only</Badge>
                                        <span className="text-sm text-gray-600">View Only</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3">
                        <h3 className="font-semibold text-sm">Role Permissions</h3>
                        <div className="grid gap-3">
                            {Object.entries(rolePermissions).map(([role, permissions]) => (
                                <Card 
                                    key={role}
                                    className={`cursor-pointer transition-all ${
                                        selectedRole === role 
                                            ? `border-2 ${roleColors[role]}` 
                                            : 'border hover:border-gray-300'
                                    }`}
                                    onClick={() => setSelectedRole(role)}
                                >
                                    <CardContent className="pt-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge className={roleColors[role]}>
                                                        {ROLE_LABELS[role]}
                                                    </Badge>
                                                    {selectedRole === role && (
                                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600">{ROLE_DESCRIPTIONS[role]}</p>
                                            </div>
                                        </div>
                                        <ul className="mt-2 space-y-1">
                                            {permissions.map((perm, idx) => (
                                                <li key={idx} className="text-xs text-gray-600 flex items-center gap-1">
                                                    <span className="text-green-600">✓</span> {perm}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={() => updateRoleMutation.mutate()}
                        disabled={updateRoleMutation.isPending || selectedRole === selectedUser?.role}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {updateRoleMutation.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            'Update Role'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}