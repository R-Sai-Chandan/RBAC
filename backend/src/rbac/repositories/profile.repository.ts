
import { Pool, QueryResultRow } from 'pg';
import { Profile } from '../models/profile.model';

export interface IProfileRepository {
    create(organizationId: string, data: any): Promise<Profile>;
    update(organizationId: string, id: string, data: any): Promise<Profile>;
    delete(organizationId: string, id: string): Promise<void>;
    findById(organizationId: string, id: string): Promise<Profile | null>;
    findByCode(organizationId: string, code: string): Promise<Profile | null>;
    findAllByOrganization(organizationId: string): Promise<Profile[]>;
    findActiveByOrganization(organizationId: string): Promise<Profile[]>;
    getAssignedPermissionIds(organizationId: string, profileId: string): Promise<string[]>;
}

export class ProfileRepository implements IProfileRepository {
    private tableName = 'profiles';

    constructor(private pool: InstanceType<typeof Pool>) { }

    protected async query<T extends QueryResultRow>(
        text: string,
        params?: unknown[]
    ): Promise<{ rows: T[], rowCount: number | null }> {
        return this.pool.query<T>(text, params);
    }

    async findById(organizationId: string, id: string): Promise<Profile | null> {
        const res = await this.query<Profile>(
            `SELECT * FROM ${this.tableName} WHERE id = $1 AND organization_id = $2`,
            [id, organizationId]
        );
        return res.rows[0] || null;
    }

    async findByCode(organizationId: string, code: string): Promise<Profile | null> {
        const res = await this.query<Profile>(
            `SELECT * FROM ${this.tableName} WHERE code = $1 AND organization_id = $2`,
            [code, organizationId]
        );
        return res.rows[0] || null;
    }

    async findAllByOrganization(organizationId: string): Promise<Profile[]> {
        const res = await this.query<Profile>(
            `SELECT * FROM ${this.tableName} WHERE organization_id = $1`,
            [organizationId]
        );
        return res.rows;
    }

    async findActiveByOrganization(organizationId: string): Promise<Profile[]> {
        const res = await this.query<Profile>(
            `SELECT * FROM ${this.tableName} WHERE is_active = true AND organization_id = $1`,
            [organizationId]
        );
        return res.rows;
    }

    async create(organizationId: string, data: Record<string, unknown>): Promise<Profile> {
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

        const res = await this.query<Profile>(query, [organizationId, ...values]);
        return res.rows[0]!;
    }

    async update(organizationId: string, id: string, data: Record<string, unknown>): Promise<Profile> {
        const keys = Object.keys(data);
        const values = Object.values(data);
        if (keys.length === 0) return this.findById(organizationId, id) as Promise<Profile>;

        const setClause = keys.map((key, i) => `${key} = $${i + 3}`).join(', ');

        // Note: profiles table does not have updated_at column per schema
        const query = `
            UPDATE ${this.tableName}
            SET ${setClause}
            WHERE id = $1 AND organization_id = $2
            RETURNING *
        `;

        const res = await this.query<Profile>(query, [id, organizationId, ...values]);
        if (res.rows.length === 0) throw new Error(`Profile ${id} not found for update`);
        return res.rows[0]!;
    }

    async delete(organizationId: string, id: string): Promise<void> {
        // Soft delete: Set is_active to false instead of physical deletion
        await this.query(
            `UPDATE ${this.tableName} SET is_active = false WHERE id = $1 AND organization_id = $2`,
            [id, organizationId]
        );
    }

    async getAssignedPermissionIds(organizationId: string, profileId: string): Promise<string[]> {
        const res = await this.query<{ permission_id: string }>(
            `SELECT permission_id FROM profile_permissions WHERE profile_id = $1 AND organization_id = $2`,
            [profileId, organizationId]
        );
        return res.rows.map(row => row.permission_id);
    }

}
