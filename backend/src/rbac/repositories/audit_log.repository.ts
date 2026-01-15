/**
 * AuditLogRepository
 * 
 * Data access layer for AuditLog entities.
 * All operations scoped to organizationId for multi-tenant isolation.
 * Audit logs are append-only (no updates or deletes).
 */

import { AuditLog, AuditAction, AuditStatus } from '../models/audit_log.model';

export interface IAuditLogRepository {
    /**
     * Find audit log by ID within organization
     * @throws AuditLogNotFoundError
     */
    findById(organizationId: string, logId: string): Promise<AuditLog | null>;

    /**
     * Find all audit logs for organization
     */
    findAllByOrganization(organizationId: string, limit?: number, offset?: number): Promise<AuditLog[]>;

    /**
     * Find audit logs by user
     */
    findByUser(organizationId: string, userId: string, limit?: number, offset?: number): Promise<AuditLog[]>;

    /**
     * Find audit logs by entity
     */
    findByEntity(organizationId: string, entityType: string, entityId: string, limit?: number, offset?: number): Promise<AuditLog[]>;

    /**
     * Find audit logs by action
     */
    findByAction(organizationId: string, action: AuditAction, limit?: number, offset?: number): Promise<AuditLog[]>;

    /**
     * Find audit logs by date range
     */
    findByDateRange(organizationId: string, startDate: Date, endDate: Date, limit?: number, offset?: number): Promise<AuditLog[]>;

    /**
     * Create a new audit log entry
     * @throws AuditLogCreationError
     */
    create(organizationId: string, data: Omit<AuditLog, 'id' | 'organization_id' | 'created_at'>): Promise<AuditLog>;
}
