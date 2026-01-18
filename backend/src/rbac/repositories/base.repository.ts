
import { Pool, QueryResult } from 'pg';

export abstract class BaseRepository<T> {
    constructor(protected pool: Pool, protected tableName: string) { }

    protected async query(text: string, params?: unknown[]): Promise<QueryResult<T>> {
        return this.pool.query(text, params);
    }

    async findById(organizationId: string, id: string): Promise<T | null> {
        const res = await this.query(
            `SELECT * FROM ${this.tableName} WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL`,
            [id, organizationId]
        );
        return res.rows[0] || null;
    }

    async findAll(organizationId: string, filters?: Record<string, unknown>): Promise<T[]> {
        let query = `SELECT * FROM ${this.tableName} WHERE organization_id = $1 AND deleted_at IS NULL`;
        const params: unknown[] = [organizationId];

        // Simple filter implementation
        if (filters && Object.keys(filters).length > 0) {
            Object.keys(filters).forEach((key, index) => {
                query += ` AND ${key} = $${index + 2}`;
                params.push(filters[key]);
            });
        }

        const res = await this.query(query, params);
        return res.rows;
    }

    async create(organizationId: string, data: Record<string, unknown>): Promise<T> {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const indices = keys.map((_, i) => `$${i + 2}`).join(', ');
        const columns = keys.join(', ');

        const query = `
            INSERT INTO ${this.tableName} (organization_id, ${columns})
            VALUES ($1, ${indices})
            RETURNING *
        `;

        const res = await this.query(query, [organizationId, ...values]);
        return res.rows[0]!;
    }

    async update(organizationId: string, id: string, data: Record<string, unknown>): Promise<T> {
        const keys = Object.keys(data);
        const values = Object.values(data);
        if (keys.length === 0) return this.findById(organizationId, id) as Promise<T>; // No op

        const setClause = keys.map((key, i) => `${key} = $${i + 3}`).join(', ');

        const query = `
            UPDATE ${this.tableName}
            SET ${setClause}, updated_at = NOW()
            WHERE id = $1 AND organization_id = $2
            RETURNING *
        `;

        const res = await this.query(query, [id, organizationId, ...values]);
        if (res.rows.length === 0) throw new Error(`Entity ${id} not found for update`);
        return res.rows[0]!;
    }

    async delete(organizationId: string, id: string): Promise<void> {
        await this.query(
            `UPDATE ${this.tableName} SET deleted_at = NOW() WHERE id = $1 AND organization_id = $2`,
            [id, organizationId]
        );
    }
}
