import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "chc-role-defaults";

const RESOURCES = [
    { id: 'aftercare', label: 'Aftercare', actions: ['view', 'create', 'edit', 'delete', 'share'] },
    { id: 'consent', label: 'Consent Forms', actions: ['view', 'create', 'edit', 'delete', 'share'] },
    { id: 'education', label: 'Education', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'pricing', label: 'Pricing', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'inventory', label: 'Inventory', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'discounts', label: 'Discounts', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'quotes', label: 'Quotes', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'procedure', label: 'Procedures', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'clinic', label: 'Clinic Directory', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'users', label: 'User Management', actions: ['view', 'invite', 'edit', 'delete'] },
    { id: 'messaging', label: 'Messaging', actions: ['view', 'send'] },
];

const ROLES = ['admin', 'manager', 'staff', 'read_only'];

const ROLE_LABELS = { admin: 'Admin', manager: 'Manager', staff: 'Staff', read_only: 'Read Only' };
const ROLE_COLORS = { admin: 'bg-purple-100 text-purple-700', manager: 'bg-pink-100 text-pink-700', staff: 'bg-teal-100 text-teal-700', read_only: 'bg-gray-100 text-gray-600' };

const FACTORY_DEFAULTS = {
    admin: {
        aftercare: { view: true, create: true, edit: true, delete: true, share: true },
        consent: { view: true, create: true, edit: true, delete: true, share: true },
        clinic: { view: true, create: true, edit: true, delete: true },
        education: { view: true, create: true, edit: true, delete: true },
        pricing: { view: true, create: true, edit: true, delete: true },
        inventory: { view: true, create: true, edit: true, delete: true },
        discounts: { view: true, create: true, edit: true, delete: true },
        quotes: { view: true, create: true, edit: true, delete: true },
        users: { view: true, invite: true, edit: true, delete: true },
        messaging: { view: true, send: true },
        procedure: { view: true, create: true, edit: true, delete: true },
    },
    manager: {
        aftercare: { view: true, create: true, edit: true, delete: true, share: true },
        consent: { view: true, create: true, edit: true, delete: true, share: true },
        clinic: { view: true, create: true, edit: true, delete: true },
        education: { view: true, create: true, edit: true, delete: true },
        pricing: { view: true, create: true, edit: true, delete: false },
        inventory: { view: true, create: true, edit: true, delete: false },
        discounts: { view: true, create: true, edit: true, delete: true },
        quotes: { view: true, create: true, edit: true, delete: true },
        users: { view: true, invite: false, edit: false, delete: false },
        messaging: { view: true, send: true },
        procedure: { view: true, create: true, edit: true, delete: true },
    },
    staff: {
        aftercare: { view: true, create: true, edit: true, delete: false, share: true },
        consent: { view: true, create: true, edit: true, delete: false, share: true },
        clinic: { view: true, create: true, edit: true, delete: false },
        education: { view: true, create: false, edit: false, delete: false },
        pricing: { view: true, create: false, edit: false, delete: false },
        inventory: { view: true, create: true, edit: true, delete: false },
        discounts: { view: true, create: false, edit: false, delete: false },
        quotes: { view: true, create: true, edit: false, delete: false },
        users: { view: false, invite: false, edit: false, delete: false },
        messaging: { view: true, send: true },
        procedure: { view: false, create: false, edit: false, delete: false },
    },
    read_only: {
        aftercare: { view: true, create: false, edit: false, delete: false, share: false },
        consent: { view: true, create: false, edit: false, delete: false, share: false },
        clinic: { view: true, create: false, edit: false, delete: false },
        education: { view: true, create: false, edit: false, delete: false },
        pricing: { view: true, create: false, edit: false, delete: false },
        inventory: { view: true, create: false, edit: false, delete: false },
        discounts: { view: true, create: false, edit: false, delete: false },
        quotes: { view: true, create: false, edit: false, delete: false },
        users: { view: false, invite: false, edit: false, delete: false },
        messaging: { view: true, send: false },
        procedure: { view: false, create: false, edit: false, delete: false },
    },
};

function loadDefaults() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(FACTORY_DEFAULTS));
    } catch { return JSON.parse(JSON.stringify(FACTORY_DEFAULTS)); }
}

