/**
 * OrganizationRepository
 * 
 * Data access layer for Organization entities.
 * Handles CRUD operations with explicit transaction support.
 */

import { Organization } from '../models/organization.model';

export interface IOrganizationRepository {
    /**
     * Find organization by ID
     * @throws OrganizationNotFoundError
     */
    findById(id: string): Promise<Organization | null>;

    /**
     * Create a new organization
     * @throws OrganizationCreationError
     */
    create(data: Omit<Organization, 'id' | 'created_at' | 'updated_at'>): Promise<Organization>;

    /**
     * Update organization
     * @throws OrganizationNotFoundError
     */
    update(id: string, data: Partial<Organization>): Promise<Organization>;

    /**
     * Delete organization (cascade handled by DB)
     * @throws OrganizationNotFoundError
     */
    delete(id: string): Promise<void>;
}
