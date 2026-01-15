
/**
 * ProfilePermission Domain Model
 * 
 * Represents the assignment of a permission to a profile with an effect (allow/deny).
 * Corresponds to the 'profile_permissions' table.
 */

export enum ProfilePermissionEffect {
    ALLOW = 'allow',
    DENY = 'deny'
}

export interface ProfilePermission {
    readonly organization_id: string; // BigInt
    readonly profile_id: string; // BigInt
    readonly permission_id: string; // BigInt

    // Effect
    effect: ProfilePermissionEffect;
}
