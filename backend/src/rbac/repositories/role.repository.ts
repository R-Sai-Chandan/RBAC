/**
 * RoleRepository
 * 
 * Data access layer for Role entities.
 * All operations scoped to organizationId for multi-tenant isolation.
 * Supports hierarchical role queries.
 */

import { Role } from '../models/role.model';

export interface IRoleRepository {
    /**
     * Find role by ID within organization
     * @throws RoleNotFoundError
     */
    findById(organizationId: string, roleId: string): Promise<Role | null>;

    /**
     * Find role by code within organization
     * @throws RoleNotFoundError
     */
    findByCode(organizationId: string, code: string): Promise<Role | null>;

    /**
     * List all roles in organization
     */
    findAllByOrganization(organizationId: string): Promise<Role[]>;

    /**
     * Find child roles of a parent role
     */
    findChildRoles(organizationId: string, parentRoleId: string): Promise<Role[]>;

    /**
     * Find all ancestor roles (recursive)
     * Used to prevent circular references
     */
    findAncestors(organizationId: string, roleId: string): Promise<Role[]>;

    /**
     * Create a new role
     * @throws RoleCreationError
     * @throws DuplicateRoleCodeError
     * @throws CircularRoleHierarchyError
     */
    create(organizationId: string, data: Omit<Role, 'id' | 'organization_id' | 'created_at'>): Promise<Role>;

    /**
     * Update role
     * @throws RoleNotFoundError
     * @throws CircularRoleHierarchyError
     */
    update(organizationId: string, roleId: string, data: Partial<Role>): Promise<Role>;

    /**
     * Delete role (cascade handled by DB)
     * @throws RoleNotFoundError
     */
    delete(organizationId: string, roleId: string): Promise<void>;
}
