
import { Pool } from 'pg';
import { BaseRepository } from './base.repository';
import { RoleProfile } from '../models/role_profile.model';

export interface IRoleProfileRepository {
    findProfilesByRole(organizationId: string, roleId: string): Promise<RoleProfile[]>;
    findRolesByProfile(organizationId: string, profileId: string): Promise<RoleProfile[]>;
    hasProfile(organizationId: string, roleId: string, profileId: string): Promise<boolean>;
    assign(organizationId: string, roleId: string, profileId: string, assignedBy?: string): Promise<RoleProfile>;
    revoke(organizationId: string, roleId: string, profileId: string): Promise<void>;
    revokeAllByRole(organizationId: string, roleId: string): Promise<void>;
}

export class RoleProfileRepository extends BaseRepository<RoleProfile> implements IRoleProfileRepository {
    constructor(pool: InstanceType<typeof Pool>) {
        super(pool, 'role_profiles');
    }

    async findProfilesByRole(organizationId: string, roleId: string): Promise<RoleProfile[]> {
        const res = await this.query(
            `SELECT * FROM ${this.tableName} WHERE role_id = $1 AND organization_id = $2`,
            [roleId, organizationId]
        );
        return res.rows;
    }

    async findRolesByProfile(organizationId: string, profileId: string): Promise<RoleProfile[]> {
        const res = await this.query(
            `SELECT * FROM ${this.tableName} WHERE profile_id = $1 AND organization_id = $2 `,
            [profileId, organizationId]
        );
        return res.rows;
    }

    async hasProfile(organizationId: string, roleId: string, profileId: string): Promise<boolean> {
        const res = await this.query(
            `SELECT 1 FROM ${this.tableName} WHERE role_id = $1 AND profile_id = $2 AND organization_id = $3`,
            [roleId, profileId, organizationId]
        );
        return (res.rowCount || 0) > 0;
    }

    async assign(organizationId: string, roleId: string, profileId: string, assignedBy?: string): Promise<RoleProfile> {
        const query = `
            INSERT INTO ${this.tableName} (organization_id, role_id, profile_id, assigned_by)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const res = await this.query(query, [organizationId, roleId, profileId, assignedBy]);
        return res.rows[0]!;
    }

    async revoke(organizationId: string, roleId: string, profileId: string): Promise<void> {
        await this.query(
            `DELETE FROM ${this.tableName}  WHERE role_id = $1 AND profile_id = $2 AND organization_id = $3`,
            [roleId, profileId, organizationId]
        );
    }

    async revokeAllByRole(organizationId: string, roleId: string): Promise<void> {
        await this.query(
            `DELETE FROM ${this.tableName} WHERE role_id = $1 AND organization_id = $2`,
            [roleId, organizationId]
        );
    }
}
