import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

// Permission definitions by role
const PERMISSIONS = {
    admin: {
        aftercare: { view: true, create: true, edit: true, delete: true, share: true },
        consent: { view: true, create: true, edit: true, delete: true, share: true },
        clinic: { view: true, create: true, edit: true, delete: true, share: true },
        education: { view: true, create: true, edit: true, delete: true },
        pricing: { view: true, create: true, edit: true, delete: true },
        inventory: { view: true, create: true, edit: true, delete: true },
        discounts: { view: true, create: true, edit: true, delete: true },
        quotes: { view: true, create: true, edit: true, delete: true },
        users: { view: true, invite: true, edit: true, delete: true },
        messaging: { view: true, send: true },
        procedure: { view: true, create: true, edit: true, delete: true, read: true }
    },
    manager: {
        aftercare: { view: true, create: true, edit: true, delete: true, share: true },
        consent: { view: true, create: true, edit: true, delete: true, share: true },
        clinic: { view: true, create: true, edit: true, delete: true, share: true },
        education: { view: true, create: true, edit: true, delete: true },
        pricing: { view: true, create: true, edit: true, delete: false },
        inventory: { view: true, create: true, edit: true, delete: false },
        discounts: { view: true, create: true, edit: true, delete: true },
        quotes: { view: true, create: true, edit: true, delete: true },
        users: { view: true, invite: false, edit: false, delete: false },
        messaging: { view: true, send: true },
        procedure: { view: true, create: true, edit: true, delete: true, read: true }
    },
    staff: {
        aftercare: { view: true, create: true, edit: true, delete: false, share: true },
        consent: { view: true, create: true, edit: true, delete: false, share: true },
        clinic: { view: true, create: true, edit: true, delete: false, share: true },
        education: { view: true, create: false, edit: false, delete: false },
        pricing: { view: true, create: false, edit: false, delete: false },
        inventory: { view: true, create: true, edit: true, delete: false },
        discounts: { view: true, create: false, edit: false, delete: false },
        quotes: { view: true, create: true, edit: false, delete: false },
        users: { view: false, invite: false, edit: false, delete: false },
        messaging: { view: true, send: true },
        procedure: { view: false, create: false, edit: false, delete: false, read: false }
    },
    read_only: {
        aftercare: { view: true, create: false, edit: false, delete: false, share: false },
        consent: { view: true, create: false, edit: false, delete: false, share: false },
        clinic: { view: true, create: false, edit: false, delete: false, share: false },
        education: { view: true, create: false, edit: false, delete: false },
        pricing: { view: true, create: false, edit: false, delete: false },
        inventory: { view: true, create: false, edit: false, delete: false },
        discounts: { view: true, create: false, edit: false, delete: false },
        quotes: { view: true, create: false, edit: false, delete: false },
        users: { view: false, invite: false, edit: false, delete: false },
        messaging: { view: true, send: false },
        procedure: { view: false, create: false, edit: false, delete: false, read: false }
    }
};

export function usePermissions() {
    const { data: user, isLoading } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: false
    });

    const can = (resource, action) => {
        if (!user) return false;
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