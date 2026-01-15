/**
 * SMTP Config Routes
 * 
 * HTTP endpoints for SMTP configuration management.
 * Delegates to SmtpConfigService for all business logic.
 */

import { Router, Request, Response } from 'express';
import { ISmtpConfigService } from '../services/smtpConfig.service';
import { RBACInternalError } from '../errors/rbac.errors';
import { getRequiredParam } from './_paramUtils';

export function createSmtpConfigRouter(smtpConfigService: ISmtpConfigService): Router {
    const router = Router();

    // GET /smtp-config - List all SMTP configs
    router.get('/', async (req: Request, res: Response) => {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing organization context' });
                return;
            }

            const configs = await smtpConfigService.listAll(organizationId);
            res.json({ data: configs });
        } catch (error) {
            console.error('Error listing SMTP configs:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // GET /smtp-config/active - Get active SMTP config
    router.get('/active', async (req: Request, res: Response) => {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing organization context' });
                return;
            }

            const config = await smtpConfigService.getActive(organizationId);
            res.json({ data: config });
        } catch (error) {
            if (error instanceof RBACInternalError) {
                res.status(404).json({ error: 'Not Found', message: error.message });
                return;
            }
            console.error('Error getting active SMTP config:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // GET /smtp-config/:id - Get SMTP config by ID
    router.get('/:id', async (req: Request, res: Response) => {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing organization context' });
                return;
            }

            // PARAM SAFETY: Strict normalization
            const id = getRequiredParam(req.params, 'id');

            const config = await smtpConfigService.getById(organizationId, id);
            res.json({ data: config });
        } catch (error) {
            if (error instanceof RBACInternalError) {
                res.status(404).json({ error: 'Not Found', message: error.message });
                return;
            }
            console.error('Error getting SMTP config:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // POST /smtp-config - Create new SMTP config
    router.post('/', async (req: Request, res: Response) => {
        try {
            const organizationId = req.user?.organizationId;
            const actingUserId = req.user?.id;
            if (!organizationId || !actingUserId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            const config = await smtpConfigService.create(organizationId, req.body, actingUserId);
            res.status(201).json({ data: config });
        } catch (error) {
            console.error('Error creating SMTP config:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // PATCH /smtp-config/:id - Update SMTP config
    router.patch('/:id', async (req: Request, res: Response) => {
        try {
            const organizationId = req.user?.organizationId;
            const actingUserId = req.user?.id;
            if (!organizationId || !actingUserId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            // PARAM SAFETY: Strict normalization
            const id = getRequiredParam(req.params, 'id');

            const config = await smtpConfigService.update(organizationId, id, req.body, actingUserId);
            res.json({ data: config });
        } catch (error) {
            console.error('Error updating SMTP config:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // DELETE /smtp-config/:id - Delete SMTP config
    router.delete('/:id', async (req: Request, res: Response) => {
        try {
            const organizationId = req.user?.organizationId;
            const actingUserId = req.user?.id;
            if (!organizationId || !actingUserId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            // PARAM SAFETY: Strict normalization
            const id = getRequiredParam(req.params, 'id');

            await smtpConfigService.delete(organizationId, id, actingUserId);
            res.status(204).send();
        } catch (error) {
            console.error('Error deleting SMTP config:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // POST /smtp-config/:id/activate - Activate SMTP config
    router.post('/:id/activate', async (req: Request, res: Response) => {
        try {
            const organizationId = req.user?.organizationId;
            const actingUserId = req.user?.id;
            if (!organizationId || !actingUserId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            // PARAM SAFETY: Strict normalization
            const id = getRequiredParam(req.params, 'id');

            await smtpConfigService.activate(organizationId, id, actingUserId);
            res.status(204).send();
        } catch (error) {
            console.error('Error activating SMTP config:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    return router;
}
