/**
 * Authentication Middleware
 * 
 * Verifies the presence and validity of an active session.
 * Hydrates req.user with RBAC context.
 * 
 * Rules:
 * - Fail closed if no session ID provided
 * - Fail closed if session invalid/expired
 * - Fail closed if session not found
 * - Fail closed if Tenant Mismatch
 */

import { Response, NextFunction } from 'express';
import { IAuthSessionService } from '../services/authSession.service';
import { RBACRequest } from './requirePermission.middleware';

/**
 * Factory for Authentication Middleware
 */
export function createAuthenticateMiddleware(authSessionService: IAuthSessionService) {
    return async (req: RBACRequest, res: Response, next: NextFunction) => {
        try {
            // 1. Strict Session ID Extraction using HTTP-Only Cookie
            // Migration: Header -> Cookie
            // Ensure cookies exist (cookie-parser required)
            const sessionId = req.cookies ? req.cookies['sessionId'] : undefined;

            if (!sessionId) {
                // FAIL-CLOSED
                res.status(401).json({ error: 'Unauthorized', message: 'Authentication required (Cookie missing)' });
                return;
            }

            // 2. Organization Context
            const organizationId = req.headers['x-organization-id'] as string;
            if (!organizationId) {
                res.status(400).json({ error: 'Bad Request', message: 'X-Organization-ID header required' });
                return;
            }

            // 3. Verify Validity
            const isValid = await authSessionService.isValid(organizationId, sessionId);
            if (!isValid) {
                res.status(401).json({ error: 'Unauthorized', message: 'Session invalid or expired' });
                return;
            }

            // 4. Get Session Details
            const session = await authSessionService.getById(organizationId, sessionId);

            // 5. Strict Tenant Isolation Check
            // Hardening: "Fail with 403 TENANT_MISMATCH on org mismatch"
            if (session.organization_id !== organizationId) {
                res.status(403).json({
                    error: 'Forbidden',
                    message: 'Tenant mismatch',
                    code: 'TENANT_MISMATCH'
                });
                return;
            }

            // 6. Attach User Context
            req.user = {
                id: session.user_id,
                organizationId: session.organization_id,
                sessionId: session.id
            };

            next();
        } catch (error) {
            console.error('Authentication Error:', error);
            res.status(401).json({ error: 'Unauthorized', message: 'Authentication failed' });
        }
    };
}
