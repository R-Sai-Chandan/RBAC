
import { Pool } from 'pg';
import { BaseRepository } from './base.repository';
import { Profile } from '../models/profile.model';

export interface IProfileRepository {
    create(organizationId: string, data: any): Promise<Profile>;
    update(organizationId: string, id: string, data: any): Promise<Profile>;
    delete(organizationId: string, id: string): Promise<void>;
    findById(organizationId: string, id: string): Promise<Profile | null>;
    findByCode(organizationId: string, code: string): Promise<Profile | null>;
    findAllByOrganization(organizationId: string): Promise<Profile[]>;
    findActiveByOrganization(organizationId: string): Promise<Profile[]>;
}

export class ProfileRepository extends BaseRepository<Profile> implements IProfileRepository {
    constructor(pool: InstanceType<typeof Pool>) {
        super(pool, 'profiles');
    }

    async findByCode(organizationId: string, code: string): Promise<Profile | null> {
        const res = await this.query(
            `SELECT * FROM ${this.tableName} WHERE code = $1 AND organization_id = $2`,
            [code, organizationId]
        );
        return res.rows[0] || null;
    }

    async findAllByOrganization(organizationId: string): Promise<Profile[]> {
        return this.findAll(organizationId);
    }

    async findActiveByOrganization(organizationId: string): Promise<Profile[]> {
        const res = await this.query(
            `SELECT * FROM ${this.tableName} WHERE is_active = true AND organization_id = $1`,
            [organizationId]
        );
        return res.rows;
    }
}
