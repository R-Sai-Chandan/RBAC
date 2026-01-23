/**
 * Profiles Routes
 * 
 * HTTP endpoints for profile management with deterministic permission handling.
 * Permissions are immutable - profiles only reference them.
 */

import { Router, Request, Response } from 'express';
import { IProfileService } from '../services/profile.service';
import { IEvaluationService } from '../services/evaluation.service';
import { IAuditService } from '../services/audit.service';
import { requirePermission } from '../middleware/requirePermission.middleware';
import { ProfileNotFoundError, PermissionNotFoundError } from '../errors/rbac.errors';
import { getRequiredParam } from './_paramUtils';

export function createProfilesRouter(
    profileService: IProfileService,
    evaluationService: IEvaluationService,
    auditService: IAuditService
): Router {
    const router = Router();

    // GET /profiles - List all profiles -> READ
    router.get('/', requirePermission('PROFILES', 'read', evaluationService, auditService), async (req: Request, res: Response) => {
        try {

            const profiles = await profileService.listAll(req.user!.organizationId);
            res.json({ data: profiles });
        } catch (error) {
            console.error('Error listing profiles:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // GET /profiles/:id - Get profile with all permissions (allowed true/false)
    router.get('/:id', requirePermission('PROFILES', 'read', evaluationService, auditService), async (req: Request, res: Response) => {
        try {
            const id = getRequiredParam(req.params, 'id');
            const profile = await profileService.getProfileWithPermissions(req.user!.organizationId, id);
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

    // POST /profiles - Create profile with permissions
    router.post('/', requirePermission('PROFILES', 'create', evaluationService, auditService), async (req: Request, res: Response) => {
        try {
            const { name, description, permission_ids } = req.body;

            if (!name) {
                res.status(400).json({ error: 'Bad Request', message: 'name is required' });
                return;
            }

            if (!Array.isArray(permission_ids)) {
                res.status(400).json({ error: 'Bad Request', message: 'permission_ids must be an array' });
                return;
            }

            const result = await profileService.createProfile(
                req.user!.organizationId,
                { name, description, permission_ids },
                req.user!.id
            );

            res.status(201).json({ data: result });
        } catch (error) {
            if (error instanceof PermissionNotFoundError) {
                res.status(400).json({ error: 'Bad Request', message: error.message });
                return;
            }
            console.error('Error creating profile:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // PUT /profiles/:id/permissions - Replace permissions (authoritative set)
    router.put('/:id/permissions', requirePermission('PROFILES', 'update', evaluationService, auditService), async (req: Request, res: Response) => {
        try {
            const id = getRequiredParam(req.params, 'id');
            const { permission_ids } = req.body;

            if (!Array.isArray(permission_ids)) {
                res.status(400).json({ error: 'Bad Request', message: 'permission_ids must be an array' });
                return;
            }

            await profileService.updateProfilePermissions(
                req.user!.organizationId,
                id,
                permission_ids,
                req.user!.id
            );

            res.status(204).send();
        } catch (error) {
            if (error instanceof ProfileNotFoundError) {
                res.status(404).json({ error: 'Not Found', message: error.message });
                return;
            }
            if (error instanceof PermissionNotFoundError) {
                res.status(400).json({ error: 'Bad Request', message: error.message });
                return;
            }
            console.error('Error updating profile permissions:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    return router;
}
