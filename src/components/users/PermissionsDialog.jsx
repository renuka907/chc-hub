import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

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

export default function PermissionsDialog({ open, onOpenChange, user, onSave, isSaving }) {
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

    const handleSave = () => {
        onSave(permissions);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Page Permissions for {user?.full_name || user?.email}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Select which pages and actions this user can access and perform.
                    </p>

                    <div className="grid gap-4">
                        {AVAILABLE_PAGES.map(page => (
                            <Card key={page.id} className={hasAnyAction(page.id) ? 'border-purple-300 bg-purple-50' : ''}>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
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
                                        />
                                        {page.name}
                                    </CardTitle>
                                </CardHeader>
                                {hasAnyAction(page.id) && (
                                    <CardContent className="pt-0">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 ml-6">
                                            {page.actions.map(action => (
                                                <label key={action} className="flex items-center gap-2 cursor-pointer">
                                                    <Checkbox
                                                        checked={hasAction(page.id, action)}
                                                        onCheckedChange={() => toggleAction(page.id, action)}
                                                    />
                                                    <span className="text-sm capitalize">{action}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        ))}
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