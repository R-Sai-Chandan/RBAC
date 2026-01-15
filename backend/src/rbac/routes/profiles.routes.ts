/**
 * Profiles Routes
 * 
 * HTTP endpoints for profile management.
 * Delegates to ProfileService for all business logic.
 */

import { Router, Request, Response } from 'express';
import { IProfileService } from '../services/profile.service';
import { ProfileNotFoundError, DuplicateAssignmentError, RBACInternalError } from '../errors/rbac.errors';
import { getRequiredParam } from './_paramUtils';

export function createProfilesRouter(profileService: IProfileService): Router {
    const router = Router();

    // GET /profiles - List all profiles
    router.get('/', async (req: Request, res: Response) => {
        try {
            // RBAC RULE: Assert auth context
            if (!req.user || !req.user.id || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            const organizationId = req.user.organizationId;
            const profiles = await profileService.listAll(organizationId);
            res.json({ data: profiles });
        } catch (error) {
            console.error('Error listing profiles:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // GET /profiles/:id - Get profile by ID
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
            const profile = await profileService.getById(organizationId, id);
            res.json({ data: profile });
        } catch (error) {
            if (error instanceof ProfileNotFoundError) {
                res.status(404).json({ error: 'Not Found', message: error.message });
                return;
            }
            console.error('Error getting profile:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // POST /profiles - Create new profile
    router.post('/', async (req: Request, res: Response) => {
        try {
            // RBAC RULE: Assert auth context
            if (!req.user || !req.user.id || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            const organizationId = req.user.organizationId;
            const actingUserId = req.user.id;
            const { name, code, description, is_active } = req.body;

            if (!name || !code) {
                res.status(400).json({ error: 'Bad Request', message: 'name and code are required' });
                return;
            }

            const profile = await profileService.create(organizationId, { name, code, description, is_active }, actingUserId);
            res.status(201).json({ data: profile });
        } catch (error) {
            if (error instanceof DuplicateAssignmentError) {
                res.status(409).json({ error: 'Conflict', message: error.message });
                return;
            }
            console.error('Error creating profile:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // PATCH /profiles/:id - Update profile
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
            const profile = await profileService.update(organizationId, id, req.body, actingUserId);
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

    // DELETE /profiles/:id - Delete profile
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
            await profileService.delete(organizationId, id, actingUserId);
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

    // GET /profiles/:id/permissions - Get profile permissions
    router.get('/:id/permissions', async (req: Request, res: Response) => {
        try {
            // RBAC RULE: Assert auth context
            if (!req.user || !req.user.id || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            // PARAM SAFETY: Strict normalization
            const id = getRequiredParam(req.params, 'id');

            const organizationId = req.user.organizationId;
            const permissions = await profileService.getPermissions(organizationId, id);
            res.json({ data: permissions });
        } catch (error) {
            console.error('Error getting profile permissions:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // POST /profiles/:id/permissions/:permissionId - Assign permission to profile
    router.post('/:id/permissions/:permissionId', async (req: Request, res: Response) => {
        try {
            // RBAC RULE: Assert auth context
            if (!req.user || !req.user.id || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            // PARAM SAFETY: Strict normalization
            const id = getRequiredParam(req.params, 'id');
            const permissionId = getRequiredParam(req.params, 'permissionId');

            const { effect } = req.body;
            if (!effect) {
                res.status(400).json({ error: 'Bad Request', message: 'effect is required' });
                return;
            }

            const organizationId = req.user.organizationId;
            const actingUserId = req.user.id;
            await profileService.assignPermission(organizationId, id, permissionId, effect, actingUserId);
            res.status(204).send();
        } catch (error) {
            if (error instanceof RBACInternalError) {
                res.status(400).json({ error: 'Bad Request', message: error.message });
                return;
            }
            console.error('Error assigning permission to profile:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // DELETE /profiles/:id/permissions/:permissionId - Revoke permission from profile
    router.delete('/:id/permissions/:permissionId', async (req: Request, res: Response) => {
        try {
            // RBAC RULE: Assert auth context
            if (!req.user || !req.user.id || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            // PARAM SAFETY: Strict normalization
            const id = getRequiredParam(req.params, 'id');
            const permissionId = getRequiredParam(req.params, 'permissionId');

            const organizationId = req.user.organizationId;
            const actingUserId = req.user.id;
            await profileService.revokePermission(organizationId, id, permissionId, actingUserId);
            res.status(204).send();
        } catch (error) {
            console.error('Error revoking permission from profile:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    return router;
}
