
import { Pool } from 'pg';
import { BaseRepository } from './base.repository';
import { RecordShare } from '../models/record_share.model';

export interface IRecordShareRepository {
    create(organizationId: string, data: any): Promise<RecordShare>;
    delete(organizationId: string, id: string): Promise<void>;
    findById(organizationId: string, id: string): Promise<RecordShare | null>;
    findByRecord(organizationId: string, entityType: string, entityId: string): Promise<RecordShare[]>;
    findByUser(organizationId: string, userId: string): Promise<RecordShare[]>;
    findByGroup(organizationId: string, groupId: string): Promise<RecordShare[]>;
    findByRole(organizationId: string, roleId: string): Promise<RecordShare[]>;
    isSharedWithUser(organizationId: string, entityType: string, entityId: string, userId: string): Promise<boolean>;
    deleteAllByRecord(organizationId: string, entityType: string, entityId: string): Promise<void>;
}

export class RecordShareRepository extends BaseRepository<RecordShare> implements IRecordShareRepository {
    constructor(pool: InstanceType<typeof Pool>) {
        super(pool, 'record_shares');
    }

    async findByRecord(organizationId: string, entityType: string, entityId: string): Promise<RecordShare[]> {
        const res = await this.query(
            `SELECT * FROM ${this.tableName} WHERE entity_type = $1 AND entity_id = $2 AND organization_id = $3 AND deleted_at IS NULL`,
            [entityType, entityId, organizationId]
        );
        return res.rows;
    }

    async findByUser(organizationId: string, userId: string): Promise<RecordShare[]> {
        const res = await this.query(
            `SELECT * FROM ${this.tableName} WHERE user_id = $1 AND organization_id = $2 AND deleted_at IS NULL`,
            [userId, organizationId]
        );
        return res.rows;
    }

    async findByGroup(organizationId: string, groupId: string): Promise<RecordShare[]> {
        const res = await this.query(
            `SELECT * FROM ${this.tableName} WHERE group_id = $1 AND organization_id = $2 AND deleted_at IS NULL`,
            [groupId, organizationId]
        );
        return res.rows;
    }

    async findByRole(organizationId: string, roleId: string): Promise<RecordShare[]> {
        const res = await this.query(
            `SELECT * FROM ${this.tableName} WHERE role_id = $1 AND organization_id = $2 AND deleted_at IS NULL`,
            [roleId, organizationId]
        );
        return res.rows;
    }

    async isSharedWithUser(organizationId: string, entityType: string, entityId: string, userId: string): Promise<boolean> {
        // Complex check: Direct, Group, or Role
        // This query needs to join with user_roles/groups, but we'll stick to direct user check here for the basic implementation
        // The service usually aggregates, but if this method is strictly "Is there a share record for this user?", we check direct share.
        // Or does it imply effective share?
        // Service likely does logic. Let's start with direct share row existence.

        const res = await this.query(
            `SELECT 1 FROM ${this.tableName} WHERE entity_type = $1 AND entity_id = $2 AND user_id = $3 AND organization_id = $4 AND deleted_at IS NULL`,
            [entityType, entityId, userId, organizationId]
        );
        return (res.rowCount || 0) > 0;
    }

    async deleteAllByRecord(organizationId: string, entityType: string, entityId: string): Promise<void> {
        await this.query(
            `UPDATE ${this.tableName} SET deleted_at = NOW() WHERE entity_type = $1 AND entity_id = $2 AND organization_id = $3`,
            [entityType, entityId, organizationId]
        );
    }
}
