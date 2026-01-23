/**
 * Auth Sessions Routes
 * 
 * HTTP endpoints for authentication session management.
 * Split into Public (Login) and Protected (Logout, Management) routers.
 */

import { Router, Request, Response } from 'express';
import { IAuthSessionService } from '../services/authSession.service';
import { IUserRepository } from '../repositories/user.repository';
import { RBACInternalError } from '../errors/rbac.errors';
import { getRequiredParam } from './_paramUtils';
import { verifyPassword } from '../utils/crypto.utils';
import { UserStatus } from '../models/user.model';
import { IEvaluationService } from '../services/evaluation.service';
import { validateLandingPage } from '../utils/landingPage.utils';

// ---------------------------------------------------------------------------
// PUBLIC ROUTER (Login) - No Authentication Required
// ---------------------------------------------------------------------------
export function createPublicAuthRouter(
    authSessionService: IAuthSessionService,
    userRepository: IUserRepository,
    evaluationService: IEvaluationService
): Router {
    const router = Router();

    // PUBLIC: Login
    router.post('/login', async (req: Request, res: Response) => {
        try {
            const { identifier, username, password } = req.body;
            const loginIdentifier = identifier || username;

            // 1. Basic Validation
            if (!loginIdentifier || !password) {
                res.status(400).json({
                    error: 'Bad Request',
                    message: 'Missing credentials. Required: identifier/username, password'
                });
                return;
            }

            // 2. Find User globally (across all orgs)
            let user = await userRepository.findByUsernameGlobal(loginIdentifier);
            if (!user) {
                user = await userRepository.findByEmailGlobal(loginIdentifier);
            }
            if (!user) {
                res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
                return;
            }

            const organizationId = user.organization_id;

            // 3. Verify Password FIRST
            if (!user.password_hash) {
                res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
                return;
            }

            const isValid = await verifyPassword(password, user.password_hash);
            if (!isValid) {
                res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
                return;
            }

            // 4. Verify Status
            if (user.status === UserStatus.DELETED) {
                res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
                return;
            }

            if (user.status === UserStatus.INACTIVE) {
                res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
                return;
            }


            // 5. Create Session
            const userAgent = req.get('user-agent');
            const session = await authSessionService.create(organizationId, {
                user_id: user.id,
                ...(req.ip ? { ip_address: req.ip } : {}),
                ...(userAgent ? { user_agent: userAgent } : {})
            });

            // 6. Set HTTP-Only Cookie
            const isProd = process.env.NODE_ENV === 'production';
            res.cookie('sessionId', session.id, {
                httpOnly: true,
                secure: isProd,
                sameSite: 'strict',
                path: '/rbac',
                maxAge: 24 * 60 * 60 * 1000
            });

            // 7. Validate and determine default landing page
            const landingPage = await validateLandingPage(
                user.default_landing_page,
                organizationId,
                user.id,
                evaluationService
            );

            // 8. Return User Context with landing page
            const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
            res.status(201).json({
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        fullName: fullName || user.username,
                        email: user.primary_email
                    },
                    defaultLandingPage: landingPage
                }
            });

        } catch (error) {
            console.error('Login Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    return router;
}

// ---------------------------------------------------------------------------
// PROTECTED ROUTER (Logout, Management) - Authentication Required
// ---------------------------------------------------------------------------
export function createProtectedAuthRouter(
    authSessionService: IAuthSessionService,
    evaluationService: IEvaluationService
): Router {
    const router = Router();

    // POST /logout - Logout current session
    router.post('/logout', async (req: Request, res: Response) => {
        try {
            const { organizationId, sessionId } = req.user!;

            if (!sessionId) {
                res.status(400).json({ error: 'Bad Request', message: 'No session context' });
                return;
            }

            await authSessionService.logout(organizationId, sessionId);

            // Clear Cookie
            res.clearCookie('sessionId', { path: '/rbac' });

            res.status(200).json({ message: 'Logged out successfully' });

        } catch (error) {
            console.error('Logout Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // GET /auth-sessions - List sessions for current user
    router.get('/sessions', async (req: Request, res: Response) => {
        try {
            const { id: userId, organizationId } = req.user!;

            const sessions = await authSessionService.listActiveByUser(organizationId, userId);
            res.json({ data: sessions });
        } catch (error) {
            console.error('Error listing auth sessions:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // GET /auth-sessions/:id - Get session by ID
    // GET /auth-sessions/:id - Get session by ID
    router.get('/sessions/:id', async (req: Request, res: Response) => {
        try {
            const { id: userId, organizationId } = req.user!;
            const sessionId = getRequiredParam(req.params, 'id');

            // 1. Fetch session (scoped to org)
            const session = await authSessionService.getById(organizationId, sessionId);

            // 2. Owner shortcut
            if (session.user_id === userId) {
                res.json({ data: session });
                return;
            }

            // 3. Not owner → require READ permission
            await evaluationService.enforcePermission(
                organizationId,
                userId,
                'AUTH_SESSIONS',
                'read'
            );

            // 4. Allowed via permission
            res.json({ data: session });

        } catch (error) {
            if (error instanceof RBACInternalError) {
                res.status(404).json({ error: 'Not Found', message: error.message });
                return;
            }
            console.error('Error getting auth session:', error);
            res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
        }
    });


    // DELETE /auth-sessions/:id - Revoke session
    router.delete('/sessions/:id', async (req: Request, res: Response) => {
        try {
            const { id: userId, organizationId } = req.user!;

            const id = getRequiredParam(req.params, 'id');
            const session = await authSessionService.getById(organizationId, id);

            // Owner shortcut
            if (session.user_id === userId) {
                await authSessionService.revoke(organizationId, id, userId);
                res.status(204).send();
                return;
            }

            // Not owner → require DELETE permission
            await evaluationService.enforcePermission(
                organizationId,
                userId,
                'AUTH_SESSIONS',
                'delete'
            );

            // Allowed via permission
            await authSessionService.revoke(organizationId, id, userId);
            res.status(204).send();

        } catch (error) {
            console.error('Error revoking session:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    return router;
}
