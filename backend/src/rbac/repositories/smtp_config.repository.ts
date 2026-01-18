
import { Pool } from 'pg';
import { BaseRepository } from './base.repository';
import { SmtpConfig } from '../models/smtp_config.model';

export interface ISmtpConfigRepository {
    create(organizationId: string, data: any): Promise<SmtpConfig>;
    update(organizationId: string, id: string, data: any): Promise<SmtpConfig>;
    delete(organizationId: string, id: string): Promise<void>;
    findById(organizationId: string, id: string): Promise<SmtpConfig | null>;
    findAllByOrganization(organizationId: string): Promise<SmtpConfig[]>;
    findActiveByOrganization(organizationId: string): Promise<SmtpConfig | null>; // Assuming single active
}

export class SmtpConfigRepository extends BaseRepository<SmtpConfig> implements ISmtpConfigRepository {
    constructor(pool: InstanceType<typeof Pool>) {
        super(pool, 'smtp_configs');
    }

    async findAllByOrganization(organizationId: string): Promise<SmtpConfig[]> {
        return this.findAll(organizationId);
    }

    async findActiveByOrganization(organizationId: string): Promise<SmtpConfig | null> {
        const res = await this.query(
            `SELECT * FROM ${this.tableName} WHERE is_active = true AND organization_id = $1 AND deleted_at IS NULL`,
            [organizationId]
        );
        return res.rows[0] || null;
    }
}
