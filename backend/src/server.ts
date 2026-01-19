
/**
 * RBAC Server Entry Point
 * 
 * Wires up all dependencies and strict routing.
 * Enforces the /rbac namespace.
 */

import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import cookieParser from 'cookie-parser';

// Repositories
import { UserRepository } from './rbac/repositories/user.repository';
import { AuthSessionRepository } from './rbac/repositories/auth_session.repository';
import { ModuleRepository } from './rbac/repositories/module.repository';
import { UserRoleRepository } from './rbac/repositories/user_role.repository';
import { UserGroupRepository } from './rbac/repositories/user_group.repository';
import { RoleRepository } from './rbac/repositories/role.repository';
import { RoleProfileRepository } from './rbac/repositories/role_profile.repository';
import { ProfileRepository } from './rbac/repositories/profile.repository';
import { ProfilePermissionRepository } from './rbac/repositories/profile_permission.repository';
import { PermissionRepository } from './rbac/repositories/permission.repository';
import { GroupRepository } from './rbac/repositories/group.repository';
import { SharingRuleRepository } from './rbac/repositories/sharing_rule.repository';
import { RecordShareRepository } from './rbac/repositories/record_share.repository';
import { SmtpConfigRepository } from './rbac/repositories/smtp_config.repository';
import { AuditLogRepository } from './rbac/repositories/audit_log.repository';

// Services
import { AuthSessionService } from './rbac/services/authSession.service';
import { EvaluationService } from './rbac/services/evaluation.service';
import { UserService } from './rbac/services/user.service';
import { RoleService } from './rbac/services/role.service';
import { PermissionService } from './rbac/services/permission.service';
import { ProfileService } from './rbac/services/profile.service';
import { GroupService } from './rbac/services/group.service';
import { SharingRuleService } from './rbac/services/sharingRule.service';
import { RecordShareService } from './rbac/services/recordShare.service';
import { SmtpConfigService } from './rbac/services/smtpConfig.service';
import { AuditService } from './rbac/services/audit.service';

// Router
import { createRBACRouter } from './rbac/routes';

// Configuration
const PORT = process.env.PORT || 3000;
const DB_CONFIG = {
    // In production, load from env
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/rbac_db' // Fallback for dev
};

async function startServer() {
    const app = express();

    // Middleware
    app.use(cors({
        origin: true, // Allow all for dev/demo, strict in prod
        credentials: true // Required for cookies
    }));
    app.use(express.json());
    app.use(cookieParser());

    // Database Connection
    const pool = new Pool(DB_CONFIG);

    // Dependency Injection - Repositories
    const userRepository = new UserRepository(pool);
    const authSessionRepository = new AuthSessionRepository(pool);
    const moduleRepository = new ModuleRepository(pool);
    const userRoleRepository = new UserRoleRepository(pool);
    const userGroupRepository = new UserGroupRepository(pool);
    const roleRepository = new RoleRepository(pool);
    const roleProfileRepository = new RoleProfileRepository(pool);
    const profileRepository = new ProfileRepository(pool);
    const profilePermissionRepository = new ProfilePermissionRepository(pool);
    const permissionRepository = new PermissionRepository(pool);
    const groupRepository = new GroupRepository(pool);
    const sharingRuleRepository = new SharingRuleRepository(pool);
    const recordShareRepository = new RecordShareRepository(pool);
    const smtpConfigRepository = new SmtpConfigRepository(pool);
    const auditLogRepository = new AuditLogRepository(pool);

    // Dependency Injection - Services
    // AuditService is foundational
    const auditService = new AuditService(auditLogRepository);
    const authSessionService = new AuthSessionService(authSessionRepository);

    // EvaluationService depends on many repos
    const evaluationService = new EvaluationService(
        userRepository,
        moduleRepository,
        userRoleRepository,
        roleProfileRepository,
        profilePermissionRepository,
        permissionRepository
    );

    const userService = new UserService(userRepository);

    // RoleService: (roleRepo, userRoleRepo, userRepo)
    const roleService = new RoleService(roleRepository, userRoleRepository, userRepository);

    // PermissionService: (permRepo, profileRepo, roleProfileRepo, profilePermRepo, moduleRepo, auditService)
    const permissionService = new PermissionService(
        permissionRepository,
        profileRepository,
        roleProfileRepository,
        profilePermissionRepository,
        moduleRepository,
        auditService
    );

    // ProfileService: (profileRepo, profilePermRepo, permRepo, auditService)
    const profileService = new ProfileService(
        profileRepository,
        profilePermissionRepository,
        permissionRepository,
        auditService
    );

    // GroupService: (groupRepo, userGroupRepo, auditService)
    const groupService = new GroupService(groupRepository, userGroupRepository, auditService);

    const sharingRuleService = new SharingRuleService(sharingRuleRepository);
    const recordShareService = new RecordShareService(recordShareRepository);
    const smtpConfigService = new SmtpConfigService(smtpConfigRepository);

    // MOUNTING The RBAC Router
    app.use('/rbac', createRBACRouter({
        authSessionService,
        evaluationService,
        auditService,
        userService,
        userRepository,
        userRoleRepository,
        roleService,
        profileService,
        groupService,
        sharingRuleService,
        smtpConfigService,
        permissionService,
        recordShareService
    }));

    // Health Check
    app.get('/health', (req, res) => res.json({ status: 'ok' }));

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`RBAC Module mounted at /rbac`);
    });
}

// Start if not imported (development)
if (require.main === module) {
    startServer().catch(console.error);
}

export { startServer };
