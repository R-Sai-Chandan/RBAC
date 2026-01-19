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

    // GET /smtp-config -> READ
    router.get('/', requirePermission('SMTP_CONFIG', 'read', evaluationService, auditService), async (req: Request, res: Response) => {
        try {
            // Context guaranteed by authenticate middleware
            const { organizationId } = req.user!;
            const configs = await smtpConfigService.listAll(organizationId);
            res.json({ data: configs });
        } catch (error) {
            console.error('Error listing SMTP configs:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // GET /smtp-config/active -> READ
    router.get('/active', requirePermission('SMTP_CONFIG', 'read', evaluationService, auditService), async (req: Request, res: Response) => {
        try {
            // Context guaranteed by authenticate middleware
            const { organizationId } = req.user!;
            const config = await smtpConfigService.getActive(organizationId);
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

    // GET /smtp-config/:id -> READ
    router.get('/:id', requirePermission('SMTP_CONFIG', 'read', evaluationService, auditService), async (req: Request, res: Response) => {
        try {
            // Context guaranteed by authenticate middleware
            const { organizationId } = req.user!;
            const id = getRequiredParam(req.params, 'id');
            const config = await smtpConfigService.getById(organizationId, id);
            res.json({ data: config });
        } catch (error) {
            console.error('Error fetching SMTP config:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // POST /smtp-config -> CREATE
    router.post('/', requirePermission('SMTP_CONFIG', 'create', evaluationService, auditService), async (req: Request, res: Response) => {
        try {
            // Context guaranteed by authenticate middleware
            const { organizationId, id: userId } = req.user!;
            const config = await smtpConfigService.create(organizationId, req.body, userId);
            res.status(201).json({ data: config });
        } catch (error) {
            console.error('Error creating SMTP config:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // PATCH /smtp-config/:id -> UPDATE
    router.patch('/:id', requirePermission('SMTP_CONFIG', 'update', evaluationService, auditService), async (req: Request, res: Response) => {
        try {
            // Context guaranteed by authenticate middleware
            const { organizationId, id: userId } = req.user!;
            const id = getRequiredParam(req.params, 'id');
            const config = await smtpConfigService.update(organizationId, id, req.body, userId);
            res.json({ data: config });
        } catch (error) {
            console.error('Error updating SMTP config:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // DELETE /smtp-config/:id -> DELETE
    router.delete('/:id', requirePermission('SMTP_CONFIG', 'delete', evaluationService, auditService), async (req: Request, res: Response) => {
        try {
            // Context guaranteed by authenticate middleware
            const { organizationId, id: userId } = req.user!;
            const id = getRequiredParam(req.params, 'id');
            await smtpConfigService.delete(organizationId, id, userId);
            res.status(204).send();
        } catch (error) {
            console.error('Error deleting SMTP config:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // POST /smtp-config/:id/activate -> UPDATE
    router.post('/:id/activate', requirePermission('SMTP_CONFIG', 'update', evaluationService, auditService), async (req: Request, res: Response) => {
        try {
            // Context guaranteed by authenticate middleware
            const { organizationId, id: userId } = req.user!;
            const id = getRequiredParam(req.params, 'id');
            await smtpConfigService.activate(organizationId, id, userId);
            res.json({ message: 'SMTP config activated' });
        } catch (error) {
            console.error('Error activating SMTP config:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    return router;
}
