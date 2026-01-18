
import { Pool } from 'pg';
import { BaseRepository } from './base.repository';
import { AuditLog, AuditAction, AuditStatus } from '../models/audit_log.model';

export interface IAuditLogRepository {
    create(organizationId: string, entry: Partial<AuditLog>): Promise<AuditLog>;
    findById(organizationId: string, id: string): Promise<AuditLog | null>;
    findByUser(organizationId: string, userId: string, limit?: number, offset?: number): Promise<AuditLog[]>;
    findByEntity(organizationId: string, entityType: string, entityId: string, limit?: number, offset?: number): Promise<AuditLog[]>;
    findByAction(organizationId: string, action: AuditAction, limit?: number, offset?: number): Promise<AuditLog[]>;
    findByDateRange(organizationId: string, startDate: Date, endDate: Date, limit?: number, offset?: number): Promise<AuditLog[]>;
    findAllByOrganization(organizationId: string, limit?: number, offset?: number): Promise<AuditLog[]>;
}

export class AuditLogRepository extends BaseRepository<AuditLog> implements IAuditLogRepository {
    constructor(pool: Pool) {
        super(pool, 'audit_logs');
    }

    async findByUser(organizationId: string, userId: string, limit: number = 50, offset: number = 0): Promise<AuditLog[]> {
        const query = `
            SELECT * FROM ${this.tableName} 
            WHERE user_id = $1 AND organization_id = $2
            ORDER BY created_at DESC
            LIMIT $3 OFFSET $4
        `;
        const res = await this.query(query, [userId, organizationId, limit, offset]);
        return res.rows;
    }

    async findByEntity(organizationId: string, entityType: string, entityId: string, limit: number = 50, offset: number = 0): Promise<AuditLog[]> {
        const query = `
            SELECT * FROM ${this.tableName} 
            WHERE entity_type = $1 AND entity_id = $2 AND organization_id = $3
            ORDER BY created_at DESC
            LIMIT $4 OFFSET $5
        `;
        const res = await this.query(query, [entityType, entityId, organizationId, limit, offset]);
        return res.rows;
    }

    async findByAction(organizationId: string, action: AuditAction, limit: number = 50, offset: number = 0): Promise<AuditLog[]> {
        const query = `
            SELECT * FROM ${this.tableName} 
            WHERE action = $1 AND organization_id = $2
            ORDER BY created_at DESC
            LIMIT $3 OFFSET $4
        `;
        const res = await this.query(query, [action, organizationId, limit, offset]);
        return res.rows;
    }

    async findAllByOrganization(organizationId: string, limit: number = 50, offset: number = 0): Promise<AuditLog[]> {
        const query = `
            SELECT * FROM ${this.tableName} 
            WHERE organization_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `;
        const res = await this.query(query, [organizationId, limit, offset]);
        return res.rows;
    }

    async findByDateRange(organizationId: string, startDate: Date, endDate: Date, limit: number = 50, offset: number = 0): Promise<AuditLog[]> {
        const query = `
            SELECT * FROM ${this.tableName} 
            WHERE organization_id = $1 AND created_at BETWEEN $2 AND $3
            ORDER BY created_at DESC
            LIMIT $4 OFFSET $5
        `;
        const res = await this.query(query, [organizationId, startDate, endDate, limit, offset]);
        return res.rows;
    }
}
