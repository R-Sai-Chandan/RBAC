
/**
 * SharingRule Domain Model
 * 
 * Represents a rule for sharing records across entities.
 * Corresponds to the 'sharing_rules' table.
 */

export enum SharingRuleType {
    USER_TO_USER = 'user_to_user',
    ROLE_TO_ROLE = 'role_to_role',
    GROUP_TO_GROUP = 'group_to_group',
    RECORD_LEVEL = 'record_level'
}

export interface SharingRule {
    readonly id: string; // BigInt
    readonly organization_id: string; // BigInt

    rule_type: SharingRuleType;

    // Source / Target
    source_user_id?: string | null; // BigInt
    target_user_id?: string | null; // BigInt

    source_role_id?: string | null; // BigInt
    target_role_id?: string | null; // BigInt

    source_group_id?: string | null; // BigInt
    target_group_id?: string | null; // BigInt

    module_id?: string | null; // BigInt

    // Metadata
    is_active: boolean;

    // Audit
    readonly created_at: Date;
    readonly created_by?: string | null; // BigInt
}
