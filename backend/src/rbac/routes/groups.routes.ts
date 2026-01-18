/**
 * Groups Routes
 * 
 * HTTP endpoints for group management.
 * Authorization: SETTINGS:manage_groups permission required.
 */

import { Router, Request, Response } from 'express';
import { IGroupService } from '../services/group.service';
import { IEvaluationService } from '../services/evaluation.service';
import { IAuditService } from '../services/audit.service';
import { requirePermission } from '../middleware/requirePermission.middleware';
import { getRequiredParam } from './_paramUtils';

export function createGroupsRouter(
    groupService: IGroupService,
    evaluationService: IEvaluationService,
    auditService: IAuditService
): Router {
    const router = Router();

    // SETTINGS:manage_groups permission for all group management routes
    const check = () => requirePermission('SETTINGS', 'manage_groups', evaluationService, auditService);

    // GET /groups
    router.get('/', check(), async (req: Request, res: Response) => {
        try {
            if (!req.user || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const groups = await groupService.listAll(req.user.organizationId);
            res.json({ data: groups });
        } catch (error) {
            console.error('Error listing groups:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // GET /groups/:id
    router.get('/:id', check(), async (req: Request, res: Response) => {
        try {
            if (!req.user || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const id = getRequiredParam(req.params, 'id');
            const group = await groupService.getById(req.user.organizationId, id);
            res.json({ data: group });
        } catch (error) {
            console.error('Error fetching group:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // POST /groups
    router.post('/', check(), async (req: Request, res: Response) => {
        try {
            if (!req.user || !req.user.organizationId || !req.user.id) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const group = await groupService.create(req.user.organizationId, req.body, req.user.id);
            res.status(201).json({ data: group });
        } catch (error) {
            console.error('Error creating group:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // PATCH /groups/:id
    router.patch('/:id', check(), async (req: Request, res: Response) => {
        try {
            if (!req.user || !req.user.organizationId || !req.user.id) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const id = getRequiredParam(req.params, 'id');
            const group = await groupService.update(req.user.organizationId, id, req.body, req.user.id);
            res.json({ data: group });
        } catch (error) {
            console.error('Error updating group:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // DELETE /groups/:id
    router.delete('/:id', check(), async (req: Request, res: Response) => {
        try {
            if (!req.user || !req.user.organizationId || !req.user.id) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const id = getRequiredParam(req.params, 'id');
            await groupService.delete(req.user.organizationId, id, req.user.id);
            res.status(204).send();
        } catch (error) {
            console.error('Error deleting group:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // POST /groups/:id/users - Add user to group
    router.post('/:id/users', check(), async (req: Request, res: Response) => {
        try {
            if (!req.user || !req.user.organizationId || !req.user.id) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const groupId = getRequiredParam(req.params, 'id');
            const { userId } = req.body;
            if (!userId) {
                res.status(400).json({ error: 'Bad Request', message: 'userId required' });
                return;
            }
            await groupService.addMember(req.user.organizationId, groupId, userId, req.user.id);
            res.status(201).json({ message: 'User added to group' });
        } catch (error) {
            console.error('Error adding user to group:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // DELETE /groups/:id/users/:userId - Remove user from group
    router.delete('/:id/users/:userId', check(), async (req: Request, res: Response) => {
        try {
            if (!req.user || !req.user.organizationId || !req.user.id) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const groupId = getRequiredParam(req.params, 'id');
            const userId = getRequiredParam(req.params, 'userId');
            await groupService.removeMember(req.user.organizationId, groupId, userId, req.user.id);
            res.status(204).send();
        } catch (error) {
            console.error('Error removing user from group:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    return router;
}
