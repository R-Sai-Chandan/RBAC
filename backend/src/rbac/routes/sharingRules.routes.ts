/**
 * Sharing Rules Routes
 * 
 * HTTP endpoints for sharing rule management.
 * Authorization: SETTINGS:manage_sharing permission required.
 */

import { Router, Request, Response } from 'express';
import { ISharingRuleService } from '../services/sharingRule.service';
import { IEvaluationService } from '../services/evaluation.service';
import { IAuditService } from '../services/audit.service';
import { requirePermission } from '../middleware/requirePermission.middleware';
import { getRequiredParam } from './_paramUtils';

export function createSharingRulesRouter(
    sharingRuleService: ISharingRuleService,
    evaluationService: IEvaluationService,
    auditService: IAuditService
): Router {
    const router = Router();

    // GET /sharing-rules -> READ
    router.get('/', requirePermission('SHARING', 'read', evaluationService, auditService), async (req: Request, res: Response) => {
        try {

            const rules = await sharingRuleService.listAll(req.user!.organizationId);
            res.json({ data: rules });
        } catch (error) {
            console.error('Error listing sharing rules:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // GET /sharing-rules/:id -> READ
    router.get('/:id', requirePermission('SHARING', 'read', evaluationService, auditService), async (req: Request, res: Response) => {
        try {

            const id = getRequiredParam(req.params, 'id');
            const rule = await sharingRuleService.getById(req.user!.organizationId, id);
            res.json({ data: rule });
        } catch (error) {
            console.error('Error fetching sharing rule:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // POST /sharing-rules -> CREATE
    router.post('/', requirePermission('SHARING', 'create', evaluationService, auditService), async (req: Request, res: Response) => {
        try {

            const rule = await sharingRuleService.create(req.user!.organizationId, req.body, req.user!.id);
            res.status(201).json({ data: rule });
        } catch (error) {
            console.error('Error creating sharing rule:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // PATCH /sharing-rules/:id -> UPDATE
    router.patch('/:id', requirePermission('SHARING', 'update', evaluationService, auditService), async (req: Request, res: Response) => {
        try {

            const id = getRequiredParam(req.params, 'id');
            const rule = await sharingRuleService.update(req.user!.organizationId, id, req.body, req.user!.id);
            res.json({ data: rule });
        } catch (error) {
            console.error('Error updating sharing rule:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // DELETE /sharing-rules/:id -> DELETE
    router.delete('/:id', requirePermission('SHARING', 'delete', evaluationService, auditService), async (req: Request, res: Response) => {
        try {

            const id = getRequiredParam(req.params, 'id');
            await sharingRuleService.delete(req.user!.organizationId, id, req.user!.id);
            res.status(204).send();
        } catch (error) {
            console.error('Error deleting sharing rule:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    return router;
}
