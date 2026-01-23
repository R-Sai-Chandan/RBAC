
import { Pool, QueryResultRow } from 'pg';
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

export class AuditLogRepository implements IAuditLogRepository {
    private tableName = 'audit_logs';

    constructor(private pool: InstanceType<typeof Pool>) { }

    protected async query<T extends QueryResultRow>(
        text: string,
        params?: unknown[]
    ): Promise<{ rows: T[], rowCount: number | null }> {
        return this.pool.query<T>(text, params);
    }

    async findById(organizationId: string, id: string): Promise<AuditLog | null> {
        const res = await this.query<AuditLog>(
            `SELECT * FROM ${this.tableName} WHERE id = $1 AND organization_id = $2`,
            [id, organizationId]
        );
        return res.rows[0] || null;
    }

    async findByUser(organizationId: string, userId: string, limit: number = 50, offset: number = 0): Promise<AuditLog[]> {
        const query = `
            SELECT * FROM ${this.tableName} 
            WHERE user_id = $1 AND organization_id = $2
            ORDER BY created_at DESC
            LIMIT $3 OFFSET $4
        `;
        const res = await this.query<AuditLog>(query, [userId, organizationId, limit, offset]);
        return res.rows;
    }

    async findByEntity(organizationId: string, entityType: string, entityId: string, limit: number = 50, offset: number = 0): Promise<AuditLog[]> {
        const query = `
            SELECT * FROM ${this.tableName} 
            WHERE entity_type = $1 AND entity_id = $2 AND organization_id = $3
            ORDER BY created_at DESC
            LIMIT $4 OFFSET $5
        `;
        const res = await this.query<AuditLog>(query, [entityType, entityId, organizationId, limit, offset]);
        return res.rows;
    }

    async findByAction(organizationId: string, action: AuditAction, limit: number = 50, offset: number = 0): Promise<AuditLog[]> {
        const query = `
            SELECT * FROM ${this.tableName} 
            WHERE action = $1 AND organization_id = $2
            ORDER BY created_at DESC
            LIMIT $3 OFFSET $4
        `;
        const res = await this.query<AuditLog>(query, [action, organizationId, limit, offset]);
        return res.rows;
    }

    async findAllByOrganization(organizationId: string, limit: number = 50, offset: number = 0): Promise<AuditLog[]> {
        const query = `
            SELECT * FROM ${this.tableName} 
            WHERE organization_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `;
        const res = await this.query<AuditLog>(query, [organizationId, limit, offset]);
        return res.rows;
    }

    async findByDateRange(organizationId: string, startDate: Date, endDate: Date, limit: number = 50, offset: number = 0): Promise<AuditLog[]> {
        const query = `
            SELECT * FROM ${this.tableName} 
            WHERE organization_id = $1 AND created_at BETWEEN $2 AND $3
            ORDER BY created_at DESC
            LIMIT $4 OFFSET $5
        `;
        const res = await this.query<AuditLog>(query, [organizationId, startDate, endDate, limit, offset]);
        return res.rows;
    }

    async create(organizationId: string, entry: Partial<AuditLog>): Promise<AuditLog> {
        const { organization_id, ...cleanData } = entry as any;

        const keys = Object.keys(cleanData);
        const values = Object.values(cleanData);
        const indices = keys.map((_, i) => `$${i + 2}`).join(', ');
        const columns = keys.join(', ');

        const query = `
            INSERT INTO ${this.tableName} (organization_id, ${columns})
            VALUES ($1, ${indices})
            RETURNING *
        `;

        const res = await this.query<AuditLog>(query, [organizationId, ...values]);
        return res.rows[0]!;
    }
}
