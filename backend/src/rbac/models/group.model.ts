
/**
 * Group Domain Model
 * 
 * Represents a group of users for shared permissions/sharing rules.
 * Corresponds to the 'groups' table.
 */

export interface Group {
    readonly id: string; // BigInt
    readonly organization_id: string; // BigInt

    // Metadata
    name: string;
    description?: string | null;
    is_active: boolean;

    // Audit
    readonly created_at: Date;
    readonly created_by?: string | null; // BigInt
}
