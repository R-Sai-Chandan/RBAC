/**
 * Sharing Rules Routes
 * 
 * HTTP endpoints for sharing rule management.
 * Delegates to SharingRuleService for all business logic.
 */

import { Router, Request, Response } from 'express';
import { ISharingRuleService } from '../services/sharingRule.service';
import { RBACInternalError } from '../errors/rbac.errors';
import { getRequiredParam } from './_paramUtils';

export function createSharingRulesRouter(sharingRuleService: ISharingRuleService): Router {
    const router = Router();

    // GET /sharing-rules - List all sharing rules
    router.get('/', async (req: Request, res: Response) => {
        try {
            // RBAC RULE: Assert auth context
            if (!req.user || !req.user.id || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            const organizationId = req.user.organizationId;
            const rules = await sharingRuleService.listAll(organizationId);
            res.json({ data: rules });
        } catch (error) {
            console.error('Error listing sharing rules:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // GET /sharing-rules/:id - Get sharing rule by ID
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
            const rule = await sharingRuleService.getById(organizationId, id);
            res.json({ data: rule });
        } catch (error) {
            if (error instanceof RBACInternalError) {
                res.status(404).json({ error: 'Not Found', message: error.message });
                return;
            }
            console.error('Error getting sharing rule:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // POST /sharing-rules - Create new sharing rule
    router.post('/', async (req: Request, res: Response) => {
        try {
            // RBAC RULE: Assert auth context
            if (!req.user || !req.user.id || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            const organizationId = req.user.organizationId;
            const actingUserId = req.user.id;
            const rule = await sharingRuleService.create(organizationId, req.body, actingUserId);
            res.status(201).json({ data: rule });
        } catch (error) {
            console.error('Error creating sharing rule:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // PATCH /sharing-rules/:id - Update sharing rule
    router.patch('/:id', async (req: Request, res: Response) => {
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
            const rule = await sharingRuleService.update(organizationId, id, req.body, actingUserId);
            res.json({ data: rule });
        } catch (error) {
            console.error('Error updating sharing rule:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // DELETE /sharing-rules/:id - Delete sharing rule
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
            await sharingRuleService.delete(organizationId, id, actingUserId);
            res.status(204).send();
        } catch (error) {
            console.error('Error deleting sharing rule:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    return router;
}
