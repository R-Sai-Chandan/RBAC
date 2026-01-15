/**
 * GroupRepository
 * 
 * Data access layer for Group entities.
 * All operations scoped to organizationId for multi-tenant isolation.
 */

import { Group } from '../models/group.model';

export interface IGroupRepository {
    /**
     * Find group by ID within organization
     * @throws GroupNotFoundError
     */
    findById(organizationId: string, groupId: string): Promise<Group | null>;

    /**
     * Find group by name within organization
     * @throws GroupNotFoundError
     */
    findByName(organizationId: string, name: string): Promise<Group | null>;

    /**
     * List all groups in organization
     */
    findAllByOrganization(organizationId: string): Promise<Group[]>;

    /**
     * List all active groups in organization
     */
    findActiveByOrganization(organizationId: string): Promise<Group[]>;

    /**
     * Create a new group
     * @throws GroupCreationError
     * @throws DuplicateGroupNameError
     */
    create(organizationId: string, data: Omit<Group, 'id' | 'organization_id' | 'created_at'>): Promise<Group>;

    /**
     * Update group
     * @throws GroupNotFoundError
     */
    update(organizationId: string, groupId: string, data: Partial<Group>): Promise<Group>;

    /**
     * Delete group (cascade handled by DB)
     * @throws GroupNotFoundError
     */
    delete(organizationId: string, groupId: string): Promise<void>;
}
