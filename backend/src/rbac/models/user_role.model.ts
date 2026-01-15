
/**
 * UserRole Domain Model
 * 
 * Represents the assignment of a role to a user.
 * Corresponds to the 'user_roles' table.
 */

export interface UserRole {
    readonly organization_id: string; // BigInt
    readonly user_id: string; // BigInt
    readonly role_id: string; // BigInt

    // Assignment Metadata
    readonly assigned_at: Date;
    readonly assigned_by?: string | null; // BigInt
}
