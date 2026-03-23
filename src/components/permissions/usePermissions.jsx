import { useState, useEffect } from "react";
import { entities, uploadFile, invokeLLM, generateImage, sendEmail, agentChat } from "@/api/supabaseHelpers";
import { useAuth } from "@/lib/AuthContext";
import { getRoleDefaults } from "../admin/RoleDefaultsEditor";

// Load permissions from saved role defaults (editable in Admin Dashboard)
function getPermissions() {
    try { return getRoleDefaults(); } catch { return {}; }
}
const PERMISSIONS = getPermissions();

export function usePermissions() {
    const { user, isLoadingAuth: isLoading } = useAuth();

    const can = (resource, action) => {
        if (!user) return false;
        
        // Admin bypasses all checks
        if (user.role === 'admin') return true;

        // Check per-user page_permissions first (stored in Supabase)
        if (user.page_permissions) {
            try {
                const userPerms = typeof user.page_permissions === 'string' 
                    ? JSON.parse(user.page_permissions) 
                    : user.page_permissions;
                const resourcePerms = userPerms[resource];
                if (resourcePerms) {
                    // Supports both { actions: ['view','edit'] } and { view: true, edit: true } formats
                    if (Array.isArray(resourcePerms.actions)) {
                        return resourcePerms.actions.includes(action);
                    }
                    if (resourcePerms[action] !== undefined) {
                        return !!resourcePerms[action];
                    }
                }
            } catch (e) {
                console.warn('Error parsing page_permissions:', e);
            }
        }

        // Fall back to role-based defaults
        const userRole = user.role || 'read_only';
        const permissions = PERMISSIONS[userRole] || PERMISSIONS.read_only;
        return permissions[resource]?.[action] || false;
    };

    const canAny = (resource, actions) => {
        return actions.some(action => can(resource, action));
    };

    return {
        user,
        isLoading,
        can,
        canAny,
        isAdmin: user?.role === 'admin',
        isManager: user?.role === 'manager',
        isStaff: user?.role === 'staff',
        isReadOnly: user?.role === 'read_only'
    };
}

export const ROLE_LABELS = {
    admin: 'Admin',
    manager: 'Manager',
    staff: 'Staff',
    read_only: 'Read-Only'
};

export const ROLE_DESCRIPTIONS = {
    admin: 'Full access to all features and user management',
    manager: 'Can manage content and forms, view discounts and users',
    staff: 'Can create and edit forms, limited delete permissions',
    read_only: 'View-only access to forms and content'
};