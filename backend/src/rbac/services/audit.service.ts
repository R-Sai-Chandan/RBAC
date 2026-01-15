/**
 * AuditService
 * 
 * Business logic for audit logging.
 * NO permission evaluation logic here.
 */

import { AuditLog, AuditAction, AuditStatus } from '../models/audit_log.model';
import { IAuditLogRepository } from '../repositories/audit_log.repository';
import { RBACInternalError } from '../errors/rbac.errors';

export interface IAuditService {
    /**
     * Log an action
     * 
     * CRITICAL: This should be called for all permission-sensitive operations.
     * Audit logs are append-only.
     */
    log(
        organizationId: string,
        data: {
            user_id?: string;
            role_id?: string;
            action: AuditAction;
            module_id?: string;
            entity_type?: string;
            entity_id?: string;
            old_values?: Record<string, any> | null;
            new_values?: Record<string, any>;
            ip_address?: string | undefined;
            user_agent?: string | undefined;
            status: AuditStatus;
        }
    ): Promise<AuditLog>;

    /**
     * Get audit log by ID
     * @throws AuditLogNotFoundError
     */
    getById(organizationId: string, logId: string): Promise<AuditLog>;

    /**
     * Query audit logs by user
     */
    getByUser(
        organizationId: string,
        userId: string,
        limit?: number,
        offset?: number
    ): Promise<AuditLog[]>;

    /**
     * Query audit logs by entity
     */
    getByEntity(
        organizationId: string,
        entityType: string,
        entityId: string,
        limit?: number,
        offset?: number
    ): Promise<AuditLog[]>;

    /**
     * Query audit logs by action
     */
    getByAction(
        organizationId: string,
        action: AuditAction,
        limit?: number,
        offset?: number
    ): Promise<AuditLog[]>;

    /**
     * Query audit logs by date range
     */
    getByDateRange(
        organizationId: string,
        startDate: Date,
        endDate: Date,
        limit?: number,
        offset?: number
    ): Promise<AuditLog[]>;

    /**
     * Query all audit logs for organization
     */
    getAll(
        organizationId: string,
        limit?: number,
        offset?: number
    ): Promise<AuditLog[]>;
}

/**
 * AuditService Implementation
 * 
 * CRITICAL: Audit logging must NEVER block primary operations.
 * Failures are logged internally but do not propagate.
 */
export class AuditService implements IAuditService {
    constructor(private readonly auditLogRepository: IAuditLogRepository) { }

    async log(
        organizationId: string,
        data: {
            user_id?: string;
            role_id?: string;
            action: AuditAction;
            module_id?: string;
            entity_type?: string;
            entity_id?: string;
            old_values?: Record<string, any>;
            new_values?: Record<string, any>;
            ip_address?: string;
            user_agent?: string;
            status: AuditStatus;
        }
    ): Promise<AuditLog> {
        try {
            // TODO_TEST: Verify audit log creation
            return await this.auditLogRepository.create(organizationId, data);
        } catch (error) {
            // CRITICAL: Never fail primary operation due to audit failure
            console.error('Audit logging failed:', error);
            throw new RBACInternalError('Audit log creation failed', error as Error);
        }
    }

    async getById(organizationId: string, logId: string): Promise<AuditLog> {
        // TODO_TEST: Verify audit log retrieval
        const log = await this.auditLogRepository.findById(organizationId, logId);
        if (!log) {
            throw new RBACInternalError(`Audit log not found: ${logId}`);
        }
        return log;
    }

    async getByUser(
        organizationId: string,
        userId: string,
        limit?: number,
        offset?: number
    ): Promise<AuditLog[]> {
        // TODO_TEST: Verify user audit log query
        return await this.auditLogRepository.findByUser(organizationId, userId, limit, offset);
    }

    async getByEntity(
        organizationId: string,
        entityType: string,
        entityId: string,
        limit?: number,
        offset?: number
    ): Promise<AuditLog[]> {
        // TODO_TEST: Verify entity audit log query
        return await this.auditLogRepository.findByEntity(organizationId, entityType, entityId, limit, offset);
    }

    async getByAction(
        organizationId: string,
        action: AuditAction,
        limit?: number,
        offset?: number
    ): Promise<AuditLog[]> {
        // TODO_TEST: Verify action audit log query
        return await this.auditLogRepository.findByAction(organizationId, action, limit, offset);
    }

    async getByDateRange(
        organizationId: string,
        startDate: Date,
        endDate: Date,
        limit?: number,
        offset?: number
    ): Promise<AuditLog[]> {
        // TODO_TEST: Verify date range audit log query
        return await this.auditLogRepository.findByDateRange(organizationId, startDate, endDate, limit, offset);
    }

    async getAll(
        organizationId: string,
        limit?: number,
        offset?: number
    ): Promise<AuditLog[]> {
        // TODO_TEST: Verify organization audit log query
        return await this.auditLogRepository.findAllByOrganization(organizationId, limit, offset);
    }
}
