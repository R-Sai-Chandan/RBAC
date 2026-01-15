/**
 * Roles Routes
 * 
 * HTTP endpoints for role management.
 * Delegates to RoleService for all business logic.
 */

import { Router, Request, Response } from 'express';
import { IRoleService } from '../services/role.service';
import { RoleNotFoundError, CircularRoleHierarchyError, DuplicateAssignmentError, UserNotFoundError, RBACInternalError } from '../errors/rbac.errors';
import { getRequiredParam } from './_paramUtils';

export function createRolesRouter(roleService: IRoleService): Router {
    const router = Router();

    // GET /roles - List all roles
    router.get('/', async (req: Request, res: Response) => {
        try {
            // RBAC RULE: Assert auth context
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
            const role = await roleService.getById(organizationId, id);
            res.json({ data: role });
        } catch (error) {
            if (error instanceof RoleNotFoundError) {
                res.status(404).json({ error: 'Not Found', message: error.message });
                return;
            }
            console.error('Error getting role:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // POST /roles - Create new role
    router.post('/', async (req: Request, res: Response) => {
        try {
            // RBAC RULE: Assert auth context
            if (!req.user || !req.user.id || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            const organizationId = req.user.organizationId;
            const actingUserId = req.user.id;

            const { name, code, description, parent_role_id, is_active } = req.body;
            if (!name || !code) {
                res.status(400).json({ error: 'Bad Request', message: 'name and code are required' });
                return;
            }

            const role = await roleService.create(
                organizationId,
                { name, code, description, parent_role_id, is_active },
                actingUserId
            );
            res.status(201).json({ data: role });
        } catch (error) {
            if (error instanceof DuplicateAssignmentError) {
                res.status(409).json({ error: 'Conflict', message: error.message });
                return;
            }
            if (error instanceof RoleNotFoundError) {
                res.status(404).json({ error: 'Not Found', message: error.message });
                return;
            }
            if (error instanceof CircularRoleHierarchyError) {
                res.status(400).json({ error: 'Bad Request', message: error.message });
                return;
            }
            console.error('Error creating role:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // PATCH /roles/:id - Update role
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
            const role = await roleService.update(organizationId, id, req.body);
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
            await roleService.delete(organizationId, id);
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

    // POST /roles/:id/users/:userId - Assign role to user
    router.post('/:id/users/:userId', async (req: Request, res: Response) => {
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

            await roleService.assignToUser(organizationId, id, userId, actingUserId);
            res.status(204).send();
        } catch (error) {
            if (error instanceof RoleNotFoundError || error instanceof UserNotFoundError) {
                res.status(404).json({ error: 'Not Found', message: error.message });
                return;
            }
            if (error instanceof DuplicateAssignmentError) {
                res.status(409).json({ error: 'Conflict', message: error.message });
                return;
            }
            console.error('Error assigning role to user:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // DELETE /roles/:id/users/:userId - Revoke role from user
    router.delete('/:id/users/:userId', async (req: Request, res: Response) => {
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
            await roleService.revokeFromUser(organizationId, id, userId);
            res.status(204).send();
        } catch (error) {
            if (error instanceof RoleNotFoundError || error instanceof UserNotFoundError) {
                res.status(404).json({ error: 'Not Found', message: error.message });
                return;
            }
            if (error instanceof RBACInternalError) {
                res.status(400).json({ error: 'Bad Request', message: error.message });
                return;
            }
            console.error('Error revoking role from user:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    return router;
}
