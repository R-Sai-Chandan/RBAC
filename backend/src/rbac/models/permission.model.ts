
/**
 * Permission Domain Model
 * 
 * Represents a granular action on a module.
 * Corresponds to the 'permissions' table.
 */

export enum PermissionAction {
    CREATE = 'create',
    READ = 'read',
    UPDATE = 'update',
    DELETE = 'delete',
    EXPORT = 'export'
}

export interface Permission {
    readonly id: string; // BigInt
    readonly organization_id: string; // BigInt
    readonly module_id: string; // BigInt

    // Metadata
    description?: string | null;
    is_active: boolean;

    // Action
    action: PermissionAction;
}
