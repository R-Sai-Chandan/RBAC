/**
 * Roles Routes
 * 
 * HTTP endpoints for role management.
 * Authorization: SETTINGS:manage_roles permission required.
 */

import { Router, Request, Response } from 'express';
import { IRoleService } from '../services/role.service';
import { IEvaluationService } from '../services/evaluation.service';
import { IAuditService } from '../services/audit.service';
import { requirePermission } from '../middleware/requirePermission.middleware';
import { RoleNotFoundError, CircularRoleHierarchyError, DuplicateAssignmentError, UserNotFoundError } from '../errors/rbac.errors';
import { getRequiredParam } from './_paramUtils';

export function createRolesRouter(
    roleService: IRoleService,
    evaluationService: IEvaluationService,
    auditService: IAuditService
): Router {
    const router = Router();

    // SETTINGS:manage_roles permission for all role management routes
    const check = () => requirePermission('SETTINGS', 'manage_roles', evaluationService, auditService);

    // GET /roles - List all roles
    router.get('/', check(), async (req: Request, res: Response) => {
        try {
            if (!req.user || !req.user.id || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            const organizationId = req.user.organizationId;
            const roles = await roleService.listAll(organizationId);
            res.json({ data: roles });
        } catch (error) {
            console.error('Error listing roles:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // GET /roles/:id - Get role by ID
    router.get('/:id', check(), async (req: Request, res: Response) => {
        try {
            if (!req.user || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            const id = getRequiredParam(req.params, 'id');
            const role = await roleService.getById(req.user.organizationId, id);
            res.json({ data: role });
        } catch (error) {
            if (error instanceof RoleNotFoundError) {
                res.status(404).json({ error: 'Not Found', message: error.message });
                return;
            }
            console.error('Error fetching role:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // POST /roles - Create new role
    router.post('/', check(), async (req: Request, res: Response) => {
        try {
            if (!req.user || !req.user.id || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            const role = await roleService.create(req.user.organizationId, req.body, req.user.id);
            res.status(201).json({ data: role });
        } catch (error) {
            if (error instanceof CircularRoleHierarchyError) {
                res.status(400).json({ error: 'Bad Request', message: error.message });
                return;
            }
            console.error('Error creating role:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // PATCH /roles/:id - Update role
    router.patch('/:id', check(), async (req: Request, res: Response) => {
        try {
            if (!req.user || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            const id = getRequiredParam(req.params, 'id');
            const role = await roleService.update(req.user.organizationId, id, req.body);
            res.json({ data: role });
        } catch (error) {
            if (error instanceof RoleNotFoundError) {
                res.status(404).json({ error: 'Not Found', message: error.message });
                return;
            }
            if (error instanceof CircularRoleHierarchyError) {
                res.status(400).json({ error: 'Bad Request', message: error.message });
                return;
            }
            console.error('Error updating role:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // DELETE /roles/:id - Delete role
    router.delete('/:id', check(), async (req: Request, res: Response) => {
        try {
            if (!req.user || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            const id = getRequiredParam(req.params, 'id');
            await roleService.delete(req.user.organizationId, id);
            res.status(204).send();
        } catch (error) {
            if (error instanceof RoleNotFoundError) {
                res.status(404).json({ error: 'Not Found', message: error.message });
                return;
            }
            console.error('Error deleting role:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // POST /roles/:id/users - Assign user to role
    router.post('/:id/users', check(), async (req: Request, res: Response) => {
        try {
            if (!req.user || !req.user.id || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            const roleId = getRequiredParam(req.params, 'id');
            const { userId } = req.body;

            if (!userId) {
                res.status(400).json({ error: 'Bad Request', message: 'userId required' });
                return;
            }

            await roleService.assignToUser(req.user.organizationId, roleId, userId, req.user.id);
            res.status(201).json({ message: 'User assigned to role' });
        } catch (error) {
            if (error instanceof RoleNotFoundError || error instanceof UserNotFoundError) {
                res.status(404).json({ error: 'Not Found', message: error.message });
                return;
            }
            if (error instanceof DuplicateAssignmentError) {
                res.status(409).json({ error: 'Conflict', message: error.message });
                return;
            }
            console.error('Error assigning user to role:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // DELETE /roles/:id/users/:userId - Remove user from role
    router.delete('/:id/users/:userId', check(), async (req: Request, res: Response) => {
        try {
            if (!req.user || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            const roleId = getRequiredParam(req.params, 'id');
            const userId = getRequiredParam(req.params, 'userId');

            await roleService.revokeFromUser(req.user.organizationId, roleId, userId);
            res.status(204).send();
        } catch (error) {
            console.error('Error removing user from role:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    return router;
}
