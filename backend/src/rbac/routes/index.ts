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
import { IPermissionService } from '../services/permission.service';
import { IRecordShareService } from '../services/recordShare.service';

// Routers
import { createPublicAuthRouter, createProtectedAuthRouter } from './authSessions.routes';
import { createMeRouter } from './me.routes';
import { createUsersRouter } from './users.routes';
import { createRolesRouter } from './roles.routes';
import { createProfilesRouter } from './profiles.routes';
import { createGroupsRouter } from './groups.routes';
import { createSharingRulesRouter } from './sharingRules.routes';
import { createSmtpConfigRouter } from './smtpConfig.routes';
import { createAuditLogsRouter } from './auditLogs.routes';
import { createPermissionsRouter } from './permissions.routes';
import { createRecordSharesRouter } from './recordShares.routes';

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
    permissionService: IPermissionService;
    recordShareService: IRecordShareService;
}

export function createRBACRouter(deps: RBACRouterDeps): Router {
    const router = Router();
    const authenticate = createAuthenticateMiddleware(deps.authSessionService);

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC ROUTES (No Auth Required)
    // ═══════════════════════════════════════════════════════════════════════
    const publicAuthRouter = createPublicAuthRouter(deps.authSessionService, deps.userRepository, deps.evaluationService);
    router.use('/auth', publicAuthRouter); // /rbac/auth/login

    // ═══════════════════════════════════════════════════════════════════════
    // PROTECTED ROUTES (Auth Required)
    // ═══════════════════════════════════════════════════════════════════════
    router.use(authenticate);

    // Protected Auth Routes (Logout, Sessions)
    const protectedAuthRouter = createProtectedAuthRouter(deps.authSessionService, deps.evaluationService);
    router.use('/auth', protectedAuthRouter); // /rbac/auth/logout, /rbac/auth/sessions

    // Identity & Navigation (Self-service, no admin permission required)
    router.use('/me', createMeRouter(deps.userRepository, deps.userRoleRepository, deps.evaluationService));

    // ═══════════════════════════════════════════════════════════════════════
    // ADMIN ROUTES (Auth + Module permissions required)
    // ═══════════════════════════════════════════════════════════════════════

    // USERS module
    router.use('/users', createUsersRouter(deps.userService, deps.evaluationService, deps.auditService));

    // ROLES module
    router.use('/roles', createRolesRouter(deps.roleService, deps.evaluationService, deps.auditService));

    // PROFILES module
    router.use('/profiles', createProfilesRouter(deps.profileService, deps.evaluationService, deps.auditService));

    // GROUPS module
    router.use('/groups', createGroupsRouter(deps.groupService, deps.evaluationService, deps.auditService));

    // SHARING module
    router.use('/sharing-rules', createSharingRulesRouter(deps.sharingRuleService, deps.evaluationService, deps.auditService));

    // SMTP_CONFIG module
    router.use('/smtp-config', createSmtpConfigRouter(deps.smtpConfigService, deps.evaluationService, deps.auditService));

    // AUDIT module
    router.use('/audit-logs', createAuditLogsRouter(deps.auditService, deps.evaluationService));

    // PERMISSIONS module (Admin)
    router.use('/permissions', createPermissionsRouter(deps.permissionService));

    // RECORD SHARES module (Admin)
    router.use('/record-shares', createRecordSharesRouter(deps.recordShareService));

    return router;
}
