/**
 * RBAC Module Entry Point
 * 
 * Public API for the RBAC module.
 * Exports services, middleware, and types for integration.
 */

// Services
export type { IEvaluationService, EvaluationService } from './services/evaluation.service';
export type { IRoleService, RoleService } from './services/role.service';
export type { IPermissionService, PermissionService } from './services/permission.service';
export type { IProfileService, ProfileService } from './services/profile.service';
export type { IGroupService, GroupService } from './services/group.service';
export type { ISharingRuleService, SharingRuleService } from './services/sharingRule.service';
export type { IRecordShareService, RecordShareService } from './services/recordShare.service';
export type { ISmtpConfigService, SmtpConfigService } from './services/smtpConfig.service';
export type { IAuthSessionService, AuthSessionService } from './services/authSession.service';
export type { IAuditService, AuditService } from './services/audit.service';

// Middleware
export type { requirePermission, RBACRequest } from './middleware/requirePermission.middleware';

// Types
export type { PermissionDecision, createDenyDecision, createAllowDecision } from './types/permission-decision';

// Errors
export type {
    RBACError,
    PermissionDeniedError,
    TenantMismatchError,
    InvalidModuleActionError,
    RBACInternalError,
    OrganizationNotFoundError,
    UserNotFoundError,
    RoleNotFoundError,
    ModuleNotFoundError,
    ProfileNotFoundError,
    PermissionNotFoundError,
    GroupNotFoundError,
    CircularRoleHierarchyError,
    DuplicateAssignmentError
} from './errors/rbac.errors';

// Models
export type { Role } from './models/role.model';
export type { Permission, PermissionAction } from './models/permission.model';
export type { Profile } from './models/profile.model';
export type { ProfilePermissionEffect } from './models/profile_permission.model';
export type { Group } from './models/group.model';
export type { SharingRule, SharingRuleType } from './models/sharing_rule.model';
export type { RecordShare } from './models/record_share.model';
export type { SmtpConfig, SmtpEncryption } from './models/smtp_config.model';
export type { AuthSession } from './models/auth_session.model';
export type { AuditLog, AuditAction, AuditStatus } from './models/audit_log.model';

// Routes
export type { createRolesRouter } from './routes/roles.routes';
export type { createPermissionsRouter } from './routes/permissions.routes';
export type { createProfilesRouter } from './routes/profiles.routes';
export type { createGroupsRouter } from './routes/groups.routes';
export type { createSharingRulesRouter } from './routes/sharingRules.routes';
export type { createRecordSharesRouter } from './routes/recordShares.routes';
export type { createSmtpConfigRouter } from './routes/smtpConfig.routes';
export type { createAuthSessionsRouter } from './routes/authSessions.routes';
