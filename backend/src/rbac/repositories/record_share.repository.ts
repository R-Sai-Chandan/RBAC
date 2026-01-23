
import { Pool, QueryResultRow } from 'pg';
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

export class RecordShareRepository implements IRecordShareRepository {
    private tableName = 'record_shares';

    constructor(private pool: InstanceType<typeof Pool>) { }

    protected async query<T extends QueryResultRow>(
        text: string,
        params?: unknown[]
    ): Promise<{ rows: T[], rowCount: number | null }> {
        return this.pool.query<T>(text, params);
    }

    async findById(organizationId: string, id: string): Promise<RecordShare | null> {
        const res = await this.query<RecordShare>(
            `SELECT * FROM ${this.tableName} WHERE id = $1 AND organization_id = $2`,
            [id, organizationId]
        );
        return res.rows[0] || null;
    }

    async findByRecord(organizationId: string, entityType: string, entityId: string): Promise<RecordShare[]> {
        const res = await this.query<RecordShare>(
            `SELECT * FROM ${this.tableName} WHERE entity_type = $1 AND entity_id = $2 AND organization_id = $3`,
            [entityType, entityId, organizationId]
        );
        return res.rows;
    }

    async findByUser(organizationId: string, userId: string): Promise<RecordShare[]> {
        const res = await this.query<RecordShare>(
            `SELECT * FROM ${this.tableName} WHERE user_id = $1 AND organization_id = $2 `,
            [userId, organizationId]
        );
        return res.rows;
    }

    async findByGroup(organizationId: string, groupId: string): Promise<RecordShare[]> {
        const res = await this.query<RecordShare>(
            `SELECT * FROM ${this.tableName} WHERE group_id = $1 AND organization_id = $2 `,
            [groupId, organizationId]
        );
        return res.rows;
    }

    async findByRole(organizationId: string, roleId: string): Promise<RecordShare[]> {
        const res = await this.query<RecordShare>(
            `SELECT * FROM ${this.tableName} WHERE role_id = $1 AND organization_id = $2 `,
            [roleId, organizationId]
        );
        return res.rows;
    }

    async isSharedWithUser(organizationId: string, entityType: string, entityId: string, userId: string): Promise<boolean> {
        const res = await this.query(
            `SELECT 1 FROM ${this.tableName} WHERE entity_type = $1 AND entity_id = $2 AND user_id = $3 AND organization_id = $4 `,
            [entityType, entityId, userId, organizationId]
        );
        return (res.rowCount || 0) > 0;
    }

    async deleteAllByRecord(organizationId: string, entityType: string, entityId: string): Promise<void> {
        // Soft delete: Set is_active to false for all shares of this record
        await this.query(
            `UPDATE ${this.tableName} SET is_active = false WHERE entity_type = $1 AND entity_id = $2 AND organization_id = $3`,
            [entityType, entityId, organizationId]
        );
    }


    async create(organizationId: string, data: Record<string, unknown>): Promise<RecordShare> {
        const { organization_id, ...cleanData } = data;

        const keys = Object.keys(cleanData);
        const values = Object.values(cleanData);
        const indices = keys.map((_, i) => `$${i + 2}`).join(', ');
        const columns = keys.join(', ');

        const query = `
            INSERT INTO ${this.tableName} (organization_id, ${columns})
            VALUES ($1, ${indices})
            RETURNING *
        `;

        const res = await this.query<RecordShare>(query, [organizationId, ...values]);
        return res.rows[0]!;
    }

    async delete(organizationId: string, id: string): Promise<void> {
        // Soft delete: Set is_active to false instead of physical deletion
        await this.query(
            `UPDATE ${this.tableName} SET is_active = false WHERE id = $1 AND organization_id = $2`,
            [id, organizationId]
        );
    }

}
