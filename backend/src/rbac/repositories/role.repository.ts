
import { Pool } from 'pg';
import { BaseRepository } from './base.repository';
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

export class RoleRepository extends BaseRepository<Role> implements IRoleRepository {
    constructor(pool: Pool) {
        super(pool, 'roles');
    }

    async findByCode(organizationId: string, code: string): Promise<Role | null> {
        const res = await this.query(
            `SELECT * FROM ${this.tableName} WHERE code = $1 AND organization_id = $2 AND deleted_at IS NULL`,
            [code, organizationId]
        );
        return res.rows[0] || null;
    }

    async findAllByOrganization(organizationId: string): Promise<Role[]> {
        return this.findAll(organizationId);
    }

    async findChildRoles(organizationId: string, roleId: string): Promise<Role[]> {
        const res = await this.query(
            `SELECT * FROM ${this.tableName} WHERE parent_role_id = $1 AND organization_id = $2 AND deleted_at IS NULL`,
            [roleId, organizationId]
        );
        return res.rows;
    }

    async findAncestors(organizationId: string, roleId: string): Promise<Role[]> {
        // Recursive CTE to find all ancestors
        const query = `
            WITH RECURSIVE ancestors AS (
                SELECT * FROM ${this.tableName} WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL
                UNION
                SELECT r.* FROM ${this.tableName} r
                INNER JOIN ancestors a ON a.parent_role_id = r.id
                WHERE r.organization_id = $2 AND r.deleted_at IS NULL
            )
            SELECT * FROM ancestors WHERE id != $1;
        `;
        const res = await this.query(query, [roleId, organizationId]);
        return res.rows;
    }
}
