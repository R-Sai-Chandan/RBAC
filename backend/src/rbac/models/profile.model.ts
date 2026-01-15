
/**
 * Profile Domain Model
 * 
 * Represents a collection of permissions.
 * Corresponds to the 'profiles' table.
 */

export interface Profile {
    readonly id: string; // BigInt
    readonly organization_id: string; // BigInt

    // Profile Metadata
    name: string;
    code: string;
    description?: string | null;
    is_active: boolean;

    // Audit
    readonly created_at: Date;
    readonly created_by?: string | null; // BigInt
}
