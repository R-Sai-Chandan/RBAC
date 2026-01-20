
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
        code: 'users',
        name: 'Users',
        description: 'Manage system users and access',
        is_core: true,
        default_active: true,
        sort_order: 10,
        actions: ['read', 'create', 'update', 'delete', 'export']
    },
    {
        code: 'roles',
        name: 'Roles',
        description: 'Manage roles and hierarchies',
        is_core: true,
        default_active: true,
        sort_order: 20,
        actions: ['read', 'create', 'update', 'delete', 'export']
    },
    {
        code: 'profiles',
        name: 'Profiles',
        description: 'Manage permissions and profiles',
        is_core: true,
        default_active: true,
        sort_order: 30,
        actions: ['read', 'create', 'update', 'delete', 'export', 'manage_permissions']
    },
    {
        code: 'groups',
        name: 'Groups',
        description: 'Manage user groups',
        is_core: true,
        default_active: true,
        sort_order: 40,
        actions: ['read', 'create', 'update', 'delete', 'export']
    },
    {
        code: 'sharing_rules',
        name: 'Sharing Rules',
        description: 'Manage data sharing policies',
        is_core: true,
        default_active: true,
        sort_order: 50,
        actions: ['read', 'create', 'update', 'delete']
    },
    {
        code: 'audit_logs',
        name: 'Audit Logs',
        description: 'View system audit trails',
        is_core: true,
        default_active: true,
        sort_order: 100,
        actions: ['read', 'export']
    },
    // SETTINGS / CONFIG Modules
    {
        code: 'smtp_config',
        name: 'SMTP Configuration',
        description: 'Manage email settings',
        is_core: true,
        default_active: true,
        sort_order: 80,
        actions: ['read', 'update']
    }
];

export const PRODUCT_MODULES: ModuleTemplate[] = [
    {
        code: 'leads',
        name: 'Leads',
        description: 'Sales Leads',
        is_core: false,
        default_active: true,
        sort_order: 200,
        actions: ['read', 'create', 'update', 'delete', 'convert', 'export']
    },
    {
        code: 'deals',
        name: 'Deals',
        description: 'Sales Opportunities',
        is_core: false,
        default_active: true,
        sort_order: 210,
        actions: ['read', 'create', 'update', 'delete', 'export']
    }
];
