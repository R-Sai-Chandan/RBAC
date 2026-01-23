
import { Pool, QueryResultRow } from 'pg';
import { SmtpConfig } from '../models/smtp_config.model';

export interface ISmtpConfigRepository {
    create(organizationId: string, data: any): Promise<SmtpConfig>;
    update(organizationId: string, id: string, data: any): Promise<SmtpConfig>;
    delete(organizationId: string, id: string): Promise<void>;
    findById(organizationId: string, id: string): Promise<SmtpConfig | null>;
    findAllByOrganization(organizationId: string): Promise<SmtpConfig[]>;
    findActiveByOrganization(organizationId: string): Promise<SmtpConfig | null>;
}

export class SmtpConfigRepository implements ISmtpConfigRepository {
    private tableName = 'smtp_configs';

    constructor(private pool: InstanceType<typeof Pool>) { }

    protected async query<T extends QueryResultRow>(
        text: string,
        params?: unknown[]
    ): Promise<{ rows: T[], rowCount: number | null }> {
        return this.pool.query<T>(text, params);
    }

    async findById(organizationId: string, id: string): Promise<SmtpConfig | null> {
        const res = await this.query<SmtpConfig>(
            `SELECT * FROM ${this.tableName} WHERE id = $1 AND organization_id = $2`,
            [id, organizationId]
        );
        return res.rows[0] || null;
    }

    async findAllByOrganization(organizationId: string): Promise<SmtpConfig[]> {
        const res = await this.query<SmtpConfig>(
            `SELECT * FROM ${this.tableName} WHERE organization_id = $1`,
            [organizationId]
        );
        return res.rows;
    }

    async findActiveByOrganization(organizationId: string): Promise<SmtpConfig | null> {
        const res = await this.query<SmtpConfig>(
            `SELECT * FROM ${this.tableName} WHERE is_active = true AND organization_id = $1 `,
            [organizationId]
        );
        return res.rows[0] || null;
    }

    async create(organizationId: string, data: Record<string, unknown>): Promise<SmtpConfig> {
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

        const res = await this.query<SmtpConfig>(query, [organizationId, ...values]);
        return res.rows[0]!;
    }

    async update(organizationId: string, id: string, data: Record<string, unknown>): Promise<SmtpConfig> {
        const keys = Object.keys(data);
        const values = Object.values(data);
        if (keys.length === 0) return this.findById(organizationId, id) as Promise<SmtpConfig>;

        const setClause = keys.map((key, i) => `${key} = $${i + 3}`).join(', ');

        // Note: smtp_configs table does not have updated_at column per schema
        const query = `
            UPDATE ${this.tableName}
            SET ${setClause}
            WHERE id = $1 AND organization_id = $2
            RETURNING *
        `;

        const res = await this.query<SmtpConfig>(query, [id, organizationId, ...values]);
        if (res.rows.length === 0) throw new Error(`SmtpConfig ${id} not found for update`);
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
