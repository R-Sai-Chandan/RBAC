
import { Pool, QueryResultRow } from 'pg';
import { Role } from '../models/role.model';

export interface IRoleRepository {
    create(organizationId: string, data: any): Promise<Role>;
    update(organizationId: string, id: string, data: any): Promise<Role>;
    delete(organizationId: string, id: string): Promise<void>;
    findById(organizationId: string, id: string): Promise<Role | null>;
    findByCode(organizationId: string, code: string): Promise<Role | null>;
    findAllByOrganization(organizationId: string): Promise<Role[]>;
    findAncestors(organizationId: string, roleId: string): Promise<Role[]>;
    findChildRoles(organizationId: string, roleId: string): Promise<Role[]>;
}

export class RoleRepository implements IRoleRepository {
    private tableName = 'roles';

    constructor(private pool: InstanceType<typeof Pool>) { }

    protected async query<T extends QueryResultRow>(
        text: string,
        params?: unknown[]
    ): Promise<{ rows: T[], rowCount: number | null }> {
        return this.pool.query<T>(text, params);
    }

    async findById(organizationId: string, id: string): Promise<Role | null> {
        const res = await this.query<Role>(
            `SELECT * FROM ${this.tableName} WHERE id = $1 AND organization_id = $2`,
            [id, organizationId]
        );
        return res.rows[0] || null;
    }

    async findByCode(organizationId: string, code: string): Promise<Role | null> {
        const res = await this.query<Role>(
            `SELECT * FROM ${this.tableName} WHERE code = $1 AND organization_id = $2 `,
            [code, organizationId]
        );
        return res.rows[0] || null;
    }

    async findAllByOrganization(organizationId: string): Promise<Role[]> {
        const res = await this.query<Role>(
            `SELECT * FROM ${this.tableName} WHERE organization_id = $1`,
            [organizationId]
        );
        return res.rows;
    }

    async findChildRoles(organizationId: string, roleId: string): Promise<Role[]> {
        const res = await this.query<Role>(
            `SELECT * FROM ${this.tableName} WHERE parent_role_id = $1 AND organization_id = $2 `,
            [roleId, organizationId]
        );
        return res.rows;
    }

    async findAncestors(organizationId: string, roleId: string): Promise<Role[]> {
        // Recursive CTE to find all ancestors
        const query = `
            WITH RECURSIVE ancestors AS (
                SELECT * FROM ${this.tableName} WHERE id = $1 AND organization_id = $2 
                UNION
                SELECT r.* FROM ${this.tableName} r
                INNER JOIN ancestors a ON a.parent_role_id = r.id
                WHERE r.organization_id = $2
            )
            SELECT * FROM ancestors WHERE id != $1;
        `;
        const res = await this.query<Role>(query, [roleId, organizationId]);
        return res.rows;
    }

    async create(organizationId: string, data: Record<string, unknown>): Promise<Role> {
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

        const res = await this.query<Role>(query, [organizationId, ...values]);
        return res.rows[0]!;
    }

    async update(organizationId: string, id: string, data: Record<string, unknown>): Promise<Role> {
        const keys = Object.keys(data);
        const values = Object.values(data);
        if (keys.length === 0) return this.findById(organizationId, id) as Promise<Role>;

        const setClause = keys.map((key, i) => `${key} = $${i + 3}`).join(', ');

        // Note: roles table does not have updated_at column per schema
        const query = `
            UPDATE ${this.tableName}
            SET ${setClause}
            WHERE id = $1 AND organization_id = $2
            RETURNING *
        `;

        const res = await this.query<Role>(query, [id, organizationId, ...values]);
        if (res.rows.length === 0) throw new Error(`Role ${id} not found for update`);
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
