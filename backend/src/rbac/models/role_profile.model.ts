
/**
 * RoleProfile Domain Model
 * 
 * Represents the assignment of a profile to a role.
 * Corresponds to the 'role_profiles' table.
 */

export interface RoleProfile {
    readonly organization_id: string; // BigInt
    readonly role_id: string; // BigInt
    readonly profile_id: string; // BigInt

    // Metadata
    readonly assigned_at: Date;
    readonly assigned_by?: string | null; // BigInt
}
