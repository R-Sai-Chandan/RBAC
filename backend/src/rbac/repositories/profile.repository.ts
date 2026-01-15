/**
 * ProfileRepository
 * 
 * Data access layer for Profile entities.
 * All operations scoped to organizationId for multi-tenant isolation.
 */

import { Profile } from '../models/profile.model';

export interface IProfileRepository {
    /**
     * Find profile by ID within organization
     * @throws ProfileNotFoundError
     */
    findById(organizationId: string, profileId: string): Promise<Profile | null>;

    /**
     * Find profile by code within organization
     * @throws ProfileNotFoundError
     */
    findByCode(organizationId: string, code: string): Promise<Profile | null>;

    /**
     * List all profiles in organization
     */
    findAllByOrganization(organizationId: string): Promise<Profile[]>;

    /**
     * List all active profiles in organization
     */
    findActiveByOrganization(organizationId: string): Promise<Profile[]>;

    /**
     * Create a new profile
     * @throws ProfileCreationError
     * @throws DuplicateProfileCodeError
     */
    create(organizationId: string, data: Omit<Profile, 'id' | 'organization_id' | 'created_at'>): Promise<Profile>;

    /**
     * Update profile
     * @throws ProfileNotFoundError
     */
    update(organizationId: string, profileId: string, data: Partial<Profile>): Promise<Profile>;

    /**
     * Delete profile (cascade handled by DB)
     * @throws ProfileNotFoundError
     */
    delete(organizationId: string, profileId: string): Promise<void>;
}
