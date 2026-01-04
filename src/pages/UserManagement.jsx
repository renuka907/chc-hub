import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, Mail, Shield, UserPlus, Calendar, Trash2, Edit } from "lucide-react";
import RoleManagementDialog from "../components/users/RoleManagementDialog";
import { ROLE_LABELS } from "../components/permissions/usePermissions";
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

export default function UserManagement() {
    const [showInviteDialog, setShowInviteDialog] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("user");
    const [currentUser, setCurrentUser] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [showRoleDialog, setShowRoleDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const queryClient = useQueryClient();

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: () => base44.entities.User.list('-created_date', 100),
    });

    React.useEffect(() => {
        base44.auth.me().then(user => setCurrentUser(user));
    }, []);

    const inviteMutation = useMutation({
        mutationFn: ({ email, role }) => base44.users.inviteUser(email, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setShowInviteDialog(false);
            setInviteEmail("");
            setInviteRole("user");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.User.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setDeleteConfirm(null);
        },
    });

    const handleInvite = () => {
        if (inviteEmail) {
            inviteMutation.mutate({ email: inviteEmail, role: inviteRole });
        }
    };

    const isAdmin = currentUser?.role === 'admin';

    if (!currentUser) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <Card className="text-center py-12">
                <CardContent>
                    <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Access Denied</p>
                    <p className="text-gray-400 text-sm mt-2">Only administrators can manage users</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-3xl p-6 shadow-md">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                            <p className="text-gray-600">Invite and manage app users</p>
                        </div>
                    </div>
                    <Button 
                        onClick={() => setShowInviteDialog(true)}
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Invite User
                    </Button>
                </div>
            </div>

            {/* Users List */}
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                </div>
            ) : (
                <div className="grid gap-4">
                    {users.map(user => (
                        <Card key={user.id} className="hover:shadow-lg transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                                            <span className="text-white font-semibold text-lg">
                                                {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-lg text-gray-900">
                                                {user.full_name || 'No name'}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Mail className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-600 text-sm">{user.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-500 text-xs">
                                                    Joined {new Date(user.created_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge className={
                                            user.role === 'admin' 
                                                ? 'bg-purple-100 text-purple-800' 
                                                : user.role === 'manager'
                                                ? 'bg-blue-100 text-blue-800'
                                                : user.role === 'staff'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }>
                                            <Shield className="w-3 h-3 mr-1" />
                                            {ROLE_LABELS[user.role] || 'User'}
                                        </Badge>
                                        {user.id !== currentUser?.id && (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setShowRoleDialog(true);
                                                    }}
                                                >
                                                    <Edit className="w-3 h-3 mr-1" />
                                                    Change Role
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeleteConfirm(user)}
                                                    className="text-gray-400 hover:text-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Invite Dialog */}
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>Invite New User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="user@example.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={inviteRole} onValueChange={setInviteRole}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="read_only">Read-Only</SelectItem>
                                    <SelectItem value="staff">Staff</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="admin">Administrator</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500">
                                {inviteRole === 'admin' 
                                    ? 'Full access to all features and user management' 
                                    : inviteRole === 'manager'
                                    ? 'Can manage content and forms, view discounts'
                                    : inviteRole === 'staff'
                                    ? 'Can create and edit forms, limited delete permissions'
                                    : 'View-only access to forms and content'}
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleInvite}
                            disabled={!inviteEmail || inviteMutation.isPending}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete User?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete user "{deleteConfirm?.full_name || deleteConfirm?.email}"? This action cannot be undone.
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

            <RoleManagementDialog
                open={showRoleDialog}
                onOpenChange={setShowRoleDialog}
                user={selectedUser}
            />
        </div>
    );
}