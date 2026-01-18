/**
 * RBAC Main Router
 * 
 * Aggregates all RBAC sub-routers.
 * Enforces global middleware for the /rbac namespace.
 * All admin routes require authentication + SETTINGS-based permissions.
 */

import { Router } from 'express';
import { IAuthSessionService } from '../services/authSession.service';
import { IEvaluationService } from '../services/evaluation.service';
import { IUserService } from '../services/user.service';
import { IAuditService } from '../services/audit.service';
import { IUserRepository } from '../repositories/user.repository';
import { IUserRoleRepository } from '../repositories/user_role.repository';
import { IRoleService } from '../services/role.service';
import { IProfileService } from '../services/profile.service';
import { IGroupService } from '../services/group.service';
import { ISharingRuleService } from '../services/sharingRule.service';
import { ISmtpConfigService } from '../services/smtpConfig.service';

// Routers
import { createAuthSessionsRouter } from './authSessions.routes';
import { createMeRouter } from './me.routes';
import { createUsersRouter } from './users.routes';
import { createRolesRouter } from './roles.routes';
import { createProfilesRouter } from './profiles.routes';
import { createGroupsRouter } from './groups.routes';
import { createSharingRulesRouter } from './sharingRules.routes';
import { createSmtpConfigRouter } from './smtpConfig.routes';
import { createAuditLogsRouter } from './auditLogs.routes';

// Middleware
import { createAuthenticateMiddleware } from '../middleware/authenticate.middleware';

// Factory Arguments
export interface RBACRouterDeps {
    authSessionService: IAuthSessionService;
    evaluationService: IEvaluationService;
    auditService: IAuditService;
    userService: IUserService;
    userRepository: IUserRepository;
    userRoleRepository: IUserRoleRepository;
    roleService: IRoleService;
    profileService: IProfileService;
    groupService: IGroupService;
    sharingRuleService: ISharingRuleService;
    smtpConfigService: ISmtpConfigService;
}

export function createRBACRouter(deps: RBACRouterDeps): Router {
    const router = Router();
    const authenticate = createAuthenticateMiddleware(deps.authSessionService);

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC ROUTES (No Auth Required)
    // ═══════════════════════════════════════════════════════════════════════
    const authRouter = createAuthSessionsRouter(deps.authSessionService, deps.userRepository);
    router.use('/auth', authRouter); // /rbac/auth/login, /rbac/auth/logout

    // ═══════════════════════════════════════════════════════════════════════
    // PROTECTED ROUTES (Auth Required)
    // ═══════════════════════════════════════════════════════════════════════
    router.use(authenticate);

    // Identity & Navigation (Self-service, no admin permission required)
    router.use('/me', createMeRouter(deps.userRepository, deps.userRoleRepository, deps.evaluationService));

    // ═══════════════════════════════════════════════════════════════════════
    // ADMIN ROUTES (Auth + SETTINGS permissions required)
    // All admin functionality is under SETTINGS module with sub-capabilities
    // ═══════════════════════════════════════════════════════════════════════

    // SETTINGS:manage_users
    router.use('/users', createUsersRouter(deps.userService, deps.evaluationService, deps.auditService));

    // SETTINGS:manage_roles
    router.use('/roles', createRolesRouter(deps.roleService, deps.evaluationService, deps.auditService));

    // SETTINGS:manage_profiles
    router.use('/profiles', createProfilesRouter(deps.profileService, deps.evaluationService, deps.auditService));

    // SETTINGS:manage_groups
    router.use('/groups', createGroupsRouter(deps.groupService, deps.evaluationService, deps.auditService));

    // SETTINGS:manage_sharing
    router.use('/sharing-rules', createSharingRulesRouter(deps.sharingRuleService, deps.evaluationService, deps.auditService));

    // SETTINGS:manage_smtp
    router.use('/smtp-config', createSmtpConfigRouter(deps.smtpConfigService, deps.evaluationService, deps.auditService));

    // SETTINGS:view_audit
    router.use('/audit-logs', createAuditLogsRouter(deps.auditService, deps.evaluationService));

    return router;
}
