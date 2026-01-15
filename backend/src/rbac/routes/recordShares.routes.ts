/**
 * Record Shares Routes
 * 
 * HTTP endpoints for record share management.
 * Delegates to RecordShareService for all business logic.
 */

import { Router, Request, Response } from 'express';
import { IRecordShareService } from '../services/recordShare.service';
import { RBACInternalError } from '../errors/rbac.errors';
import { getRequiredParam, getOptionalQuery } from './_paramUtils';

export function createRecordSharesRouter(recordShareService: IRecordShareService): Router {
    const router = Router();

    // GET /record-shares - List record shares (with query params)
    router.get('/', async (req: Request, res: Response) => {
        try {
            // RBAC RULE: Assert auth context
            if (!req.user || !req.user.id || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            const organizationId = req.user.organizationId;

            // QUERY PARAM NORMALIZATION: Strict type narrowing
            const module_id = getOptionalQuery(req.query, 'module_id');
            const record_id = getOptionalQuery(req.query, 'record_id');
            const user_id = getOptionalQuery(req.query, 'user_id');
            const group_id = getOptionalQuery(req.query, 'group_id');
            const role_id = getOptionalQuery(req.query, 'role_id');

            if (module_id && record_id) {
                const shares = await recordShareService.listByRecord(organizationId, module_id, record_id);
                res.json({ data: shares });
                return;
            }

            if (user_id) {
                const shares = await recordShareService.listByUser(organizationId, user_id);
                res.json({ data: shares });
                return;
            }

            if (group_id) {
                const shares = await recordShareService.listByGroup(organizationId, group_id);
                res.json({ data: shares });
                return;
            }

            if (role_id) {
                const shares = await recordShareService.listByRole(organizationId, role_id);
                res.json({ data: shares });
                return;
            }

            res.status(400).json({ error: 'Bad Request', message: 'Valid query parameters required' });
        } catch (error) {
            console.error('Error listing record shares:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // GET /record-shares/:id - Get record share by ID
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
            const share = await recordShareService.getById(organizationId, id);
            res.json({ data: share });
        } catch (error) {
            if (error instanceof RBACInternalError) {
                res.status(404).json({ error: 'Not Found', message: error.message });
                return;
            }
            console.error('Error getting record share:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // POST /record-shares - Create new record share
    router.post('/', async (req: Request, res: Response) => {
        try {
            // RBAC RULE: Assert auth context
            if (!req.user || !req.user.id || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            const organizationId = req.user.organizationId;
            const actingUserId = req.user.id;
            const share = await recordShareService.create(organizationId, req.body, actingUserId);
            res.status(201).json({ data: share });
        } catch (error) {
            console.error('Error creating record share:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // DELETE /record-shares/:id - Delete record share
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
            await recordShareService.delete(organizationId, id, actingUserId);
            res.status(204).send();
        } catch (error) {
            console.error('Error deleting record share:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    return router;
}
