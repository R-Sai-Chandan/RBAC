/**
 * Groups Routes
 * 
 * HTTP endpoints for group management.
 * Delegates to GroupService for all business logic.
 */

import { Router, Request, Response } from 'express';
import { IGroupService } from '../services/group.service';
import { GroupNotFoundError, DuplicateAssignmentError } from '../errors/rbac.errors';
import { getRequiredParam } from './_paramUtils';

export function createGroupsRouter(groupService: IGroupService): Router {
    const router = Router();

    // GET /groups - List all groups
    router.get('/', async (req: Request, res: Response) => {
        try {
            // RBAC RULE: Assert auth context
            if (!req.user || !req.user.id || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            const organizationId = req.user.organizationId;
            const groups = await groupService.listAll(organizationId);
            res.json({ data: groups });
        } catch (error) {
            console.error('Error listing groups:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // GET /groups/:id - Get group by ID
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
            const group = await groupService.getById(organizationId, id);
            res.json({ data: group });
        } catch (error) {
            if (error instanceof GroupNotFoundError) {
                res.status(404).json({ error: 'Not Found', message: error.message });
                return;
            }
            console.error('Error getting group:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // POST /groups - Create new group
    router.post('/', async (req: Request, res: Response) => {
        try {
            // RBAC RULE: Assert auth context
            if (!req.user || !req.user.id || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            const organizationId = req.user.organizationId;
            const actingUserId = req.user.id;
            const { name, description, is_active } = req.body;

            if (!name) {
                res.status(400).json({ error: 'Bad Request', message: 'name is required' });
                return;
            }

            const group = await groupService.create(organizationId, { name, description, is_active }, actingUserId);
            res.status(201).json({ data: group });
        } catch (error) {
            if (error instanceof DuplicateAssignmentError) {
                res.status(409).json({ error: 'Conflict', message: error.message });
                return;
            }
            console.error('Error creating group:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // PATCH /groups/:id - Update group
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
            const group = await groupService.update(organizationId, id, req.body, actingUserId);
            res.json({ data: group });
        } catch (error) {
            if (error instanceof GroupNotFoundError) {
                res.status(404).json({ error: 'Not Found', message: error.message });
                return;
            }
            console.error('Error updating group:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // DELETE /groups/:id - Delete group
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
            await groupService.delete(organizationId, id, actingUserId);
            res.status(204).send();
        } catch (error) {
            if (error instanceof GroupNotFoundError) {
                res.status(404).json({ error: 'Not Found', message: error.message });
                return;
            }
            console.error('Error deleting group:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // POST /groups/:id/members/:userId - Add member to group
    router.post('/:id/members/:userId', async (req: Request, res: Response) => {
        try {
            // RBAC RULE: Assert auth context
            if (!req.user || !req.user.id || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            // PARAM SAFETY: Strict normalization
            const id = getRequiredParam(req.params, 'id');
            const userId = getRequiredParam(req.params, 'userId');

            const organizationId = req.user.organizationId;
            const actingUserId = req.user.id;
            await groupService.addMember(organizationId, id, userId, actingUserId);
            res.status(204).send();
        } catch (error) {
            if (error instanceof DuplicateAssignmentError) {
                res.status(409).json({ error: 'Conflict', message: error.message });
                return;
            }
            console.error('Error adding member to group:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // DELETE /groups/:id/members/:userId - Remove member from group
    router.delete('/:id/members/:userId', async (req: Request, res: Response) => {
        try {
            // RBAC RULE: Assert auth context
            if (!req.user || !req.user.id || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            // PARAM SAFETY: Strict normalization
            const id = getRequiredParam(req.params, 'id');
            const userId = getRequiredParam(req.params, 'userId');

            const organizationId = req.user.organizationId;
            const actingUserId = req.user.id;
            await groupService.removeMember(organizationId, id, userId, actingUserId);
            res.status(204).send();
        } catch (error) {
            console.error('Error removing member from group:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    return router;
}
