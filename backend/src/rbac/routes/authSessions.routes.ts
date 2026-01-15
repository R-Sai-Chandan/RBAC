/**
 * Auth Sessions Routes
 * 
 * HTTP endpoints for authentication session management.
 * Delegates to AuthSessionService for all business logic.
 */

import { Router, Request, Response } from 'express';
import { IAuthSessionService } from '../services/authSession.service';
import { RBACInternalError } from '../errors/rbac.errors';
import { getRequiredParam } from './_paramUtils';

export function createAuthSessionsRouter(authSessionService: IAuthSessionService): Router {
    const router = Router();

    // GET /auth-sessions - List sessions for current user
    router.get('/', async (req: Request, res: Response) => {
        try {
            // RBAC RULE: Assert auth context
            if (!req.user || !req.user.id || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            const organizationId = req.user.organizationId;
            const userId = req.user.id;
            const sessions = await authSessionService.listActiveByUser(organizationId, userId);
            res.json({ data: sessions });
        } catch (error) {
            console.error('Error listing auth sessions:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // GET /auth-sessions/:id - Get session by ID
    router.get('/:id', async (req: Request, res: Response) => {
        try {
            // RBAC RULE: Assert auth context
            if (!req.user || !req.user.id || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            // PARAM SAFETY: Strict normalization
            const id = getRequiredParam(req.params, 'id');

            const organizationId = req.user.organizationId;
            const session = await authSessionService.getById(organizationId, id);
            res.json({ data: session });
        } catch (error) {
            if (error instanceof RBACInternalError) {
                res.status(404).json({ error: 'Not Found', message: error.message });
                return;
            }
            console.error('Error getting auth session:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // POST /auth-sessions - Create new session
    router.post('/', async (req: Request, res: Response) => {
        try {
            // RBAC RULE: Assert auth context
            if (!req.user || !req.user.id || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            const organizationId = req.user.organizationId;
            const session = await authSessionService.create(organizationId, req.body);
            res.status(201).json({ data: session });
        } catch (error) {
            console.error('Error creating auth session:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // POST /auth-sessions/:id/logout - Logout session
    router.post('/:id/logout', async (req: Request, res: Response) => {
        try {
            // RBAC RULE: Assert auth context
            if (!req.user || !req.user.id || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            // PARAM SAFETY: Strict normalization
            const id = getRequiredParam(req.params, 'id');

            const organizationId = req.user.organizationId;
            await authSessionService.logout(organizationId, id);
            res.status(204).send();
        } catch (error) {
            console.error('Error logging out session:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // DELETE /auth-sessions/:id - Revoke session
    router.delete('/:id', async (req: Request, res: Response) => {
        try {
            // RBAC RULE: Assert auth context
            if (!req.user || !req.user.id || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            // PARAM SAFETY: Strict normalization
            const id = getRequiredParam(req.params, 'id');

            const organizationId = req.user.organizationId;
            const actingUserId = req.user.id;
            await authSessionService.revoke(organizationId, id, actingUserId);
            res.status(204).send();
        } catch (error) {
            console.error('Error revoking session:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    return router;
}
