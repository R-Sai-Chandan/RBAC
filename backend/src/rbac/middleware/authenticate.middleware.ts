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
            // 1. Extract Session ID (Bearer Token or X-Session-ID)
            let sessionId = req.headers['x-session-id'] as string;

            // Fallback to Bearer token
            if (!sessionId) {
                const authHeader = req.headers.authorization;
                if (authHeader && authHeader.startsWith('Bearer ')) {
                    sessionId = authHeader.substring(7);
                }
            }

            if (!sessionId) {
                // FAIL-CLOSED
                res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
                return;
            }

            // 2. Validate Session
            // We need organizationId to validate. 
            // PROBLEM: Session ID is unique PK? If so, we can find it without OrgID?
            // Repository says `findById(organizationId, sessionId)`.
            // This implies we need OrgID to find session. 
            // BUT: Middleware runs *before* we trust client to provide OrgID.
            // If repository requires OrgId, this design implies strict multi-tenancy where we must know context first.
            // Client usually sends X-Organization-ID header?
            // OR: Session IDs are globally unique UUIDs, and repo method is scoped for check.

            // HACK/ASSUMPTION: We expect X-Organization-ID header for context?
            // OR: We try to parse the session?

            // Let's assume standard RBAC pattern: Client MAY send Organization Context.
            // BUT for security, the Session itself DEFINES the Organization.
            // If repository *requires* OrgId to find session, we have a chicken-egg problem if we don't trust client header.
            // However, `AuthSessionService.getById` calls repo with OrgID.

            // PROPOSAL: Client MUST provide `X-Organization-ID` matching the session's Org.
            // Middleware verifies they match.

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

            // 4. Get Session Details to hydrate Context
            const session = await authSessionService.getById(organizationId, sessionId);

            // 5. Attach User Context
            req.user = {
                id: session.user_id,
                organizationId: session.organization_id,
                sessionId: session.id // Attach session ID for Logout/Audit usage
            };

            next();
        } catch (error) {
            console.error('Authentication Error:', error);
            res.status(401).json({ error: 'Unauthorized', message: 'Authentication failed' });
        }
    };
}
