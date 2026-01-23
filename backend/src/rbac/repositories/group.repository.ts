
import { Pool, QueryResultRow } from 'pg';
import { Group } from '../models/group.model';

export interface IGroupRepository {
    create(organizationId: string, data: any): Promise<Group>;
    update(organizationId: string, id: string, data: any): Promise<Group>;
    delete(organizationId: string, id: string): Promise<void>;
    findById(organizationId: string, id: string): Promise<Group | null>;
    findAllByOrganization(organizationId: string): Promise<Group[]>;
    findActiveByOrganization(organizationId: string): Promise<Group[]>;
    findByName(organizationId: string, name: string): Promise<Group | null>;
}

export class GroupRepository implements IGroupRepository {
    private tableName = 'groups';

    constructor(private pool: InstanceType<typeof Pool>) { }

    protected async query<T extends QueryResultRow>(
        text: string,
        params?: unknown[]
    ): Promise<{ rows: T[], rowCount: number | null }> {
        return this.pool.query<T>(text, params);
    }

    async findById(organizationId: string, id: string): Promise<Group | null> {
        const res = await this.query<Group>(
            `SELECT * FROM ${this.tableName} WHERE id = $1 AND organization_id = $2`,
            [id, organizationId]
        );
        return res.rows[0] || null;
    }

    async findAllByOrganization(organizationId: string): Promise<Group[]> {
        const res = await this.query<Group>(
            `SELECT * FROM ${this.tableName} WHERE organization_id = $1`,
            [organizationId]
        );
        return res.rows;
    }

    async findActiveByOrganization(organizationId: string): Promise<Group[]> {
        const res = await this.query<Group>(
            `SELECT * FROM ${this.tableName} WHERE is_active = true AND organization_id = $1 `,
            [organizationId]
        );
        return res.rows;
    }

    async findByName(organizationId: string, name: string): Promise<Group | null> {
        const res = await this.query<Group>(
            `SELECT * FROM ${this.tableName} WHERE name = $1 AND organization_id = $2`,
            [name, organizationId]
        );
        return res.rows[0] || null;
    }

    async create(organizationId: string, data: Record<string, unknown>): Promise<Group> {
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

        const res = await this.query<Group>(query, [organizationId, ...values]);
        return res.rows[0]!;
    }

    async update(organizationId: string, id: string, data: Record<string, unknown>): Promise<Group> {
        const keys = Object.keys(data);
        const values = Object.values(data);
        if (keys.length === 0) return this.findById(organizationId, id) as Promise<Group>;

        const setClause = keys.map((key, i) => `${key} = $${i + 3}`).join(', ');

        // Note: groups table does not have updated_at column per schema
        const query = `
            UPDATE ${this.tableName}
            SET ${setClause}
            WHERE id = $1 AND organization_id = $2
            RETURNING *
        `;

        const res = await this.query<Group>(query, [id, organizationId, ...values]);
        if (res.rows.length === 0) throw new Error(`Group ${id} not found for update`);
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
