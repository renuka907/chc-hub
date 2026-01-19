// Default permissions and roles for new users

export const DEFAULT_NEW_USER_ROLE = 'staff';

export const ROLE_PERMISSIONS = {
  admin: {
    label: 'Administrator',
    description: 'Full access to all features and settings',
    canManageUsers: true,
    canManageSettings: true,
    canAccessAllData: true,
  },
  manager: {
    label: 'Manager',
    description: 'Can manage most features and view reports',
    canManageUsers: false,
    canManageSettings: false,
    canAccessAllData: true,
  },
  staff: {
    label: 'Staff',
    description: 'Can view and edit clinical and business data',
    canManageUsers: false,
    canManageSettings: false,
    canAccessAllData: false,
  },
  read_only: {
    label: 'Read Only',
    description: 'Can only view data, no editing capabilities',
    canManageUsers: false,
    canManageSettings: false,
    canAccessAllData: false,
  },
};

export const DEFAULT_PERMISSIONS = {
  role: DEFAULT_NEW_USER_ROLE,
  resources: {
    procedures: { view: true, create: false, edit: false, delete: false },
    pricing: { view: true, create: false, edit: false, delete: false },
    inventory: { view: true, create: false, edit: false, delete: false },
    clinic: { view: true, create: false, edit: false, delete: false },
    providers: { view: true, create: false, edit: false, delete: false },
    labTests: { view: true, create: false, edit: false, delete: false },
    reminders: { view: true, create: true, edit: true, delete: false },
    messages: { view: true, create: true, edit: true, delete: false },
  },
};

export const getRoleLabel = (role) => {
  return ROLE_PERMISSIONS[role]?.label || 'Unknown Role';
};

export const getRoleDescription = (role) => {
  return ROLE_PERMISSIONS[role]?.description || '';
};

export const canUserAction = (userRole, resource, action) => {
  return DEFAULT_PERMISSIONS.resources[resource]?.[action] === true;
};