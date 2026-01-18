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
    '/rbac/settings',
    '/rbac/settings/users',
    '/rbac/settings/roles',
    '/rbac/settings/profiles',
    '/rbac/settings/groups',
    '/rbac/settings/sharing',
    '/rbac/settings/smtp',
    '/rbac/settings/audit'
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
            if (!req.user || !req.user.id || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            const organizationId = req.user.organizationId;
            const userId = req.user.id;

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

            // If landing page requires SETTINGS access, verify permission
            if (landingPage.startsWith('/rbac/settings')) {
                const settingsDecision = await evaluationService.evaluate(
                    organizationId, userId, 'SETTINGS', 'read'
                );
                if (!settingsDecision.granted) {
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
            if (!req.user || !req.user.id || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            const organizationId = req.user.organizationId;
            const userId = req.user.id;

            const modules: any[] = [];

            // SETTINGS is the ONLY admin module
            const settingsReadDecision = await evaluationService.evaluate(
                organizationId, userId, 'SETTINGS', 'read'
            );

            if (settingsReadDecision.granted) {
                const settingsModule: any = {
                    code: 'SETTINGS',
                    label: 'Settings',
                    route: '/rbac/settings',
                    icon: 'settings',
                    isVisible: true,
                    actions: ['read'],
                    children: []
                };

                // Sub-capabilities under SETTINGS
                const subCapabilities = [
                    { action: 'manage_users', label: 'Users', route: '/rbac/settings/users' },
                    { action: 'manage_roles', label: 'Roles', route: '/rbac/settings/roles' },
                    { action: 'manage_profiles', label: 'Profiles', route: '/rbac/settings/profiles' },
                    { action: 'manage_groups', label: 'Groups', route: '/rbac/settings/groups' },
                    { action: 'manage_sharing', label: 'Sharing Rules', route: '/rbac/settings/sharing' },
                    { action: 'manage_smtp', label: 'Email Settings', route: '/rbac/settings/smtp' },
                    { action: 'view_audit', label: 'Audit Logs', route: '/rbac/settings/audit' }
                ];

                for (const sub of subCapabilities) {
                    const decision = await evaluationService.evaluate(
                        organizationId, userId, 'SETTINGS', sub.action
                    );
                    if (decision.granted) {
                        settingsModule.children.push({
                            code: `SETTINGS_${sub.action.toUpperCase()}`,
                            label: sub.label,
                            route: sub.route,
                            isVisible: true,
                            actions: [sub.action]
                        });
                    }
                }

                // Only show SETTINGS if user has at least read access
                modules.push(settingsModule);
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
            if (!req.user || !req.user.id || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                res.status(400).json({ error: 'Bad Request', message: 'currentPassword and newPassword required' });
                return;
            }

            // Validate password strength (basic)
            if (newPassword.length < 8) {
                res.status(400).json({ error: 'Bad Request', message: 'Password must be at least 8 characters' });
                return;
            }

            const organizationId = req.user.organizationId;
            const userId = req.user.id;

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
            if (!req.user || !req.user.id || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            const { defaultLandingPage } = req.body;
            const organizationId = req.user.organizationId;
            const userId = req.user.id;

            // Validate landing page
            if (defaultLandingPage) {
                if (!VALID_LANDING_PAGES.includes(defaultLandingPage)) {
                    res.status(400).json({ error: 'Bad Request', message: 'Invalid landing page' });
                    return;
                }

                // If page requires SETTINGS, verify permission
                if (defaultLandingPage.startsWith('/rbac/settings')) {
                    const decision = await evaluationService.evaluate(
                        organizationId, userId, 'SETTINGS', 'read'
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
