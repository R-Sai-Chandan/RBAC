
import { Pool } from 'pg';
import { BaseRepository } from './base.repository';
import { Module } from '../models/module.model';

export interface IModuleRepository {
    findAll(organizationId: string, filters?: any): Promise<Module[]>;
    findByCode(organizationId: string, code: string): Promise<Module | null>;
    findById(organizationId: string, id: string): Promise<Module | null>;
    create(organizationId: string, data: Partial<Module>): Promise<Module>;
}

export class ModuleRepository extends BaseRepository<Module> implements IModuleRepository {
    constructor(pool: InstanceType<typeof Pool>) {
        super(pool, 'modules');
    }

    async findByCode(organizationId: string, code: string): Promise<Module | null> {
        const res = await this.query(
            `SELECT * FROM ${this.tableName} WHERE code = $1 AND organization_id = $2 AND deleted_at IS NULL`,
            [code, organizationId]
        );
        return res.rows[0] || null;
    }

    async findAll(organizationId: string, filters?: any): Promise<Module[]> {
        // Use BaseRepository implementation or custom query
        // BaseRepository.findAll(orgId) matches signature mostly
        return super.findAll(organizationId, filters);
    }
}
