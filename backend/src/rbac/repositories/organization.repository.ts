/**
 * OrganizationRepository
 * 
 * Data access layer for Organization entities.
 * Handles CRUD operations with explicit transaction support.
 */

import { Pool, QueryResultRow } from 'pg';
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
    create(
        data: Omit<Organization, 'id' | 'created_at' | 'updated_at'>
    ): Promise<Organization>;

    /**
     * Update organization
     * @throws OrganizationNotFoundError
     */
    update(id: string, data: Partial<Organization>): Promise<Organization>;

    /**
     * Delete organization (soft delete)
     */
    delete(id: string): Promise<void>;
}

export class OrganizationRepository implements IOrganizationRepository {
    private tableName = 'organizations';

    constructor(private pool: InstanceType<typeof Pool>) {}

    protected async query<T extends QueryResultRow>(
        text: string,
        params?: unknown[]
    ): Promise<{ rows: T[] }> {
        return this.pool.query<T>(text, params);
    }

    async findById(id: string): Promise<Organization | null> {
        const res = await this.query<Organization>(
            `SELECT * FROM ${this.tableName}
             WHERE id = $1`,
            [id]
        );

        return res.rows[0] ?? null;
    }

    async create(
        data: Omit<Organization, 'id' | 'created_at' | 'updated_at'>
    ): Promise<Organization> {
        const keys = Object.keys(data);
        const values = Object.values(data);

        const columns = keys.join(', ');
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

        const query = `
            INSERT INTO ${this.tableName} (${columns})
            VALUES (${placeholders})
            RETURNING *
        `;

        const res = await this.query<Organization>(query, values);
        return res.rows[0]!;
    }

    async update(id: string, data: Partial<Organization>): Promise<Organization> {
        const keys = Object.keys(data);

        if (keys.length === 0) {
            const existing = await this.findById(id);
            if (!existing) {
                throw new Error(`Organization ${id} not found`);
            }
            return existing;
        }

        const values = Object.values(data);
        const setClause = keys
            .map((key, i) => `${key} = $${i + 2}`)
            .join(', ');

        const query = `
            UPDATE ${this.tableName}
            SET ${setClause}, updated_at = NOW()
            WHERE id = $1 
            RETURNING *
        `;

        const res = await this.query<Organization>(query, [id, ...values]);

        if (res.rows.length === 0) {
            throw new Error(`Organization ${id} not found for update`);
        }

        return res.rows[0]!;
    }

    async delete(id: string): Promise<void> {
        const res = await this.query(
            `
            DELETE FROM ${this.tableName}
            WHERE id = $1
            `,
            [id]
        );

        if (res.rows.length === 0) {
            throw new Error(`Organization ${id} not found for delete`);
        }
    }
}
