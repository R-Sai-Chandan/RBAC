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

    return router;
}
