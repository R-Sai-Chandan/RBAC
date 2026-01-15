/**
 * RoleProfileRepository
 * 
 * Data access layer for RoleProfile assignments.
 * All operations scoped to organizationId for multi-tenant isolation.
 */

import { RoleProfile } from '../models/role_profile.model';

export interface IRoleProfileRepository {
    /**
     * Find all profiles assigned to a role
     */
    findProfilesByRole(organizationId: string, roleId: string): Promise<RoleProfile[]>;

    /**
     * Find all roles assigned to a profile
     */
    findRolesByProfile(organizationId: string, profileId: string): Promise<RoleProfile[]>;

    /**
     * Check if role has specific profile
     */
    hasProfile(organizationId: string, roleId: string, profileId: string): Promise<boolean>;

    /**
     * Assign profile to role
     * @throws RoleProfileAssignmentError
     * @throws DuplicateAssignmentError
     */
    assign(organizationId: string, roleId: string, profileId: string, assignedBy?: string): Promise<RoleProfile>;

    /**
     * Revoke profile from role
     * @throws RoleProfileNotFoundError
     */
    revoke(organizationId: string, roleId: string, profileId: string): Promise<void>;

    /**
     * Revoke all profiles from role
     */
    revokeAllByRole(organizationId: string, roleId: string): Promise<void>;
}
