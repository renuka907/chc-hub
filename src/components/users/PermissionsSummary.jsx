import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Lock, Shield } from "lucide-react";

const AVAILABLE_PAGES = [
    { id: 'home', name: 'Home', actions: ['view'] },
    { id: 'procedures', name: 'Procedures', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'labTests', name: 'Lab Tests', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'medicationCalculator', name: 'Medication Calculator', actions: ['view', 'use'] },
    { id: 'library', name: 'Resource Library', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'formTemplates', name: 'Form Templates', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'clinicDirectory', name: 'Clinic Directory', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'pricing', name: 'Pricing', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'quotes', name: 'Quotes', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'inventory', name: 'Inventory', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'usageTracking', name: 'Usage Tracking', actions: ['view', 'create', 'edit'] },
    { id: 'discounts', name: 'Discounts', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'messaging', name: 'Messaging', actions: ['view', 'send'] },
    { id: 'reminders', name: 'Reminders', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'followUpDates', name: 'Follow-up Dates', actions: ['view', 'create', 'edit', 'delete'] },
];

const ACTION_COLORS = {
    view: 'bg-blue-100 text-blue-800',
    create: 'bg-green-100 text-green-800',
    edit: 'bg-yellow-100 text-yellow-800',
    delete: 'bg-red-100 text-red-800',
    use: 'bg-purple-100 text-purple-800',
    send: 'bg-indigo-100 text-indigo-800',
};

export default function PermissionsSummary({ user }) {
    const permissionsData = useMemo(() => {
        let permissions = {};
        if (user?.page_permissions) {
            try {
                permissions = typeof user.page_permissions === 'string' 
                    ? JSON.parse(user.page_permissions) 
                    : user.page_permissions;
            } catch {
                permissions = {};
            }
        }

        const totalPages = AVAILABLE_PAGES.length;
        const grantedPages = Object.keys(permissions).length;
        const allPermissions = [];

        AVAILABLE_PAGES.forEach(page => {
            const pagePerms = permissions[page.id];
            if (pagePerms?.actions?.length > 0) {
                pagePerms.actions.forEach(action => {
                    allPermissions.push({ page: page.name, action });
                });
            }
        });

        return { permissions, grantedPages, totalPages, allPermissions };
    }, [user?.page_permissions]);

    const accessLevel = useMemo(() => {
        const { grantedPages, totalPages, allPermissions } = permissionsData;
        const percentage = (grantedPages / totalPages) * 100;

        if (percentage === 0) return { level: 'No Access', color: 'bg-gray-100 text-gray-800', icon: Lock };
        if (percentage < 30) return { level: 'Limited', color: 'bg-orange-100 text-orange-800', icon: Circle };
        if (percentage < 70) return { level: 'Standard', color: 'bg-blue-100 text-blue-800', icon: Shield };
        return { level: 'Full', color: 'bg-green-100 text-green-800', icon: CheckCircle2 };
    }, [permissionsData]);

    const AccessIcon = accessLevel.icon;

    return (
        <div className="space-y-4">
            {/* Access Level Overview */}
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Access Level Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">User Role</p>
                            <p className="text-lg font-semibold text-gray-900">{user?.role === 'admin' ? 'Administrator' : 'Standard User'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-600 mb-1">Access Level</p>
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${accessLevel.color} font-semibold`}>
                                <AccessIcon className="w-4 h-4" />
                                {accessLevel.level}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                            <p className="text-2xl font-bold text-purple-600">{permissionsData.grantedPages}</p>
                            <p className="text-xs text-gray-600 mt-1">Modules Granted</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                            <p className="text-2xl font-bold text-blue-600">{permissionsData.allPermissions.length}</p>
                            <p className="text-xs text-gray-600 mt-1">Total Permissions</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                            <p className="text-2xl font-bold text-green-600">{Math.round((permissionsData.grantedPages / permissionsData.totalPages) * 100)}%</p>
                            <p className="text-xs text-gray-600 mt-1">Coverage</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Granted Permissions List */}
            {permissionsData.allPermissions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">What This User Can Do</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {permissionsData.allPermissions.map((perm, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                    <span className="text-sm text-gray-700">
                                        <span className="font-medium">{perm.page}</span>
                                        <span className="text-gray-400 mx-2">—</span>
                                        <span className="capitalize">{perm.action}</span>
                                    </span>
                                    <Badge className={ACTION_COLORS[perm.action] || 'bg-gray-100 text-gray-800'}>
                                        {perm.action}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {permissionsData.allPermissions.length === 0 && (
                <Card className="bg-gray-50 border-dashed">
                    <CardContent className="pt-8 pb-8 text-center">
                        <Lock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">No permissions granted. This user cannot access any modules.</p>
                    </CardContent>
                </Card>
            )}

            {/* Module Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Module Access</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {AVAILABLE_PAGES.map(page => {
                            const pagePerms = permissionsData.permissions[page.id];
                            const hasAccess = pagePerms?.actions?.length > 0;
                            const percentage = hasAccess ? (pagePerms.actions.length / page.actions.length) * 100 : 0;

                            return (
                                <div key={page.id} className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {hasAccess ? (
                                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                            ) : (
                                                <Circle className="w-4 h-4 text-gray-300" />
                                            )}
                                            <span className={`text-sm ${hasAccess ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                                                {page.name}
                                            </span>
                                        </div>
                                        <span className={`text-xs font-semibold ${hasAccess ? 'text-gray-600' : 'text-gray-300'}`}>
                                            {hasAccess ? `${pagePerms.actions.length}/${page.actions.length}` : '0/' + page.actions.length}
                                        </span>
                                    </div>
                                    {hasAccess && (
                                        <div className="ml-6 flex flex-wrap gap-1">
                                            {pagePerms.actions.map(action => (
                                                <Badge 
                                                    key={action} 
                                                    className={`text-xs ${ACTION_COLORS[action] || 'bg-gray-100 text-gray-800'}`}
                                                >
                                                    {action}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}