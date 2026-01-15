/**
 * PermissionRepository
 * 
 * Data access layer for Permission entities.
 * All operations scoped to organizationId for multi-tenant isolation.
 */

import { Permission, PermissionAction } from '../models/permission.model';

export interface IPermissionRepository {
    /**
     * Find permission by ID within organization
     * @throws PermissionNotFoundError
     */
    findById(organizationId: string, permissionId: string): Promise<Permission | null>;

    /**
     * Find permission by module and action
     * @throws PermissionNotFoundError
     */
    findByModuleAndAction(organizationId: string, moduleId: string, action: PermissionAction): Promise<Permission | null>;

    /**
     * List all permissions for a module
     */
    findByModule(organizationId: string, moduleId: string): Promise<Permission[]>;

    /**
     * List all permissions in organization
     */
    findAllByOrganization(organizationId: string): Promise<Permission[]>;

    /**
     * Create a new permission
     * @throws PermissionCreationError
     * @throws DuplicatePermissionError
     */
    create(organizationId: string, data: Omit<Permission, 'id' | 'organization_id'>): Promise<Permission>;

    /**
     * Update permission
     * @throws PermissionNotFoundError
     */
    update(organizationId: string, permissionId: string, data: Partial<Permission>): Promise<Permission>;

    /**
     * Delete permission (cascade handled by DB)
     * @throws PermissionNotFoundError
     */
    delete(organizationId: string, permissionId: string): Promise<void>;
}
