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
import { Users, Mail, Shield, UserPlus, Calendar, Trash2, Edit, UserX, UserCheck, FileDown, CheckCircle2 } from "lucide-react";
import EditUserDialog from "../components/users/EditUserDialog";
import RoleManagementDialog from "../components/users/RoleManagementDialog";
import PermissionsDialog from "../components/users/PermissionsDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [inviteSuccessEmail, setInviteSuccessEmail] = useState(null);
    const [inviteError, setInviteError] = useState(null);
    const [resendingId, setResendingId] = useState(null);
    const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
    const [permissionsUser, setPermissionsUser] = useState(null);
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
            setInviteSuccessEmail(inviteEmail);
            setInviteEmail("");
            setInviteRole("user");
            setInviteError(null);
        },
        onError: (error) => {
            const msg = error?.response?.data?.error || error?.message || 'Failed to send invitation';
            setInviteError(msg);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.User.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setDeleteConfirm(null);
        },
    });

    const updateUserMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });

    const updatePermissionsMutation = useMutation({
        mutationFn: ({ id, permissions }) => base44.entities.User.update(id, { page_permissions: JSON.stringify(permissions) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setShowPermissionsDialog(false);
        },
    });

    const resendInviteMutation = useMutation({
        mutationFn: ({ email, role }) => base44.users.inviteUser(email, role),
        onSuccess: (_, vars) => {
            setInviteSuccessEmail(vars.email);
        }
    });

    const handleToggleActive = (user) => {
        updateUserMutation.mutate({ id: user.id, data: { is_active: !user.is_active } });
    };

    const handleResend = (user) => {
        setInviteError(null);
        setResendingId(user.id);
        resendInviteMutation.mutate(
            { email: user.email, role: user.role || 'user' },
            {
                onSettled: () => setResendingId(null),
                onError: (error) => setInviteError(error?.response?.data?.error || error?.message || 'Failed to resend invitation')
            }
        );
    };

    const handleExportCSV = () => {
        const rows = users.map(u => ({
            name: u.full_name || '',
            email: u.email,
            role: u.role,
            phone: u.phone || '',
            department: u.department || '',
            is_active: u.is_active !== false ? 'true' : 'false',
            created_date: new Date(u.created_date).toISOString()
        }));
        const header = Object.keys(rows[0] || { name: '', email: '', role: '', phone: '', department: '', is_active: '', created_date: '' });
        const csv = [header.join(','), ...rows.map(r => header.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const filteredSortedUsers = React.useMemo(() => {
        let list = [...users];
        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            list = list.filter(u => (u.full_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));
        }
        if (roleFilter !== 'all') {
            list = list.filter(u => u.role === roleFilter);
        }
        if (statusFilter !== 'all') {
            list = list.filter(u => (u.is_active !== false) === (statusFilter === 'active'));
        }
        if (sortBy === 'name') {
            list.sort((a,b) => (a.full_name || a.email).localeCompare(b.full_name || b.email));
        } else {
            list.sort((a,b) => new Date(b.created_date) - new Date(a.created_date));
        }
        return list;
    }, [users, searchTerm, roleFilter, statusFilter, sortBy]);

    const handleInvite = () => {
        if (inviteEmail) {
            setInviteError(null);
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
                    <div className="flex items-center gap-2">
                        <Button 
                            onClick={handleExportCSV}
                            variant="outline"
                            className="gap-2"
                            title="Export users to CSV"
                        >
                            <FileDown className="w-4 h-4" />
                            Export CSV
                        </Button>
                        <Button 
                            onClick={() => setShowInviteDialog(true)}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Invite User
                        </Button>
                    </div>
                </div>
            </div>
{/* Invitation Status */}
{inviteSuccessEmail && (
    <Alert className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription>
            Invitation sent to {inviteSuccessEmail}
        </AlertDescription>
    </Alert>
)}

{/* Filters */}
<div className="bg-white rounded-3xl p-4 shadow-md">
    <div className="grid md:grid-cols-4 gap-3">
        <Input placeholder="Search name or email" value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="read_only">Read-Only</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
            </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger><SelectValue placeholder="Sort" /></SelectTrigger>
            <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="name">Name</SelectItem>
            </SelectContent>
        </Select>
    </div>
</div>

{/* Users List */}
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredSortedUsers.map(user => (
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
                                            {(user.phone || user.department) && (
                                                <div className="mt-1 text-xs text-gray-600">
                                                    {user.phone && <span className="mr-3">📞 {user.phone}</span>}
                                                    {user.department && <span>🏷️ {user.department}</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {!user.full_name && (
                                            <Badge className="bg-yellow-100 text-yellow-800">
                                                Invited
                                            </Badge>
                                        )}
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
                                                        setPermissionsUser(user);
                                                        setShowPermissionsDialog(true);
                                                    }}
                                                >
                                                    <Shield className="w-3 h-3 mr-1" />
                                                    Permissions
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setEditUser(user);
                                                        setShowEditDialog(true);
                                                    }}
                                                >
                                                    <Edit className="w-3 h-3 mr-1" />
                                                    Edit Details
                                                </Button>
                                                <Button
                                                    variant={user.is_active !== false ? "outline" : "default"}
                                                    size="sm"
                                                    onClick={() => handleToggleActive(user)}
                                                    className={user.is_active !== false ? "border-red-300 text-red-700" : "bg-green-600 hover:bg-green-700"}
                                                >
                                                    {user.is_active !== false ? (
                                                        <><UserX className="w-3 h-3 mr-1" /> Deactivate</>
                                                    ) : (
                                                        <><UserCheck className="w-3 h-3 mr-1" /> Activate</>
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setShowRoleDialog(true);
                                                    }}
                                                >
                                                    Change Role
                                                </Button>
                                                {!user.full_name && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleResend(user)}
                                                        disabled={resendingId === user.id || resendInviteMutation.isPending}
                                                    >
                                                        <Mail className="w-3 h-3 mr-1" />
                                                        {resendingId === user.id ? 'Resending...' : 'Resend Invite'}
                                                    </Button>
                                                )}
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
                         <p className="text-sm text-gray-600">Users will be invited as standard staff members. You can change their role after they accept the invitation.</p>
                     </div>
                    {inviteError && (
                        <p className="text-sm text-red-600">{inviteError}</p>
                    )}
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

            <EditUserDialog
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
                user={editUser}
            />

            <PermissionsDialog
                open={showPermissionsDialog}
                onOpenChange={setShowPermissionsDialog}
                user={permissionsUser}
                onSave={(permissions) => {
                    if (permissionsUser?.id) {
                        updatePermissionsMutation.mutate({ id: permissionsUser.id, permissions });
                    }
                }}
                isSaving={updatePermissionsMutation.isPending}
            />
        </div>
    );
}