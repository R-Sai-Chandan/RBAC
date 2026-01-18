
import { Router, Request, Response } from 'express';
import { IUserService } from '../services/user.service';
import { IEvaluationService } from '../services/evaluation.service';
import { IAuditService } from '../services/audit.service';
import { requirePermission } from '../middleware/requirePermission.middleware';
import { getRequiredParam } from './_paramUtils';

export function createUsersRouter(
    userService: IUserService,
    evaluationService: IEvaluationService,
    auditService: IAuditService
): Router {
    const router = Router();

    // SETTINGS:manage_users permission for all user management routes
    const check = () => requirePermission('SETTINGS', 'manage_users', evaluationService, auditService);

    // List Users
    router.get('/', check(), async (req: Request, res: Response) => {
        try {
            const users = await userService.list(req.user!.organizationId, req.query);
            res.json({ data: users });
        } catch (error) {
            console.error('List Users Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // Create User
    router.post('/', check(), async (req: Request, res: Response) => {
        try {
            const user = await userService.create(req.user!.organizationId, req.body);
            res.status(201).json({ data: user });
        } catch (error) {
            console.error('Create User Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // Get User
    router.get('/:id', check(), async (req: Request, res: Response) => {
        try {
            const id = getRequiredParam(req.params, 'id');
            const user = await userService.getById(req.user!.organizationId, id);
            if (!user) {
                res.status(404).json({ error: 'Not Found' });
                return;
            }
            res.json({ data: user });
        } catch (error) {
            console.error('Get User Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // Update User
    router.patch('/:id', check(), async (req: Request, res: Response) => {
        try {
            const id = getRequiredParam(req.params, 'id');
            const user = await userService.update(req.user!.organizationId, id, req.body);
            res.json({ data: user });
        } catch (error) {
            console.error('Update User Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // Delete User (Soft Delete)
    router.delete('/:id', check(), async (req: Request, res: Response) => {
        try {
            const id = getRequiredParam(req.params, 'id');
            await userService.delete(req.user!.organizationId, id);
            res.status(204).send();
        } catch (error) {
            console.error('Delete User Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    return router;
}
