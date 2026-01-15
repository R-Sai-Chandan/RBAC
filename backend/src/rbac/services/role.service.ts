/**
 * RoleService
 * 
 * Business logic for role management.
 * NO permission evaluation logic here.
 */

import { Role } from '../models/role.model';
import { IRoleRepository } from '../repositories/role.repository';
import { IUserRoleRepository } from '../repositories/user_role.repository';
import { IUserRepository } from '../repositories/user.repository';
import {
    RoleNotFoundError,
    DuplicateAssignmentError,
    CircularRoleHierarchyError,
    UserNotFoundError,
    RBACInternalError
} from '../errors/rbac.errors';

export interface IRoleService {
    /**
     * Get role by ID
     * @throws RoleNotFoundError
     * @throws TenantMismatchError
     */
    getById(organizationId: string, roleId: string): Promise<Role>;

    /**
     * Get role by code
     * @throws RoleNotFoundError
     */
    getByCode(organizationId: string, code: string): Promise<Role>;

    /**
     * List all roles in organization
     */
    listAll(organizationId: string): Promise<Role[]>;

    /**
     * Get role hierarchy (ancestors)
     * Returns array from root to current role
     */
    getAncestors(organizationId: string, roleId: string): Promise<Role[]>;

    /**
     * Get child roles
     */
    getChildren(organizationId: string, roleId: string): Promise<Role[]>;

    /**
     * Create new role
     * 
     * Validates:
     * - Unique code within organization
     * - Parent role exists (if provided)
     * - No circular hierarchy
     * 
     * @throws DuplicateAssignmentError if code exists
     * @throws RoleNotFoundError if parent doesn't exist
     * @throws CircularRoleHierarchyError if circular
     */
    create(
        organizationId: string,
        data: {
            name: string;
            code: string;
            description?: string;
            parent_role_id?: string;
            is_active?: boolean;
        },
        createdBy?: string
    ): Promise<Role>;

    /**
     * Update role
     * 
     * Validates:
     * - Role exists
     * - No circular hierarchy if changing parent
     * 
     * @throws RoleNotFoundError
     * @throws CircularRoleHierarchyError
     */
    update(
        organizationId: string,
        roleId: string,
        data: Partial<Role>
    ): Promise<Role>;

    /**
     * Delete role
     * Cascade handled by database
     * 
     * @throws RoleNotFoundError
     */
    delete(organizationId: string, roleId: string): Promise<void>;

    /**
     * Assign role to user
     * @throws RoleNotFoundError
     * @throws UserNotFoundError
     * @throws DuplicateAssignmentError
     */
    assignToUser(
        organizationId: string,
        roleId: string,
        userId: string,
        assignedBy?: string
    ): Promise<void>;

    /**
     * Revoke role from user
     * @throws RoleNotFoundError
     * @throws UserNotFoundError
     */
    revokeFromUser(
        organizationId: string,
        roleId: string,
        userId: string
    ): Promise<void>;

    /**
     * Get all users with this role
     */
    getUsersWithRole(organizationId: string, roleId: string): Promise<string[]>;
}

/**
 * RoleService Implementation
 */
export class RoleService implements IRoleService {
    constructor(
        private readonly roleRepository: IRoleRepository,
        private readonly userRoleRepository: IUserRoleRepository,
        private readonly userRepository: IUserRepository
    ) { }

    async getById(organizationId: string, roleId: string): Promise<Role> {
        // TODO_TEST: Verify role retrieval
        const role = await this.roleRepository.findById(organizationId, roleId);
        if (!role) {
            throw new RoleNotFoundError(organizationId, roleId);
        }
        return role;
    }

    async getByCode(organizationId: string, code: string): Promise<Role> {
        // TODO_TEST: Verify role retrieval by code
        const role = await this.roleRepository.findByCode(organizationId, code);
        if (!role) {
            throw new RoleNotFoundError(organizationId, code);
        }
        return role;
    }

    async listAll(organizationId: string): Promise<Role[]> {
        // TODO_TEST: Verify role listing
        return await this.roleRepository.findAllByOrganization(organizationId);
    }

    async getAncestors(organizationId: string, roleId: string): Promise<Role[]> {
        // TODO_TEST: Verify ancestor retrieval
        return await this.roleRepository.findAncestors(organizationId, roleId);
    }

