
export interface ModuleTemplate {
    code: string;
    name: string;
    description: string;
    is_core: boolean; // Cannot be disabled
    default_active: boolean;
    sort_order: number;
    actions: string[]; // Default actions available for this module
}

export const CORE_MODULES: ModuleTemplate[] = [
    {
        code: 'USERS',
        name: 'Users',
        description: 'User Management',
        is_core: true,
        default_active: true,
        sort_order: 10,
        actions: ['read', 'create', 'update', 'delete', 'export']
    },
    {
        code: 'ROLES',
        name: 'Roles',
        description: 'Role Management',
        is_core: true,
        default_active: true,
        sort_order: 20,
        actions: ['read', 'create', 'update', 'delete', 'export']
    },
    {
        code: 'PROFILES',
        name: 'Profiles',
        description: 'Profile Management',
        is_core: true,
        default_active: true,
        sort_order: 30,
        actions: ['read', 'create', 'update', 'delete', 'export', 'manage_permissions']
    },
    {
        code: 'GROUPS',
        name: 'Groups',
        description: 'Group Management',
        is_core: true,
        default_active: true,
        sort_order: 40,
        actions: ['read', 'create', 'update', 'delete', 'export']
    },
    {
        code: 'SHARING',
        name: 'Sharing Rules',
        description: 'Record Sharing Configuration',
        is_core: true,
        default_active: true,
        sort_order: 50,
        actions: ['read', 'create', 'update', 'delete']
    },
    {
        code: 'AUDIT',
        name: 'Audit Logs',
        description: 'System Audit Logs',
        is_core: true,
        default_active: true,
        sort_order: 100,
        actions: ['read', 'export']
    },
    // SETTINGS / CONFIG Modules
    {
        code: 'SMTP_CONFIG',
        name: 'SMTP Configuration',
        description: 'Email Server Configuration',
        is_core: true,
        default_active: true,
        sort_order: 80,
        actions: ['read', 'update']
    }
];

export const PRODUCT_MODULES: ModuleTemplate[] = [
    {
        code: 'LEADS',
        name: 'Leads',
        description: 'Sales Leads',
        is_core: false,
        default_active: true,
        sort_order: 200,
        actions: ['read', 'create', 'update', 'delete', 'convert', 'export']
    },
    {
        code: 'DEALS',
        name: 'Deals',
        description: 'Sales Opportunities',
        is_core: false,
        default_active: true,
        sort_order: 210,
        actions: ['read', 'create', 'update', 'delete', 'export']
    }
];
