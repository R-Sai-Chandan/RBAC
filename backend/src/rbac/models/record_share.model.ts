
/**
 * RecordShare Domain Model
 * 
 * Represents ad-hoc sharing of a specific record.
 * Corresponds to the 'record_shares' table.
 */

export interface RecordShare {
    readonly id: string; // BigInt
    readonly organization_id: string; // BigInt
    readonly module_id: string; // BigInt
    readonly record_id: string; // BigInt (Generic ID)

    // Shared Agent
    shared_with_user_id?: string | null; // BigInt
    shared_with_group_id?: string | null; // BigInt
    shared_with_role_id?: string | null; // BigInt

    // Audit
    readonly created_at: Date;
    readonly created_by?: string | null; // BigInt
}
