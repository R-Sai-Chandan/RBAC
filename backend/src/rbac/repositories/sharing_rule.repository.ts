
import { Pool } from 'pg';
import { BaseRepository } from './base.repository';
import { SharingRule } from '../models/sharing_rule.model';

export interface ISharingRuleRepository {
    create(organizationId: string, data: any): Promise<SharingRule>;
    update(organizationId: string, id: string, data: any): Promise<SharingRule>;
    delete(organizationId: string, id: string): Promise<void>;
    findById(organizationId: string, id: string): Promise<SharingRule | null>;
    findAllByOrganization(organizationId: string): Promise<SharingRule[]>;
    findActiveByOrganization(organizationId: string): Promise<SharingRule[]>;
    findByType(organizationId: string, type: string): Promise<SharingRule[]>;
    findByModule(organizationId: string, moduleId: string): Promise<SharingRule[]>;
}

export class SharingRuleRepository extends BaseRepository<SharingRule> implements ISharingRuleRepository {
    constructor(pool: InstanceType<typeof Pool>) {
        super(pool, 'sharing_rules');
    }

    async findAllByOrganization(organizationId: string): Promise<SharingRule[]> {
        return this.findAll(organizationId);
    }

    async findActiveByOrganization(organizationId: string): Promise<SharingRule[]> {
        const res = await this.query(
            `SELECT * FROM ${this.tableName} WHERE is_active = true AND organization_id = $1 AND deleted_at IS NULL`,
            [organizationId]
        );
        return res.rows;
    }

    async findByType(organizationId: string, type: string): Promise<SharingRule[]> {
        const res = await this.query(
            `SELECT * FROM ${this.tableName} WHERE rule_type = $1 AND organization_id = $2 AND deleted_at IS NULL`,
            [type, organizationId]
        );
        return res.rows;
    }

    async findByModule(organizationId: string, moduleId: string): Promise<SharingRule[]> {
        const res = await this.query(
            `SELECT * FROM ${this.tableName} WHERE module_id = $1 AND organization_id = $2 AND deleted_at IS NULL`,
            [moduleId, organizationId]
        );
        return res.rows;
    }
}
