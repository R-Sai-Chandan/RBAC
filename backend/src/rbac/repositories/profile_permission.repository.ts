/**
 * ProfilePermissionRepository
 * 
 * Data access layer for ProfilePermission assignments.
 * All operations scoped to organizationId for multi-tenant isolation.
 * Supports allow/deny effect management.
 */

import { ProfilePermission, ProfilePermissionEffect } from '../models/profile_permission.model';

export interface IProfilePermissionRepository {
    /**
     * Find all permissions assigned to a profile
     */
    findPermissionsByProfile(organizationId: string, profileId: string): Promise<ProfilePermission[]>;

    /**
     * Find all profiles assigned to a permission
     */
    findProfilesByPermission(organizationId: string, permissionId: string): Promise<ProfilePermission[]>;

    /**
     * Get specific profile-permission assignment
     */
    findAssignment(organizationId: string, profileId: string, permissionId: string): Promise<ProfilePermission | null>;

    /**
     * Assign permission to profile with effect
     * @throws ProfilePermissionAssignmentError
     * @throws DuplicateAssignmentError
     */
    assign(organizationId: string, profileId: string, permissionId: string, effect: ProfilePermissionEffect): Promise<ProfilePermission>;

    /**
     * Update permission effect
     * @throws ProfilePermissionNotFoundError
     */
    updateEffect(organizationId: string, profileId: string, permissionId: string, effect: ProfilePermissionEffect): Promise<ProfilePermission>;

    /**
     * Revoke permission from profile
     * @throws ProfilePermissionNotFoundError
     */
    revoke(organizationId: string, profileId: string, permissionId: string): Promise<void>;

    /**
     * Revoke all permissions from profile
     */
    revokeAllByProfile(organizationId: string, profileId: string): Promise<void>;
}
