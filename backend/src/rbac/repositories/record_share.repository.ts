/**
 * RecordShareRepository
 * 
 * Data access layer for RecordShare entities.
 * All operations scoped to organizationId for multi-tenant isolation.
 */

import { RecordShare } from '../models/record_share.model';

export interface IRecordShareRepository {
    /**
     * Find record share by ID within organization
     * @throws RecordShareNotFoundError
     */
    findById(organizationId: string, shareId: string): Promise<RecordShare | null>;

    /**
     * Find all shares for a specific record
     */
    findByRecord(organizationId: string, moduleId: string, recordId: string): Promise<RecordShare[]>;

    /**
     * Find all records shared with a user
     */
    findByUser(organizationId: string, userId: string): Promise<RecordShare[]>;

    /**
     * Find all records shared with a group
     */
    findByGroup(organizationId: string, groupId: string): Promise<RecordShare[]>;

    /**
     * Find all records shared with a role
     */
    findByRole(organizationId: string, roleId: string): Promise<RecordShare[]>;

    /**
     * Check if record is shared with user
     */
    isSharedWithUser(organizationId: string, moduleId: string, recordId: string, userId: string): Promise<boolean>;

    /**
     * Create a new record share
     * @throws RecordShareCreationError
     */
    create(organizationId: string, data: Omit<RecordShare, 'id' | 'organization_id' | 'created_at'>): Promise<RecordShare>;

    /**
     * Delete record share
     * @throws RecordShareNotFoundError
     */
    delete(organizationId: string, shareId: string): Promise<void>;

    /**
     * Delete all shares for a record
     */
    deleteAllByRecord(organizationId: string, moduleId: string, recordId: string): Promise<void>;
}
