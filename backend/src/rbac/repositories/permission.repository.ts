
import { Pool } from 'pg';
import { BaseRepository } from './base.repository';
import { Permission, PermissionAction } from '../models/permission.model';

export interface IPermissionRepository {
    findAllByOrganization(organizationId: string): Promise<Permission[]>;
    create(organizationId: string, data: any): Promise<Permission>;
    update(organizationId: string, id: string, data: any): Promise<Permission>;
    delete(organizationId: string, id: string): Promise<void>;
    findById(organizationId: string, id: string): Promise<Permission | null>;
    findByModuleAndAction(organizationId: string, moduleId: string, action: PermissionAction): Promise<Permission | null>;
}

export class PermissionRepository extends BaseRepository<Permission> implements IPermissionRepository {
    constructor(pool: InstanceType<typeof Pool>) {
        super(pool, 'permissions');
    }

    async findAllByOrganization(organizationId: string): Promise<Permission[]> {
        return this.findAll(organizationId);
    }

    async findByModuleAndAction(organizationId: string, moduleId: string, action: PermissionAction): Promise<Permission | null> {
        const res = await this.query(
            `SELECT * FROM ${this.tableName} WHERE module_id = $1 AND action = $2 AND organization_id = $3 AND deleted_at IS NULL`,
            [moduleId, action, organizationId]
        );
        return res.rows[0] || null;
    }
}
