/**
 * /rbac/me Routes
 * 
 * Identity and Navigation endpoints.
 * CRITICAL: Navigation uses SETTINGS as single admin entry point.
 */

import { Router, Request, Response } from 'express';
import { IUserRepository } from '../repositories/user.repository';
import { IUserRoleRepository } from '../repositories/user_role.repository';
import { IEvaluationService } from '../services/evaluation.service';

// Safe fallback landing page
const SAFE_FALLBACK_PAGE = '/rbac/profile';

// Valid landing pages (server-side validation)
const VALID_LANDING_PAGES = [
    '/rbac/profile',
    '/rbac/profile',
    '/rbac/users',
    '/rbac/roles',
    '/rbac/profiles',
    '/rbac/groups',
    '/rbac/sharing-rules',
    '/rbac/smtp-config',
    '/rbac/audit-logs'
];

export function createMeRouter(
    userRepository: IUserRepository,
    userRoleRepository: IUserRoleRepository,
    evaluationService: IEvaluationService
): Router {
    const router = Router();

    /**
     * GET /me
     * Return current user context and identity.
     * Validates defaultLandingPage server-side with safe fallback.
     */
    router.get('/', async (req: Request, res: Response) => {
        try {
            // Context guaranteed by authenticate middleware
            const { id: userId, organizationId } = req.user!;

            // 1. Fetch User
            const user = await userRepository.findById(organizationId, userId);
            if (!user) {
                res.status(404).json({ error: 'Not Found', message: 'User not found' });
                return;
            }

            // 2. Fetch Roles
            const userRoles = await userRoleRepository.findRolesByUser(organizationId, userId);
            const roleIds = userRoles.map(ur => ur.role_id);

            // 3. Validate defaultLandingPage server-side
            let landingPage = user.default_landing_page || SAFE_FALLBACK_PAGE;

            // Check if landing page is valid
            if (!VALID_LANDING_PAGES.includes(landingPage)) {
                landingPage = SAFE_FALLBACK_PAGE;
            }

            // Verify permission for the requested landing page
            // Map paths to (MODULE, ACTION) requirements
            const pathRequirements: { [key: string]: [string, string] } = {
                '/rbac/users': ['USERS', 'read'],
                '/rbac/roles': ['ROLES', 'read'],
                '/rbac/profiles': ['PROFILES', 'read'],
                '/rbac/groups': ['GROUPS', 'read'],
                '/rbac/sharing-rules': ['SHARING', 'read'],
                '/rbac/smtp-config': ['SMTP_CONFIG', 'read'],
                '/rbac/audit-logs': ['AUDIT', 'read']
            };

            const requirement = Object.entries(pathRequirements).find(([path]) => landingPage.startsWith(path));

            if (requirement) {
                const [_, [moduleCode, action]] = requirement;
                const decision = await evaluationService.evaluate(
                    organizationId, userId, moduleCode, action
                );
                if (!decision.granted) {
                    landingPage = SAFE_FALLBACK_PAGE;
                }
            }

            // 4. Construct Response
            const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();

            res.json({
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.secondary_email || user.primary_email,
                        fullName: fullName || user.username
                    },
                    organization: {
                        id: organizationId,
                        name: 'Organization' // Could fetch from org table
                    },
                    roles: roleIds,
                    defaultLandingPage: landingPage
                }
            });

        } catch (error) {
            console.error('Error fetching identity:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    /**
     * GET /me/navigation
     * Return authorized menu structure.
     * SETTINGS is the ONLY admin module with sub-sections.
     */
    router.get('/navigation', async (req: Request, res: Response) => {
        try {
            // Context guaranteed by authenticate middleware
            const { id: userId, organizationId } = req.user!;

            const modules: any[] = [];

            // 5. Build Navigation (Strict RBAC)
            // Group modules under 'RBAC' Product for UI
            const rbacProduct: any = {
                code: 'PRODUCT_RBAC',
                label: 'RBAC',
                route: '/rbac',
                icon: 'shield',
                isVisible: true,
                actions: ['read'],
                children: []
            };

            // Define RBAC modules and their required permissions
            const rbacModules = [
                { jsCode: 'USERS', label: 'Users', route: '/rbac/users', action: 'read' },
                { jsCode: 'ROLES', label: 'Roles', route: '/rbac/roles', action: 'read' },
                { jsCode: 'PROFILES', label: 'Profiles', route: '/rbac/profiles', action: 'read' },
                { jsCode: 'GROUPS', label: 'Groups', route: '/rbac/groups', action: 'read' },
                { jsCode: 'SHARING', label: 'Sharing Rules', route: '/rbac/sharing-rules', action: 'read' },
                { jsCode: 'SMTP_CONFIG', label: 'Email Settings', route: '/rbac/smtp-config', action: 'read' },
                { jsCode: 'AUDIT', label: 'Audit Logs', route: '/rbac/audit-logs', action: 'read' }
            ];

            // Evaluate permissions for each module
            for (const mod of rbacModules) {
                const decision = await evaluationService.evaluate(
                    organizationId, userId, mod.jsCode, mod.action
                );
                if (decision.granted) {
                    rbacProduct.children.push({
                        code: mod.jsCode,
                        label: mod.label,
                        route: mod.route,
                        isVisible: true,
                        actions: [mod.action]
                    });
                }
            }

            // Only show RBAC product if it has children
            if (rbacProduct.children.length > 0) {
                modules.push(rbacProduct);
            }

            res.json({ data: { modules } });

        } catch (error) {
            console.error('Error fetching navigation:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    /**
     * POST /me/change-password
     * Change current user's password.
     */
    router.post('/change-password', async (req: Request, res: Response) => {
        try {
            // Context guaranteed by authenticate middleware
            const { id: userId, organizationId } = req.user!;
            const { currentPassword, newPassword } = req.body;

            // Fetch user with password hash
            const user = await userRepository.findById(organizationId, userId);
            if (!user) {
                res.status(404).json({ error: 'Not Found', message: 'User not found' });
                return;
            }

            // Verify current password
            const bcrypt = require('bcrypt');
            const isValid = await bcrypt.compare(currentPassword, user.password_hash);
            if (!isValid) {
                res.status(401).json({ error: 'Unauthorized', message: 'Current password is incorrect' });
                return;
            }

            // Hash new password
            const newHash = await bcrypt.hash(newPassword, 10);

            // Update password (using repository update)
            await userRepository.update(organizationId, userId, { password_hash: newHash });

            res.json({ message: 'Password changed successfully' });

        } catch (error) {
            console.error('Error changing password:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    /**
     * PUT /me/preferences
     * Update user preferences (e.g., defaultLandingPage).
     */
    router.put('/preferences', async (req: Request, res: Response) => {
        try {
            // Context guaranteed by authenticate middleware
            const { id: userId, organizationId } = req.user!;
            const { defaultLandingPage } = req.body;

            // Validate landing page
            if (defaultLandingPage) {
                if (!VALID_LANDING_PAGES.includes(defaultLandingPage)) {
                    res.status(400).json({ error: 'Bad Request', message: 'Invalid landing page' });
                    return;
                }

                // Verify permission for the requested landing page
                const pathRequirements: { [key: string]: [string, string] } = {
                    '/rbac/users': ['USERS', 'read'],
                    '/rbac/roles': ['ROLES', 'read'],
                    '/rbac/profiles': ['PROFILES', 'read'],
                    '/rbac/groups': ['GROUPS', 'read'],
                    '/rbac/sharing-rules': ['SHARING', 'read'],
                    '/rbac/smtp-config': ['SMTP_CONFIG', 'read'],
                    '/rbac/audit-logs': ['AUDIT', 'read']
                };

                const requirement = Object.entries(pathRequirements).find(([path]) => defaultLandingPage.startsWith(path));

                if (requirement) {
                    const [_, [moduleCode, action]] = requirement;
                    const decision = await evaluationService.evaluate(
                        organizationId, userId, moduleCode, action
                    );
                    if (!decision.granted) {
                        res.status(403).json({ error: 'Forbidden', message: 'No access to selected landing page' });
                        return;
                    }
                }

                await userRepository.update(organizationId, userId, {
                    default_landing_page: defaultLandingPage
                });
            }

            res.json({ message: 'Preferences updated' });

        } catch (error) {
            console.error('Error updating preferences:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    return router;
}
