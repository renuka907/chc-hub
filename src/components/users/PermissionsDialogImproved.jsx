import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, Circle } from "lucide-react";

const PAGES_BY_CATEGORY = {
    'Patient Management': [
        { id: 'followUpDates', name: 'Follow-up Dates', actions: ['view', 'create', 'edit', 'delete'] },
    ],
    'Clinical': [
        { id: 'procedures', name: 'Procedures', actions: ['view', 'create', 'edit', 'delete'] },
        { id: 'labTests', name: 'Lab Tests', actions: ['view', 'create', 'edit', 'delete'] },
        { id: 'medicationCalculator', name: 'Medication Calculator', actions: ['view', 'use'] },
    ],
    'Documents & Forms': [
        { id: 'library', name: 'Resource Library', actions: ['view', 'create', 'edit', 'delete'] },
        { id: 'formTemplates', name: 'Form Templates', actions: ['view', 'create', 'edit', 'delete'] },
    ],
    'Business': [
        { id: 'clinicDirectory', name: 'Clinic Directory', actions: ['view', 'create', 'edit', 'delete'] },
        { id: 'pricing', name: 'Pricing', actions: ['view', 'create', 'edit', 'delete'] },
        { id: 'quotes', name: 'Quotes', actions: ['view', 'create', 'edit', 'delete'] },
        { id: 'inventory', name: 'Inventory', actions: ['view', 'create', 'edit', 'delete'] },
        { id: 'usageTracking', name: 'Usage Tracking', actions: ['view', 'create', 'edit'] },
        { id: 'discounts', name: 'Discounts', actions: ['view', 'create', 'edit', 'delete'] },
    ],
    'Tools': [
        { id: 'home', name: 'Home', actions: ['view'] },
        { id: 'messaging', name: 'Messaging', actions: ['view', 'send'] },
        { id: 'reminders', name: 'Reminders', actions: ['view', 'create', 'edit', 'delete'] },
    ],
};

const ROLE_PRESETS = {
    admin: {
        name: 'Admin',
        description: 'Full access to all features',
        permissions: Object.values(PAGES_BY_CATEGORY).flat().reduce((acc, page) => ({
            ...acc,
            [page.id]: { actions: page.actions }
        }), {})
    },
    editor: {
        name: 'Editor',
        description: 'Can view, create, and edit',
        permissions: Object.values(PAGES_BY_CATEGORY).flat().reduce((acc, page) => ({
            ...acc,
            [page.id]: { actions: page.actions.filter(a => ['view', 'create', 'edit'].includes(a)) }
        }), {})
    },
    viewer: {
        name: 'Viewer',
        description: 'View-only access',
        permissions: Object.values(PAGES_BY_CATEGORY).flat().reduce((acc, page) => ({
            ...acc,
            [page.id]: { actions: ['view'] }
        }), {})
    },
    readonly: {
        name: 'Read-Only',
        description: 'Very limited access',
        permissions: {
            home: { actions: ['view'] },
            messaging: { actions: ['view'] },
            reminders: { actions: ['view'] },
        }
    }
};

const ACTION_COLORS = {
    view: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    create: 'bg-green-50 border-green-200 hover:bg-green-100',
    edit: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    delete: 'bg-red-50 border-red-200 hover:bg-red-100',
    use: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    send: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
};

const ACTION_TEXT_COLORS = {
    view: 'text-blue-700',
    create: 'text-green-700',
    edit: 'text-yellow-700',
    delete: 'text-red-700',
    use: 'text-purple-700',
    send: 'text-indigo-700',
};

