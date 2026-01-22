
import { Pool } from 'pg';
import { BaseRepository } from './base.repository';
import { UserRole } from '../models/user_role.model';

export interface IUserRoleRepository {
    findRolesByUser(organizationId: string, userId: string): Promise<UserRole[]>;
    findUsersByRole(organizationId: string, roleId: string): Promise<UserRole[]>;
    hasRole(organizationId: string, userId: string, roleId: string): Promise<boolean>;
    assign(organizationId: string, userId: string, roleId: string, assignedBy?: string): Promise<UserRole>;
    revoke(organizationId: string, userId: string, roleId: string): Promise<void>;
    revokeAllByUser(organizationId: string, userId: string): Promise<void>;
}

export class UserRoleRepository extends BaseRepository<UserRole> implements IUserRoleRepository {
    constructor(pool: InstanceType<typeof Pool>) {
        super(pool, 'user_roles');
    }

    async findRolesByUser(organizationId: string, userId: string): Promise<UserRole[]> {
        const res = await this.query(
            `SELECT * FROM ${this.tableName} WHERE user_id = $1 AND organization_id = $2 `,
            [userId, organizationId]
        );
        return res.rows;
    }

    async findUsersByRole(organizationId: string, roleId: string): Promise<UserRole[]> {
        const res = await this.query(
            `SELECT * FROM ${this.tableName} WHERE role_id = $1 AND organization_id = $2 `,
            [roleId, organizationId]
        );
        return res.rows;
    }

    async hasRole(organizationId: string, userId: string, roleId: string): Promise<boolean> {
        const res = await this.query(
            `SELECT 1 FROM ${this.tableName} WHERE user_id = $1 AND role_id = $2 AND organization_id = $3 `,
            [userId, roleId, organizationId]
        );
        return (res.rowCount || 0) > 0;
    }

    async assign(organizationId: string, userId: string, roleId: string, assignedBy?: string): Promise<UserRole> {
        // Upsert or Insert
        const query = `
            INSERT INTO ${this.tableName} (organization_id, user_id, role_id, assigned_by)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const res = await this.query(query, [organizationId, userId, roleId, assignedBy]);
        return res.rows[0]!;
    }

    async revoke(organizationId: string, userId: string, roleId: string): Promise<void> {
        await this.query(
            `DELETE FROM ${this.tableName}  WHERE user_id = $1 AND role_id = $2 AND organization_id = $3`,
            [userId, roleId, organizationId]
        );
    }

    async revokeAllByUser(organizationId: string, userId: string): Promise<void> {
        await this.query(
            `DELETE FROM ${this.tableName} WHERE user_id = $1 AND organization_id = $2`,
            [userId, organizationId]
        );
    }
}
