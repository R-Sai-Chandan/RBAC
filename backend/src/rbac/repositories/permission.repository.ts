
import { Pool, QueryResultRow } from 'pg';
import { Permission, PermissionAction } from '../models/permission.model';

export interface IPermissionRepository {
    findAllByOrganization(organizationId: string): Promise<Permission[]>;
    create(organizationId: string, data: any): Promise<Permission>;
    update(organizationId: string, id: string, data: any): Promise<Permission>;
    delete(organizationId: string, id: string): Promise<void>;
    findById(organizationId: string, id: string): Promise<Permission | null>;
    findByModuleAndAction(organizationId: string, moduleId: string, action: PermissionAction): Promise<Permission | null>;
}

export class PermissionRepository implements IPermissionRepository {
    private tableName = 'permissions';

    constructor(private pool: InstanceType<typeof Pool>) { }

    protected async query<T extends QueryResultRow>(
        text: string,
        params?: unknown[]
    ): Promise<{ rows: T[], rowCount: number | null }> {
        return this.pool.query<T>(text, params);
    }

    async findById(organizationId: string, id: string): Promise<Permission | null> {
        const res = await this.query<Permission>(
            `SELECT * FROM ${this.tableName} WHERE id = $1 AND organization_id = $2`,
            [id, organizationId]
        );
        return res.rows[0] || null;
    }

    async findAllByOrganization(organizationId: string): Promise<Permission[]> {
        const res = await this.query<Permission>(
            `SELECT * FROM ${this.tableName} WHERE organization_id = $1`,
            [organizationId]
        );
        return res.rows;
    }

    async findByModuleAndAction(organizationId: string, moduleId: string, action: PermissionAction): Promise<Permission | null> {
        const res = await this.query<Permission>(
            `SELECT * FROM ${this.tableName} WHERE module_id = $1 AND action = $2 AND organization_id = $3 `,
            [moduleId, action, organizationId]
        );
        return res.rows[0] || null;
    }

    async create(organizationId: string, data: Record<string, unknown>): Promise<Permission> {
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

        const res = await this.query<Permission>(query, [organizationId, ...values]);
        return res.rows[0]!;
    }

    async update(organizationId: string, id: string, data: Record<string, unknown>): Promise<Permission> {
        const keys = Object.keys(data);
        const values = Object.values(data);
        if (keys.length === 0) return this.findById(organizationId, id) as Promise<Permission>;

        const setClause = keys.map((key, i) => `${key} = $${i + 3}`).join(', ');

        // Note: permissions table does not have updated_at column per schema
        const query = `
            UPDATE ${this.tableName}
            SET ${setClause}
            WHERE id = $1 AND organization_id = $2
            RETURNING *
        `;

        const res = await this.query<Permission>(query, [id, organizationId, ...values]);
        if (res.rows.length === 0) throw new Error(`Permission ${id} not found for update`);
        return res.rows[0]!;
    }

    async delete(organizationId: string, id: string): Promise<void> {
        await this.query(
            `DELETE FROM ${this.tableName} WHERE id = $1 AND organization_id = $2`,
            [id, organizationId]
        );
    }
}
