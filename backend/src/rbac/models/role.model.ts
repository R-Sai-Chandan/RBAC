
/**
 * Role Domain Model
 * 
 * Represents a hierarchical role within an organization.
 * Corresponds to the 'roles' table.
 */

export interface Role {
    readonly id: string; // BigInt
    readonly organization_id: string; // BigInt

    // Role Data
    name: string;
    code: string;
    description?: string | null;

    // Hierarchy
    parent_role_id?: string | null; // BigInt

    // Status
    is_active: boolean;

    // Audit
    readonly created_at: Date;
    readonly created_by?: string | null; // BigInt
}
