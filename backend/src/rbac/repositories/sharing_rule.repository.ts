
import { Pool, QueryResultRow } from 'pg';
import { SharingRule } from '../models/sharing_rule.model';

export interface ISharingRuleRepository {
    create(organizationId: string, data: any): Promise<SharingRule>;
    update(organizationId: string, id: string, data: any): Promise<SharingRule>;
    delete(organizationId: string, id: string): Promise<void>;
    findById(organizationId: string, id: string): Promise<SharingRule | null>;
    findAllByOrganization(organizationId: string): Promise<SharingRule[]>;
    findActiveByOrganization(organizationId: string): Promise<SharingRule[]>;
    findByType(organizationId: string, type: string): Promise<SharingRule[]>;
    findByModule(organizationId: string, moduleId: string): Promise<SharingRule[]>;
}

export class SharingRuleRepository implements ISharingRuleRepository {
    private tableName = 'sharing_rules';

    constructor(private pool: InstanceType<typeof Pool>) { }

    protected async query<T extends QueryResultRow>(
        text: string,
        params?: unknown[]
    ): Promise<{ rows: T[], rowCount: number | null }> {
        return this.pool.query<T>(text, params);
    }

    async findById(organizationId: string, id: string): Promise<SharingRule | null> {
        const res = await this.query<SharingRule>(
            `SELECT * FROM ${this.tableName} WHERE id = $1 AND organization_id = $2`,
            [id, organizationId]
        );
        return res.rows[0] || null;
    }

    async findAllByOrganization(organizationId: string): Promise<SharingRule[]> {
        const res = await this.query<SharingRule>(
            `SELECT * FROM ${this.tableName} WHERE organization_id = $1`,
            [organizationId]
        );
        return res.rows;
    }

    async findActiveByOrganization(organizationId: string): Promise<SharingRule[]> {
        const res = await this.query<SharingRule>(
            `SELECT * FROM ${this.tableName} WHERE is_active = true AND organization_id = $1`,
            [organizationId]
        );
        return res.rows;
    }

    async findByType(organizationId: string, type: string): Promise<SharingRule[]> {
        const res = await this.query<SharingRule>(
            `SELECT * FROM ${this.tableName} WHERE rule_type = $1 AND organization_id = $2 `,
            [type, organizationId]
        );
        return res.rows;
    }

    async findByModule(organizationId: string, moduleId: string): Promise<SharingRule[]> {
        const res = await this.query<SharingRule>(
            `SELECT * FROM ${this.tableName} WHERE module_id = $1 AND organization_id = $2 `,
            [moduleId, organizationId]
        );
        return res.rows;
    }

    async create(organizationId: string, data: Record<string, unknown>): Promise<SharingRule> {
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

        const res = await this.query<SharingRule>(query, [organizationId, ...values]);
        return res.rows[0]!;
    }

    async update(organizationId: string, id: string, data: Record<string, unknown>): Promise<SharingRule> {
        const keys = Object.keys(data);
        const values = Object.values(data);
        if (keys.length === 0) return this.findById(organizationId, id) as Promise<SharingRule>;

        const setClause = keys.map((key, i) => `${key} = $${i + 3}`).join(', ');

        // Note: sharing_rules table does not have updated_at column per schema
        const query = `
            UPDATE ${this.tableName}
            SET ${setClause}
            WHERE id = $1 AND organization_id = $2
            RETURNING *
        `;

        const res = await this.query<SharingRule>(query, [id, organizationId, ...values]);
        if (res.rows.length === 0) throw new Error(`SharingRule ${id} not found for update`);
        return res.rows[0]!;
    }

    async delete(organizationId: string, id: string): Promise<void> {
        await this.query(
            `DELETE FROM ${this.tableName} WHERE id = $1 AND organization_id = $2`,
            [id, organizationId]
        );
    }
}
