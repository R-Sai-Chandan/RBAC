/**
 * SMTP Config Routes
 * 
 * HTTP endpoints for SMTP configuration management.
 * Authorization: SETTINGS:manage_smtp permission required.
 */

import { Router, Request, Response } from 'express';
import { ISmtpConfigService } from '../services/smtpConfig.service';
import { IEvaluationService } from '../services/evaluation.service';
import { IAuditService } from '../services/audit.service';
import { requirePermission } from '../middleware/requirePermission.middleware';
import { getRequiredParam } from './_paramUtils';

export function createSmtpConfigRouter(
    smtpConfigService: ISmtpConfigService,
    evaluationService: IEvaluationService,
    auditService: IAuditService
): Router {
    const router = Router();

    // SETTINGS:manage_smtp permission for all SMTP config routes
    const check = () => requirePermission('SETTINGS', 'manage_smtp', evaluationService, auditService);

    // GET /smtp-config
    router.get('/', check(), async (req: Request, res: Response) => {
        try {
            if (!req.user || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const configs = await smtpConfigService.listAll(req.user.organizationId);
            res.json({ data: configs });
        } catch (error) {
            console.error('Error listing SMTP configs:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // GET /smtp-config/active
    router.get('/active', check(), async (req: Request, res: Response) => {
        try {
            if (!req.user || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const config = await smtpConfigService.getActive(req.user.organizationId);
            if (!config) {
                res.status(404).json({ error: 'Not Found', message: 'No active SMTP config' });
                return;
            }
            res.json({ data: config });
        } catch (error) {
            console.error('Error fetching active SMTP config:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // GET /smtp-config/:id
    router.get('/:id', check(), async (req: Request, res: Response) => {
        try {
            if (!req.user || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const id = getRequiredParam(req.params, 'id');
            const config = await smtpConfigService.getById(req.user.organizationId, id);
            res.json({ data: config });
        } catch (error) {
            console.error('Error fetching SMTP config:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // POST /smtp-config
    router.post('/', check(), async (req: Request, res: Response) => {
        try {
            if (!req.user || !req.user.organizationId || !req.user.id) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const config = await smtpConfigService.create(req.user.organizationId, req.body, req.user.id);
            res.status(201).json({ data: config });
        } catch (error) {
            console.error('Error creating SMTP config:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // PATCH /smtp-config/:id
    router.patch('/:id', check(), async (req: Request, res: Response) => {
        try {
            if (!req.user || !req.user.organizationId || !req.user.id) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const id = getRequiredParam(req.params, 'id');
            const config = await smtpConfigService.update(req.user.organizationId, id, req.body, req.user.id);
            res.json({ data: config });
        } catch (error) {
            console.error('Error updating SMTP config:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // DELETE /smtp-config/:id
    router.delete('/:id', check(), async (req: Request, res: Response) => {
        try {
            if (!req.user || !req.user.organizationId || !req.user.id) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const id = getRequiredParam(req.params, 'id');
            await smtpConfigService.delete(req.user.organizationId, id, req.user.id);
            res.status(204).send();
        } catch (error) {
            console.error('Error deleting SMTP config:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // POST /smtp-config/:id/activate
    router.post('/:id/activate', check(), async (req: Request, res: Response) => {
        try {
            if (!req.user || !req.user.organizationId || !req.user.id) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const id = getRequiredParam(req.params, 'id');
            await smtpConfigService.activate(req.user.organizationId, id, req.user.id);
            res.json({ message: 'SMTP config activated' });
        } catch (error) {
            console.error('Error activating SMTP config:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    return router;
}
