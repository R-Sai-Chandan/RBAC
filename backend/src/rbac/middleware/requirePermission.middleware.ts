/**
 * requirePermission Middleware
 * 
 * Express middleware for enforcing RBAC permissions.
 * 
 * CRITICAL RULES:
 * - NO permission logic here
 * - Delegates ALL decisions to EvaluationService
 * - Fail-closed on ANY error
 * - Audits ALL denials
 * - Translates domain errors to HTTP responses
 * 
 * Usage:
 *   router.post('/invoices', requirePermission('INVOICES', 'create'), controller.create)
 */

import { Request, Response, NextFunction } from 'express';
import { IEvaluationService } from '../services/evaluation.service';
import { IAuditService } from '../services/audit.service';
import {
    PermissionDeniedError,
    TenantMismatchError,
    InvalidModuleActionError,
    RBACInternalError
} from '../errors/rbac.errors';
import { AuditAction, AuditStatus } from '../models/audit_log.model';

/**
 * Middleware factory
 * 
 * @param moduleCode - Module code (e.g., 'INVOICES', 'LEADS')
 * @param action - Action (e.g., 'create', 'read', 'update', 'delete', 'export')
 * @param evaluationService - Injected evaluation service
 * @param auditService - Injected audit service
 */
export function requirePermission(
    moduleCode: string,
    action: string,
    evaluationService: IEvaluationService,
    auditService: IAuditService
) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // FAIL-CLOSED: Missing user
            if (!req.user) {
                res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
                return;
            }

            // FAIL-CLOSED: Missing user ID
            if (!req.user.id) {
                res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Invalid user context: missing user ID',
                    code: 'INVALID_USER_CONTEXT'
                });
                return;
            }

            // FAIL-CLOSED: Missing organization ID
            if (!req.user.organizationId) {
                res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Invalid user context: missing organization ID',
                    code: 'INVALID_ORG_CONTEXT'
                });
                return;
            }

            const { id: userId, organizationId } = req.user;

            // Delegate to evaluation service
            try {
                await evaluationService.enforcePermission(
                    organizationId,
                    userId,
                    moduleCode,
                    action
                );

                // AUDIT: Permission granted
                await auditService.log(organizationId, {
                    user_id: userId,
                    action: AuditAction.UPDATE,
                    entity_type: 'permission_check',
                    entity_id: `${moduleCode}:${action}`,
                    status: AuditStatus.SUCCESS,
                    ip_address: req.ip,
                    user_agent: req.get('user-agent'),
                    old_values: null,
                    new_values: { moduleCode, action }
                }).catch(() => { });

                // Permission granted - proceed
                next();

            } catch (error) {
                // Handle domain errors
                if (error instanceof PermissionDeniedError) {
                    // Audit denial
                    await auditService.log(organizationId, {
                        user_id: userId,
                        action: AuditAction.UPDATE,
                        entity_type: 'permission_check',
                        entity_id: `${moduleCode}:${action}`,
                        status: AuditStatus.FAILED,
                        ip_address: req.ip,
                        user_agent: req.get('user-agent'),
                        old_values: null,
                        new_values: {
                            moduleCode,
                            action,
                            reason: error.reason
                        }
                    }).catch(() => { });

                    res.status(403).json({
                        error: 'Forbidden',
                        message: error.message,
                        code: 'PERMISSION_DENIED',
                        details: {
                            moduleCode,
                            action,
                            reason: error.reason
                        }
                    });
                    return;
                }

                if (error instanceof TenantMismatchError) {
                    await auditService.log(organizationId, {
                        user_id: userId,
                        action: AuditAction.UPDATE,
                        entity_type: 'permission_check',
                        entity_id: `${moduleCode}:${action}`,
                        status: AuditStatus.FAILED,
                        ip_address: req.ip,
                        user_agent: req.get('user-agent'),
                        old_values: null,
                        new_values: { reason: 'TENANT_MISMATCH' }
                    }).catch(() => { });

                    res.status(403).json({
                        error: 'Forbidden',
                        message: 'Organization mismatch',
                        code: 'TENANT_MISMATCH'
                    });
                    return;
                }

                if (error instanceof InvalidModuleActionError) {
                    await auditService.log(organizationId, {
                        user_id: userId,
                        action: AuditAction.UPDATE,
                        entity_type: 'permission_check',
                        entity_id: `${moduleCode}:${action}`,
                        status: AuditStatus.FAILED,
                        ip_address: req.ip,
                        user_agent: req.get('user-agent'),
                        old_values: null,
                        new_values: { reason: 'INVALID_MODULE_ACTION' }
                    }).catch(() => { });

                    res.status(400).json({
                        error: 'Bad Request',
                        message: error.message,
                        code: 'INVALID_MODULE_ACTION'
                    });
                    return;
                }

                if (error instanceof RBACInternalError) {
                    // FAIL-CLOSED: Internal error = deny access
                    console.error('RBAC Internal Error:', error);

                    await auditService.log(organizationId, {
                        user_id: userId,
                        action: AuditAction.UPDATE,
                        entity_type: 'permission_check',
                        entity_id: `${moduleCode}:${action}`,
                        status: AuditStatus.FAILED,
                        ip_address: req.ip,
                        user_agent: req.get('user-agent'),
                        old_values: null,
                        new_values: { reason: 'RBAC_INTERNAL_ERROR' }
                    }).catch(() => { });

                    res.status(500).json({
                        error: 'Internal Server Error',
                        message: 'Permission evaluation failed',
                        code: 'RBAC_INTERNAL_ERROR'
                    });
                    return;
                }

                // FAIL-CLOSED: Unknown error = deny access
                console.error('Unknown error in permission middleware:', error);

                await auditService.log(organizationId, {
                    user_id: userId,
                    action: AuditAction.UPDATE,
                    entity_type: 'permission_check',
                    entity_id: `${moduleCode}:${action}`,
                    status: AuditStatus.FAILED,
                    ip_address: req.ip,
                    user_agent: req.get('user-agent'),
                    old_values: null,
                    new_values: { reason: 'UNKNOWN_ERROR' }
                }).catch(() => { });

                res.status(500).json({
                    error: 'Internal Server Error',
                    message: 'Permission evaluation failed',
                    code: 'UNKNOWN_ERROR'
                });
                return;
            }

        } catch (error) {
            // FAIL-CLOSED: Outer catch for any unexpected errors
            console.error('Critical error in permission middleware:', error);

            if (req.user?.organizationId && req.user?.id) {
                await auditService.log(req.user.organizationId, {
                    user_id: req.user.id,
                    action: AuditAction.UPDATE,
                    entity_type: 'permission_check',
                    entity_id: `${moduleCode}:${action}`,
                    status: AuditStatus.FAILED,
                    ip_address: req.ip,
                    user_agent: req.get('user-agent'),
                    old_values: null,
                    new_values: { reason: 'MIDDLEWARE_ERROR' }
                }).catch(() => { });
            }

            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Permission check failed',
                code: 'MIDDLEWARE_ERROR'
            });
            return;
        }
    };
}

/**
 * Optional: Middleware to extract user from request
 * 
 * This is a placeholder. Replace with your actual authentication middleware.
 */
export function extractUser(req: Request, res: Response, next: NextFunction): void {
    // PLACEHOLDER: Replace with actual authentication logic
    // Example: JWT token validation, session lookup, etc.

    // For now, fail closed
    res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication not configured',
        code: 'AUTH_NOT_CONFIGURED'
    });
}
