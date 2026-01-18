
import { Pool } from 'pg';
import { BaseRepository } from './base.repository';
import { Group } from '../models/group.model';

export interface IGroupRepository {
    create(organizationId: string, data: any): Promise<Group>;
    update(organizationId: string, id: string, data: any): Promise<Group>;
    delete(organizationId: string, id: string): Promise<void>;
    findById(organizationId: string, id: string): Promise<Group | null>;
    findAllByOrganization(organizationId: string): Promise<Group[]>; // Added
    findActiveByOrganization(organizationId: string): Promise<Group[]>; // Added
    findByName(organizationId: string, name: string): Promise<Group | null>; // Added
}

export class GroupRepository extends BaseRepository<Group> implements IGroupRepository {
    constructor(pool: Pool) {
        super(pool, 'groups');
    }

    async findAllByOrganization(organizationId: string): Promise<Group[]> {
        return this.findAll(organizationId);
    }

    async findActiveByOrganization(organizationId: string): Promise<Group[]> {
        const res = await this.query(
            `SELECT * FROM ${this.tableName} WHERE is_active = true AND organization_id = $1 AND deleted_at IS NULL`,
            [organizationId]
        );
        return res.rows;
    }

    async findByName(organizationId: string, name: string): Promise<Group | null> {
        const res = await this.query(
            `SELECT * FROM ${this.tableName} WHERE name = $1 AND organization_id = $2 AND deleted_at IS NULL`,
            [name, organizationId]
        );
        return res.rows[0] || null;
    }
}
