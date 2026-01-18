/**
 * Auth Sessions Routes
 * 
 * HTTP endpoints for authentication session management.
 * Includes Login and Logout flows.
 */

import { Router, Request, Response } from 'express';
import { IAuthSessionService } from '../services/authSession.service';
import { IUserRepository } from '../repositories/user.repository';
import { RBACInternalError } from '../errors/rbac.errors';
import { getRequiredParam } from './_paramUtils';
import { verifyPassword } from '../utils/crypto.utils';

export function createAuthSessionsRouter(
    authSessionService: IAuthSessionService,
    userRepository: IUserRepository
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

            // 3. Verify Status
            if (user.status !== 'active') {
                res.status(401).json({ error: 'Unauthorized', message: 'Account inactive' });
                return;
            }

            // 4. Verify Password
            if (!user.password_hash) {
                res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
                return;
            }

            const isValid = await verifyPassword(password, user.password_hash);
            if (!isValid) {
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

            // 7. Return User Context
            const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
            res.status(201).json({
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        fullName: fullName || user.username,
                        email: user.primary_email
                    }
                }
            });

        } catch (error) {
            console.error('Login Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // POST /logout - Logout current session
    // Requires Authentication Middleware to have run
    router.post('/logout', async (req: Request, res: Response) => {
        try {
            // RBAC RULE: Assert auth context
            if (!req.user || !req.user.id || !req.user.organizationId || !req.user.sessionId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            await authSessionService.logout(req.user.organizationId, req.user.sessionId);

            // Clear Cookie
            res.clearCookie('sessionId', { path: '/rbac' });

            res.status(200).json({ message: 'Logged out successfully' });

        } catch (error) {
            console.error('Logout Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // ------------------------------------------------------------
    // ADMIN / MANAGEMENT ROUTES (Requires scoped permissions + auth)
    // ------------------------------------------------------------

    // GET /auth-sessions - List sessions for current user
    router.get('/', async (req: Request, res: Response) => {
        try {
            if (!req.user || !req.user.id || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            const sessions = await authSessionService.listActiveByUser(req.user.organizationId, req.user.id);
            res.json({ data: sessions });
        } catch (error) {
            console.error('Error listing auth sessions:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // GET /auth-sessions/:id - Get session by ID
    router.get('/:id', async (req: Request, res: Response) => {
        try {
            if (!req.user || !req.user.id || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            const id = getRequiredParam(req.params, 'id');
            const session = await authSessionService.getById(req.user.organizationId, id);

            // SECURITY: Ensure user owns this session OR has admin permission (omitted for now)
            if (session.user_id !== req.user.id) {
                res.status(403).json({ error: 'Forbidden', message: 'Access denied to this session' });
                return;
            }

            res.json({ data: session });
        } catch (error) {
            if (error instanceof RBACInternalError) {
                res.status(404).json({ error: 'Not Found', message: error.message });
                return;
            }
            console.error('Error getting auth session:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // DELETE /auth-sessions/:id - Revoke session
    router.delete('/:id', async (req: Request, res: Response) => {
        try {
            if (!req.user || !req.user.id || !req.user.organizationId) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing user context' });
                return;
            }

            const id = getRequiredParam(req.params, 'id');

            // SECURITY: Ensure user owns this session OR has admin permission
            // For now, restrictive Owner-Only unless expanded
            const session = await authSessionService.getById(req.user.organizationId, id);
            if (session.user_id !== req.user.id) {
                res.status(403).json({ error: 'Forbidden', message: 'Access denied to this session' });
                return;
            }

            await authSessionService.revoke(req.user.organizationId, id, req.user.id);
            res.status(204).send();
        } catch (error) {
            console.error('Error revoking session:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    return router;
}
