/**
 * Profiles Routes
 * 
 * HTTP endpoints for profile management.
 * Authorization: SETTINGS:manage_profiles permission required.
 */

import { Router, Request, Response } from 'express';
import { IProfileService } from '../services/profile.service';
import { IEvaluationService } from '../services/evaluation.service';
import { IAuditService } from '../services/audit.service';
import { requirePermission } from '../middleware/requirePermission.middleware';
import { ProfileNotFoundError } from '../errors/rbac.errors';
import { getRequiredParam } from './_paramUtils';

export function createProfilesRouter(
    profileService: IProfileService,
    evaluationService: IEvaluationService,
    auditService: IAuditService
): Router {
    const router = Router();

    // SETTINGS:manage_profiles permission for all profile management routes
    const check = () => requirePermission('SETTINGS', 'manage_profiles', evaluationService, auditService);

    // GET /profiles - List all profiles
    router.get('/', check(), async (req: Request, res: Response) => {
        try {
            if (!req.user || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const profiles = await profileService.listAll(req.user.organizationId);
            res.json({ data: profiles });
        } catch (error) {
            console.error('Error listing profiles:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // GET /profiles/:id
    router.get('/:id', check(), async (req: Request, res: Response) => {
        try {
            if (!req.user || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const id = getRequiredParam(req.params, 'id');
            const profile = await profileService.getById(req.user.organizationId, id);
            res.json({ data: profile });
        } catch (error) {
            if (error instanceof ProfileNotFoundError) {
                res.status(404).json({ error: 'Not Found', message: error.message });
                return;
            }
            console.error('Error fetching profile:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // POST /profiles
    router.post('/', check(), async (req: Request, res: Response) => {
        try {
            if (!req.user || !req.user.organizationId || !req.user.id) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const profile = await profileService.create(req.user.organizationId, req.body, req.user.id);
            res.status(201).json({ data: profile });
        } catch (error) {
            console.error('Error creating profile:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // PATCH /profiles/:id
    router.patch('/:id', check(), async (req: Request, res: Response) => {
        try {
            if (!req.user || !req.user.organizationId || !req.user.id) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const id = getRequiredParam(req.params, 'id');
            const profile = await profileService.update(req.user.organizationId, id, req.body, req.user.id);
            res.json({ data: profile });
        } catch (error) {
            if (error instanceof ProfileNotFoundError) {
                res.status(404).json({ error: 'Not Found', message: error.message });
                return;
            }
            console.error('Error updating profile:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // DELETE /profiles/:id
    router.delete('/:id', check(), async (req: Request, res: Response) => {
        try {
            if (!req.user || !req.user.organizationId || !req.user.id) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const id = getRequiredParam(req.params, 'id');
            await profileService.delete(req.user.organizationId, id, req.user.id);
            res.status(204).send();
        } catch (error) {
            if (error instanceof ProfileNotFoundError) {
                res.status(404).json({ error: 'Not Found', message: error.message });
                return;
            }
            console.error('Error deleting profile:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // GET /profiles/:id/permissions
    router.get('/:id/permissions', check(), async (req: Request, res: Response) => {
        try {
            if (!req.user || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const id = getRequiredParam(req.params, 'id');
            const permissions = await profileService.getPermissions(req.user.organizationId, id);
            res.json({ data: permissions });
        } catch (error) {
            console.error('Error fetching profile permissions:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    return router;
}
