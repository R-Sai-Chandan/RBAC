/**
 * Audit Logs Routes
 * 
 * HTTP endpoints for viewing audit logs.
 * Authorization: SETTINGS:view_audit permission required.
 */

import { Router, Request, Response } from 'express';
import { IAuditService } from '../services/audit.service';
import { IEvaluationService } from '../services/evaluation.service';
import { requirePermission } from '../middleware/requirePermission.middleware';
import { AuditAction } from '../models/audit_log.model';
import { getRequiredParam } from './_paramUtils';

export function createAuditLogsRouter(
    auditService: IAuditService,
    evaluationService: IEvaluationService
): Router {
    const router = Router();

    // Helper to validate and convert action string to AuditAction enum
    function toAuditAction(action: string): AuditAction | null {
        const normalized = action.toLowerCase();
        if (normalized === 'create') return AuditAction.CREATE;
        if (normalized === 'update') return AuditAction.UPDATE;
        //if (normalized === 'delete') return AuditAction.DELETE;
        return null;
    }

    // GET /audit-logs -> READ
    router.get('/', requirePermission('AUDIT', 'read', evaluationService, auditService), async (req: Request, res: Response) => {
        try {
            // Context guaranteed by authenticate middleware
            const { organizationId } = req.user!;

            const { limit = '50', offset = '0', action, entityType, userId, startDate, endDate } = req.query;

            let logs;

            if (action) {
                const auditAction = toAuditAction(action as string);
                if (!auditAction) {
                    res.status(400).json({ error: 'Bad Request', message: 'Invalid action. Must be create, update' });
                    return;
                }
                logs = await auditService.getByAction(
                    organizationId,
                    auditAction,
                    parseInt(limit as string, 10),
                    parseInt(offset as string, 10)
                );
            } else if (userId) {
                logs = await auditService.getByUser(
                    organizationId,
                    userId as string,
                    parseInt(limit as string, 10),
                    parseInt(offset as string, 10)
                );
            } else if (entityType && req.query.entityId) {
                logs = await auditService.getByEntity(
                    organizationId,
                    entityType as string,
                    req.query.entityId as string,
                    parseInt(limit as string, 10),
                    parseInt(offset as string, 10)
                );
            } else if (startDate && endDate) {
                logs = await auditService.getByDateRange(
                    organizationId,
                    new Date(startDate as string),
                    new Date(endDate as string),
                    parseInt(limit as string, 10),
                    parseInt(offset as string, 10)
                );
            } else {
                // Default: get recent logs
                logs = await auditService.getByDateRange(
                    organizationId,
                    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                    new Date(),
                    parseInt(limit as string, 10),
                    parseInt(offset as string, 10)
                );
            }

            res.json({ data: logs });
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // GET /audit-logs/export - Export audit logs (CSV format) -> EXPORT
    // NOTE: Must be defined BEFORE /:id to avoid route conflict
    router.get('/export', requirePermission('AUDIT', 'export', evaluationService, auditService), async (req: Request, res: Response) => {
        try {
            // Context guaranteed by authenticate middleware
            const { organizationId } = req.user!;

            const { startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const end = endDate ? new Date(endDate as string) : new Date();

            const logs = await auditService.getByDateRange(
                organizationId,
                start,
                end,
                10000, // Max export limit
                0
            );

            // Generate CSV
            const headers = ['timestamp', 'action', 'user_id', 'entity_type', 'entity_id', 'status', 'ip_address'];
            const csv = [
                headers.join(','),
                ...logs.map(log => [
                    log.created_at,
                    log.action,
                    log.user_id || '',
                    log.entity_type || '',
                    log.entity_id || '',
                    log.status,
                    log.ip_address || ''
                ].join(','))
            ].join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}.csv`);
            res.send(csv);
        } catch (error) {
            console.error('Error exporting audit logs:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // GET /audit-logs/:id -> READ
    router.get('/:id', requirePermission('AUDIT', 'read', evaluationService, auditService), async (req: Request, res: Response) => {
        try {
            // Context guaranteed by authenticate middleware
            const { organizationId } = req.user!;
            const id = getRequiredParam(req.params, 'id');
            const log = await auditService.getById(organizationId, id);
            res.json({ data: log });
        } catch (error) {
            console.error('Error fetching audit log:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    return router;
}
