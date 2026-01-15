
/**
 * UserGroup Domain Model
 * 
 * Represents the assignment of a user to a group.
 * Corresponds to the 'user_groups' table.
 */

export interface UserGroup {
    readonly organization_id: string; // BigInt
    readonly user_id: string; // BigInt
    readonly group_id: string; // BigInt

    // Metadata
    readonly assigned_at: Date;
    readonly assigned_by?: string | null; // BigInt
}