export default function RoleDefaultsEditor() {
    const [defaults, setDefaults] = useState(loadDefaults);
    const [activeRole, setActiveRole] = useState('staff');
    const [hasChanges, setHasChanges] = useState(false);

    const toggle = (resource, action) => {
        setDefaults(prev => {
            const next = { ...prev };
            next[activeRole] = { ...next[activeRole] };
            next[activeRole][resource] = { ...next[activeRole][resource] };
            next[activeRole][resource][action] = !next[activeRole][resource][action];
            return next;
        });
        setHasChanges(true);
    };

    const toggleAllForResource = (resource) => {
        const res = RESOURCES.find(r => r.id === resource);
        if (!res) return;
        const current = defaults[activeRole]?.[resource] || {};
        const allOn = res.actions.every(a => current[a]);
        setDefaults(prev => {
            const next = { ...prev };
            next[activeRole] = { ...next[activeRole] };
            next[activeRole][resource] = {};
            res.actions.forEach(a => { next[activeRole][resource][a] = !allOn; });
            return next;
        });
        setHasChanges(true);
    };

    const save = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
        setHasChanges(false);
        toast.success("Role defaults saved!");
    };

    const resetToFactory = () => {
        setDefaults(JSON.parse(JSON.stringify(FACTORY_DEFAULTS)));
        setHasChanges(true);
    };

    const rolePerms = defaults[activeRole] || {};

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Shield className="w-5 h-5 text-purple-600" />
                        Role Permission Defaults
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={resetToFactory}>
                            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset
                        </Button>
                        <Button size="sm" onClick={save} disabled={!hasChanges} className="bg-purple-600 hover:bg-purple-700 text-white">
                            <Save className="w-3.5 h-3.5 mr-1.5" /> Save
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* Role tabs */}
                <div className="flex gap-2 mb-4">
                    {ROLES.map(role => (
                        <button
                            key={role}
                            onClick={() => setActiveRole(role)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                activeRole === role
                                    ? 'bg-purple-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {ROLE_LABELS[role]}
                        </button>
                    ))}
                </div>

                {/* Permissions table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-2 px-3 font-semibold text-gray-700 w-40">Resource</th>
                                <th className="text-center py-2 px-2 font-medium text-gray-500 w-16">View</th>
                                <th className="text-center py-2 px-2 font-medium text-gray-500 w-16">Create</th>
                                <th className="text-center py-2 px-2 font-medium text-gray-500 w-16">Edit</th>
                                <th className="text-center py-2 px-2 font-medium text-gray-500 w-16">Delete</th>
                                <th className="text-center py-2 px-2 font-medium text-gray-500 w-16">Other</th>
                                <th className="text-center py-2 px-2 w-16"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {RESOURCES.map(res => {
                                const perms = rolePerms[res.id] || {};
                                const mainActions = ['view', 'create', 'edit', 'delete'];
                                const otherActions = res.actions.filter(a => !mainActions.includes(a));
                                const allOn = res.actions.every(a => perms[a]);

                                return (
                                    <tr key={res.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-2.5 px-3 font-medium text-gray-800">{res.label}</td>
                                        {mainActions.map(action => (
                                            <td key={action} className="text-center py-2.5 px-2">
                                                {res.actions.includes(action) ? (
                                                    <button
                                                        onClick={() => toggle(res.id, action)}
                                                        className={`w-7 h-7 rounded-md transition-all ${
                                                            perms[action]
                                                                ? 'bg-green-500 text-white shadow-sm'
                                                                : 'bg-gray-200 text-gray-400'
                                                        }`}
                                                    >
                                                        {perms[action] ? '✓' : '—'}
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-300">—</span>
                                                )}
                                            </td>
                                        ))}
                                        <td className="text-center py-2.5 px-2">
                                            <div className="flex gap-1 justify-center">
                                                {otherActions.map(action => (
                                                    <button
                                                        key={action}
                                                        onClick={() => toggle(res.id, action)}
                                                        className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                                                            perms[action]
                                                                ? 'bg-blue-500 text-white'
                                                                : 'bg-gray-200 text-gray-400'
                                                        }`}
                                                        title={action}
                                                    >
                                                        {action}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="text-center py-2.5 px-2">
                                            <button
                                                onClick={() => toggleAllForResource(res.id)}
                                                className={`text-xs px-2 py-1 rounded transition-all ${
                                                    allOn ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                }`}
                                            >
                                                {allOn ? 'All ✓' : 'All'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}

// Export for use by usePermissions
export function getRoleDefaults() {
    return loadDefaults();
}
