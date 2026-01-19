import { Router, Request, Response } from 'express';
import { IPermissionService } from '../services/permission.service';
import { PermissionNotFoundError, ModuleNotFoundError, RBACInternalError } from '../errors/rbac.errors';
import { getRequiredParam } from './_paramUtils';

export function createPermissionsRouter(permissionService: IPermissionService): Router {
    const router = Router();

    // GET /permissions - List all permissions
    router.get('/', async (req: Request, res: Response) => {
        try {
            // Context guaranteed by authenticate middleware
            const { organizationId } = req.user!;
            const permissions = await permissionService.listAllPermissions(organizationId);
            res.json({ data: permissions });
        } catch (error) {
            console.error('Error listing permissions:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // GET /permissions/:id - Get permission by ID
    router.get('/:id', async (req: Request, res: Response) => {
        try {
            // Context guaranteed by authenticate middleware
            const { organizationId } = req.user!;
            // PARAM SAFETY: Strict normalization
            const id = getRequiredParam(req.params, 'id');

            const permission = await permissionService.getPermissionById(organizationId, id);
            res.json({ data: permission });
        } catch (error) {
            if (error instanceof PermissionNotFoundError) {
                res.status(404).json({ error: 'Not Found', message: error.message });
                return;
            }
            console.error('Error getting permission:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // POST /permissions - Create new permission
    router.post('/', async (req: Request, res: Response) => {
        try {
            // Context guaranteed by authenticate middleware
            const { organizationId } = req.user!;
            const { module_id, action, description, is_active } = req.body;

            if (!module_id || !action) {
                res.status(400).json({ error: 'Bad Request', message: 'module_id and action are required' });
                return;
            }

            const permission = await permissionService.createPermission(organizationId, {
                module_id,
                action,
                description,
                is_active
            });
            res.status(201).json({ data: permission });
        } catch (error) {
            if (error instanceof ModuleNotFoundError) {
                res.status(404).json({ error: 'Not Found', message: error.message });
                return;
            }
            if (error instanceof RBACInternalError) {
                res.status(400).json({ error: 'Bad Request', message: error.message });
                return;
            }
            console.error('Error creating permission:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // PATCH /permissions/:id - Update permission
    router.patch('/:id', async (req: Request, res: Response) => {
        try {
            // Context guaranteed by authenticate middleware
            const { organizationId } = req.user!;
            // PARAM SAFETY: Strict normalization
            const id = getRequiredParam(req.params, 'id');

            const permission = await permissionService.updatePermission(organizationId, id, req.body);
            res.json({ data: permission });
        } catch (error) {
            if (error instanceof PermissionNotFoundError) {
                res.status(404).json({ error: 'Not Found', message: error.message });
                return;
            }
            if (error instanceof RBACInternalError) {
                res.status(400).json({ error: 'Bad Request', message: error.message });
                return;
            }
            console.error('Error updating permission:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // DELETE /permissions/:id - Delete permission
    router.delete('/:id', async (req: Request, res: Response) => {
        try {
            // Context guaranteed by authenticate middleware
            const { organizationId } = req.user!;
            // PARAM SAFETY: Strict normalization
            const id = getRequiredParam(req.params, 'id');

            await permissionService.deletePermission(organizationId, id);
            res.status(204).send();
        } catch (error) {
            if (error instanceof PermissionNotFoundError) {
                res.status(404).json({ error: 'Not Found', message: error.message });
                return;
            }
            console.error('Error deleting permission:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    return router;
}
