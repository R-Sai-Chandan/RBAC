
import { Pool } from 'pg';
import { BaseRepository } from './base.repository';
import { Module } from '../models/module.model';

export interface IModuleRepository {
    findAll(filters?: any): Promise<Module[]>;
    findByCode(organizationId: string, code: string): Promise<Module | null>;
    findById(organizationId: string, id: string): Promise<Module | null>; // Exposed from Base
}

export class ModuleRepository extends BaseRepository<Module> implements IModuleRepository {
    constructor(pool: InstanceType<typeof Pool>) {
        super(pool, 'modules');
    }

    async findByCode(organizationId: string, code: string): Promise<Module | null> {
        // Even if modules are global, we might validate org or just ignore it.
        // For consistency with BaseRepository and Service layer, we accept it.
        // Assuming modules are global system metadata:
        const res = await this.query(
            `SELECT * FROM ${this.tableName} WHERE code = $1 AND deleted_at IS NULL`,
            [code]
        );
        return res.rows[0] || null;
    }

    // Override to ignore orgId if modules are global, or just use Base implementation if mixed.
    async findAll(filters?: any): Promise<Module[]> {
        const res = await this.query(
            `SELECT * FROM ${this.tableName} WHERE deleted_at IS NULL`
        );
        return res.rows;
    }
}
