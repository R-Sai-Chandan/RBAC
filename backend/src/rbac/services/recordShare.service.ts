/**
 * RecordShareService
 * 
 * Service layer for RecordShare management.
 * OWNS: Record share lifecycle, ad-hoc record access grants
 * MUST NOT: Evaluate permissions, manage sharing rules, manage users/roles/groups
 */

import { RecordShare } from '../models/record_share.model';
import { IRecordShareRepository } from '../repositories/record_share.repository';
import { RBACInternalError } from '../errors/rbac.errors';

export interface IRecordShareService {
    /**
     * Get record share by ID
     * @throws RecordShareNotFoundError
     */
    getById(organizationId: string, shareId: string): Promise<RecordShare>;

    /**
     * List all shares for a specific record
     */
    listByRecord(
        organizationId: string,
        moduleId: string,
        recordId: string
    ): Promise<RecordShare[]>;

    /**
     * List all records shared with a user
     */
    listByUser(organizationId: string, userId: string): Promise<RecordShare[]>;

    /**
     * List all records shared with a group
     */
    listByGroup(organizationId: string, groupId: string): Promise<RecordShare[]>;

    /**
     * List all records shared with a role
     */
    listByRole(organizationId: string, roleId: string): Promise<RecordShare[]>;

    /**
     * Check if record is shared with user
     */
    isSharedWithUser(
        organizationId: string,
        moduleId: string,
        recordId: string,
        userId: string
    ): Promise<boolean>;

    /**
     * Create new record share
     * @throws RecordShareCreationError
     */
    create(
        organizationId: string,
        data: {
            module_id: string;
            record_id: string;
            shared_with_user_id?: string;
            shared_with_group_id?: string;
            shared_with_role_id?: string;
        },
        actingUserId: string
    ): Promise<RecordShare>;

    /**
     * Delete record share
     * @throws RecordShareNotFoundError
     */
    delete(
        organizationId: string,
        shareId: string,
        actingUserId: string
    ): Promise<void>;

    /**
     * Delete all shares for a record
     */
    deleteAllByRecord(
        organizationId: string,
        moduleId: string,
        recordId: string,
        actingUserId: string
    ): Promise<void>;
}

/**
 * RecordShareService Implementation
 */
export class RecordShareService implements IRecordShareService {
    constructor(private readonly recordShareRepository: IRecordShareRepository) { }

    async getById(organizationId: string, shareId: string): Promise<RecordShare> {
        // TODO_TEST: Verify record share retrieval
        const share = await this.recordShareRepository.findById(organizationId, shareId);
        if (!share) {
            throw new RBACInternalError(`Record share not found: ${shareId}`);
        }
        return share;
    }

    async listByRecord(
        organizationId: string,
        moduleId: string,
        recordId: string
    ): Promise<RecordShare[]> {
        // TODO_TEST: Verify record share listing by record
        return await this.recordShareRepository.findByRecord(organizationId, moduleId, recordId);
    }

    async listByUser(organizationId: string, userId: string): Promise<RecordShare[]> {
        // TODO_TEST: Verify record share listing by user
        return await this.recordShareRepository.findByUser(organizationId, userId);
    }

    async listByGroup(organizationId: string, groupId: string): Promise<RecordShare[]> {
        // TODO_TEST: Verify record share listing by group
        return await this.recordShareRepository.findByGroup(organizationId, groupId);
    }

    async listByRole(organizationId: string, roleId: string): Promise<RecordShare[]> {
        // TODO_TEST: Verify record share listing by role
        return await this.recordShareRepository.findByRole(organizationId, roleId);
    }

    async isSharedWithUser(
        organizationId: string,
        moduleId: string,
        recordId: string,
        userId: string
    ): Promise<boolean> {
        // TODO_TEST: Verify record share check
        return await this.recordShareRepository.isSharedWithUser(organizationId, moduleId, recordId, userId);
    }

    async create(
        organizationId: string,
        data: {
            module_id: string;
            record_id: string;
            shared_with_user_id?: string;
            shared_with_group_id?: string;
            shared_with_role_id?: string;
        },
        actingUserId: string
    ): Promise<RecordShare> {
        // TODO_INVARIANT: Enforce authorization to share records
        // TODO_INVARIANT: Ensure exactly one entity type is set
        // TODO_INVARIANT: Prevent duplicate record shares
        // TODO_INVARIANT: Audit record sharing lifecycle
        // TODO_TEST: Verify record share creation

        const shareData: Omit<RecordShare, 'id' | 'organization_id' | 'created_at'> = {
            module_id: data.module_id,
            record_id: data.record_id,
            shared_with_user_id: data.shared_with_user_id || null,
            shared_with_group_id: data.shared_with_group_id || null,
            shared_with_role_id: data.shared_with_role_id || null,
            is_active: true,
            created_by: actingUserId
        };

        return await this.recordShareRepository.create(organizationId, shareData);
    }

    async delete(
        organizationId: string,
        shareId: string,
        actingUserId: string
    ): Promise<void> {
        // TODO_INVARIANT: Audit record sharing lifecycle
        // TODO_TEST: Verify record share deletion

        await this.recordShareRepository.delete(organizationId, shareId);
    }

    async deleteAllByRecord(
        organizationId: string,
        moduleId: string,
        recordId: string,
        actingUserId: string
    ): Promise<void> {
        // TODO_INVARIANT: Audit record sharing lifecycle
        // TODO_TEST: Verify bulk record share deletion

        await this.recordShareRepository.deleteAllByRecord(organizationId, moduleId, recordId);
    }
}
