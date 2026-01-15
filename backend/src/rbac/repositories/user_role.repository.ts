/**
 * UserRoleRepository
 * 
 * Data access layer for UserRole assignments.
 * All operations scoped to organizationId for multi-tenant isolation.
 */

import { UserRole } from '../models/user_role.model';

export interface IUserRoleRepository {
    /**
     * Find all roles assigned to a user
     */
    findRolesByUser(organizationId: string, userId: string): Promise<UserRole[]>;

    /**
     * Find all users assigned to a role
     */
    findUsersByRole(organizationId: string, roleId: string): Promise<UserRole[]>;

    /**
     * Check if user has specific role
     */
    hasRole(organizationId: string, userId: string, roleId: string): Promise<boolean>;

    /**
     * Assign role to user
     * @throws UserRoleAssignmentError
     * @throws DuplicateAssignmentError
     */
    assign(organizationId: string, userId: string, roleId: string, assignedBy?: string): Promise<UserRole>;

    /**
     * Revoke role from user
     * @throws UserRoleNotFoundError
     */
    revoke(organizationId: string, userId: string, roleId: string): Promise<void>;

    /**
     * Revoke all roles from user
     */
    revokeAllByUser(organizationId: string, userId: string): Promise<void>;
}