    async getChildren(organizationId: string, roleId: string): Promise<Role[]> {
        // TODO_TEST: Verify child role retrieval
        return await this.roleRepository.findChildRoles(organizationId, roleId);
    }

    async create(
        organizationId: string,
        data: {
            name: string;
            code: string;
            description?: string;
            parent_role_id?: string;
            is_active?: boolean;
        },
        createdBy?: string
    ): Promise<Role> {
        // INVARIANT: Prevent circular role hierarchies
        // WHY: A role cannot be its own ancestor (prevents infinite loops in permission evaluation)
        if (data.parent_role_id) {
            // Verify parent exists
            const parentRole = await this.roleRepository.findById(organizationId, data.parent_role_id);
            if (!parentRole) {
                throw new RoleNotFoundError(organizationId, data.parent_role_id);
            }

            // TODO_TEST: Verify circular hierarchy prevention on create
        }

        const roleData: Omit<Role, 'id' | 'organization_id' | 'created_at'> = {
            name: data.name,
            code: data.code,
            description: data.description || null,
            parent_role_id: data.parent_role_id || null,
            is_active: data.is_active ?? true,
            created_by: createdBy || null
        };

        return await this.roleRepository.create(organizationId, roleData);
    }

    async update(
        organizationId: string,
        roleId: string,
        data: Partial<Role>
    ): Promise<Role> {
        // INVARIANT: Prevent reassignment of parent_role_id that introduces cycles
        // WHY: Changing parent must not create circular hierarchy
        if (data.parent_role_id !== undefined && data.parent_role_id !== null) {
            // Get all ancestors of the new parent
            const ancestors = await this.roleRepository.findAncestors(organizationId, data.parent_role_id);

            // Check if current role is in the ancestor chain
            const wouldCreateCycle = ancestors.some(ancestor => ancestor.id === roleId);
            if (wouldCreateCycle) {
                throw new CircularRoleHierarchyError(roleId, data.parent_role_id);
            }

            // TODO_TEST: Verify circular hierarchy prevention on update
        }

        return await this.roleRepository.update(organizationId, roleId, data);
    }

    async delete(organizationId: string, roleId: string): Promise<void> {
        // TODO_TEST: Verify role deletion
        await this.roleRepository.delete(organizationId, roleId);
    }

    async assignToUser(
        organizationId: string,
        roleId: string,
        userId: string,
        assignedBy?: string
    ): Promise<void> {
        // INVARIANT: Enforce role assignment permissions
        // WHY: Only authorized users should be able to assign roles
        // TODO_IMPLEMENTATION: Check if assignedBy user has permission to assign this role
        // This would require calling EvaluationService, but we want to avoid circular dependencies
        // Consider implementing this at the controller/middleware layer instead

        // TODO_TEST: Verify role assignment
        await this.userRoleRepository.assign(organizationId, userId, roleId, assignedBy);
    }

    async revokeFromUser(
        organizationId: string,
        roleId: string,
        userId: string
    ): Promise<void> {
        // INVARIANT: Prevent revoking the last role from an active user
        // WHY: Active users must always have at least one role for system integrity
        const user = await this.userRepository.findById(organizationId, userId);
        if (!user) {
            throw new UserNotFoundError(organizationId, userId);
        }

        // Only enforce for active users
        if (user.is_active) {
            const userRoles = await this.userRoleRepository.findRolesByUser(organizationId, userId);

            // If user only has one role and we're revoking it, fail
            if (userRoles.length === 1 && userRoles[0]?.role_id === roleId) {
                throw new RBACInternalError(
                    `Cannot revoke last role from active user ${userId}. Active users must have at least one role.`
                );
            }
        }

        // INVARIANT: Enforce role revocation permissions
        // WHY: Only authorized users should be able to revoke roles
        // TODO_IMPLEMENTATION: Check if acting user has permission to revoke this role

        // TODO_TEST: Verify role revocation and last-role prevention
        await this.userRoleRepository.revoke(organizationId, userId, roleId);
    }

    async getUsersWithRole(organizationId: string, roleId: string): Promise<string[]> {
        // TODO_TEST: Verify user listing by role
        const userRoles = await this.userRoleRepository.findUsersByRole(organizationId, roleId);
        return userRoles.map(ur => ur.user_id);
    }
}
