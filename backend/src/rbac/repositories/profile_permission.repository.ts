
import { Pool } from 'pg';
import { BaseRepository } from './base.repository';
import { ProfilePermission, ProfilePermissionEffect } from '../models/profile_permission.model';

export interface IProfilePermissionRepository {
    findPermissionsByProfile(organizationId: string, profileId: string): Promise<ProfilePermission[]>;
    findProfilesByPermission(organizationId: string, permissionId: string): Promise<ProfilePermission[]>;
    findAssignment(organizationId: string, profileId: string, permissionId: string): Promise<ProfilePermission | null>;
    assign(organizationId: string, profileId: string, permissionId: string, effect: ProfilePermissionEffect): Promise<ProfilePermission>;
    updateEffect(organizationId: string, profileId: string, permissionId: string, effect: ProfilePermissionEffect): Promise<ProfilePermission>;
    revoke(organizationId: string, profileId: string, permissionId: string): Promise<void>;
    revokeAllByProfile(organizationId: string, profileId: string): Promise<void>;
}

export class ProfilePermissionRepository extends BaseRepository<ProfilePermission> implements IProfilePermissionRepository {
    constructor(pool: InstanceType<typeof Pool>) {
        super(pool, 'profile_permissions');
    }

    async findPermissionsByProfile(organizationId: string, profileId: string): Promise<ProfilePermission[]> {
        const res = await this.query(
            `SELECT * FROM ${this.tableName} WHERE profile_id = $1 AND organization_id = $2 `,
            [profileId, organizationId]
        );
        return res.rows;
    }

    async findProfilesByPermission(organizationId: string, permissionId: string): Promise<ProfilePermission[]> {
        const res = await this.query(
            `SELECT * FROM ${this.tableName} WHERE permission_id = $1 AND organization_id = $2`,
            [permissionId, organizationId]
        );
        return res.rows;
    }

    async findAssignment(organizationId: string, profileId: string, permissionId: string): Promise<ProfilePermission | null> {
        const res = await this.query(
            `SELECT * FROM ${this.tableName} WHERE profile_id = $1 AND permission_id = $2 AND organization_id = $3 `,
            [profileId, permissionId, organizationId]
        );
        return res.rows[0] || null;
    }

    async assign(organizationId: string, profileId: string, permissionId: string, effect: ProfilePermissionEffect): Promise<ProfilePermission> {
        const query = `
            INSERT INTO ${this.tableName} (organization_id, profile_id, permission_id, effect)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const res = await this.query(query, [organizationId, profileId, permissionId, effect]);
        return res.rows[0]!;
    }

    async updateEffect(organizationId: string, profileId: string, permissionId: string, effect: ProfilePermissionEffect): Promise<ProfilePermission> {
        const query = `
            UPDATE ${this.tableName}
            SET effect = $4, updated_at = NOW()
            WHERE profile_id = $1 AND permission_id = $2 AND organization_id = $3
            RETURNING *
        `;
        const res = await this.query(query, [profileId, permissionId, organizationId, effect]);
        if (!res.rows.length) throw new Error('Assignment not found');
        return res.rows[0]!;
    }

    async revoke(organizationId: string, profileId: string, permissionId: string): Promise<void> {
        await this.query(
            `DELETE FROM ${this.tableName} WHERE profile_id = $1 AND permission_id = $2 AND organization_id = $3`,
            [profileId, permissionId, organizationId]
        );
    }

    async revokeAllByProfile(organizationId: string, profileId: string): Promise<void> {
        await this.query(
            `DELETE FROM ${this.tableName} WHERE profile_id = $1 AND organization_id = $2`,
            [profileId, organizationId]
        );
    }
}