export default function PermissionsDialogImproved({ open, onOpenChange, user, onSave, isSaving }) {
    const [permissions, setPermissions] = useState({});

    useEffect(() => {
        if (user?.page_permissions) {
            try {
                const parsed = typeof user.page_permissions === 'string' 
                    ? JSON.parse(user.page_permissions) 
                    : user.page_permissions;
                setPermissions(parsed || {});
            } catch {
                setPermissions({});
            }
        } else {
            setPermissions({});
        }
    }, [user]);

    const toggleAction = (pageId, action) => {
        setPermissions(prev => {
            const pagePerms = prev[pageId] || {};
            const actions = pagePerms.actions || [];
            
            if (actions.includes(action)) {
                return {
                    ...prev,
                    [pageId]: {
                        ...pagePerms,
                        actions: actions.filter(a => a !== action)
                    }
                };
            } else {
                return {
                    ...prev,
                    [pageId]: {
                        ...pagePerms,
                        actions: [...actions, action]
                    }
                };
            }
        });
    };

    const hasAction = (pageId, action) => {
        return permissions[pageId]?.actions?.includes(action) || false;
    };

    const hasAnyAction = (pageId) => {
        return (permissions[pageId]?.actions?.length || 0) > 0;
    };

    const applyPreset = (presetKey) => {
        setPermissions(ROLE_PRESETS[presetKey].permissions);
    };

    const toggleCategoryAll = (category, enable) => {
        const pages = PAGES_BY_CATEGORY[category];
        setPermissions(prev => {
            const newPerms = { ...prev };
            pages.forEach(page => {
                if (enable) {
                    newPerms[page.id] = { actions: page.actions };
                } else {
                    delete newPerms[page.id];
                }
            });
            return newPerms;
        });
    };

    const getCategoryStats = (category) => {
        const pages = PAGES_BY_CATEGORY[category];
        const pagesWithPerms = pages.filter(p => hasAnyAction(p.id));
        return { granted: pagesWithPerms.length, total: pages.length };
    };

    const handleSave = () => {
        onSave(permissions);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Page Permissions for {user?.full_name || user?.email}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Quick Presets */}
                    <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold text-gray-700">Quick Role Presets</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {Object.entries(ROLE_PRESETS).map(([key, preset]) => (
                                    <Button
                                        key={key}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => applyPreset(key)}
                                        className="flex flex-col items-start h-auto py-3 px-3"
                                    >
                                        <span className="font-semibold text-sm">{preset.name}</span>
                                        <span className="text-xs text-gray-500 mt-1">{preset.description}</span>
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Permission Categories */}
                    <div className="space-y-4">
                        {Object.entries(PAGES_BY_CATEGORY).map(([category, pages]) => {
                            const stats = getCategoryStats(category);
                            const allGranted = stats.granted === stats.total;
                            const isPartial = stats.granted > 0 && stats.granted < stats.total;

                            return (
                                <Card key={category} className={allGranted ? 'border-2 border-green-300 bg-green-50' : isPartial ? 'border-2 border-yellow-300 bg-yellow-50' : 'border border-gray-200'}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3 flex-1">
                                                {allGranted && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                                                {isPartial && <Circle className="w-5 h-5 text-yellow-600" />}
                                                {!allGranted && !isPartial && <Circle className="w-5 h-5 text-gray-400" />}
                                                <CardTitle className="text-base">{category}</CardTitle>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-semibold text-gray-600">
                                                    {stats.granted} of {stats.total} modules
                                                </span>
                                                <div className="flex gap-1">
                                                    {stats.granted < stats.total && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => toggleCategoryAll(category, true)}
                                                            className="text-xs h-7"
                                                        >
                                                            Select All
                                                        </Button>
                                                    )}
                                                    {stats.granted > 0 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => toggleCategoryAll(category, false)}
                                                            className="text-xs h-7 text-red-600 hover:text-red-700"
                                                        >
                                                            Clear
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        {pages.map(page => {
                                            const enabledCount = permissions[page.id]?.actions?.length || 0;
                                            const availableActions = page.actions.join(', ');
                                            return (
                                                <div key={page.id} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
                                                    {/* Page Header */}
                                                    <div className="flex items-start justify-between gap-3 mb-3">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3">
                                                                <Checkbox
                                                                    checked={hasAnyAction(page.id)}
                                                                    onCheckedChange={(checked) => {
                                                                        if (checked) {
                                                                            setPermissions(prev => ({
                                                                                ...prev,
                                                                                [page.id]: { actions: page.actions }
                                                                            }));
                                                                        } else {
                                                                            setPermissions(prev => {
                                                                                const newPerms = { ...prev };
                                                                                delete newPerms[page.id];
                                                                                return newPerms;
                                                                            });
                                                                        }
                                                                    }}
                                                                    className="w-5 h-5"
                                                                />
                                                                <div>
                                                                    <p className="font-semibold text-sm text-gray-900">{page.name}</p>
                                                                    <p className="text-xs text-gray-500 mt-0.5">Available: {availableActions}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {hasAnyAction(page.id) && (
                                                            <span className="text-xs font-semibold text-gray-700 bg-white border border-gray-300 px-2.5 py-1 rounded-full whitespace-nowrap">
                                                                {enabledCount} of {page.actions.length}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Action Buttons */}
                                                    {hasAnyAction(page.id) && (
                                                        <div className="ml-8 flex flex-wrap gap-2">
                                                            {page.actions.map(action => (
                                                                <button
                                                                    key={action}
                                                                    onClick={() => toggleAction(page.id, action)}
                                                                    className={`px-3 py-2 rounded-lg border-2 font-medium text-sm transition-all cursor-pointer
                                                                        ${hasAction(page.id, action) 
                                                                            ? `${ACTION_COLORS[action]} border-current` 
                                                                            : 'bg-gray-100 border-gray-300 text-gray-400'
                                                                        }`}
                                                                >
                                                                    <span className={hasAction(page.id, action) ? ACTION_TEXT_COLORS[action] : ''}>
                                                                        {action.charAt(0).toUpperCase() + action.slice(1)}
                                                                    </span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Permissions'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}