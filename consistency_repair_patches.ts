## 1. List of Inconsistencies Found & Repairs

    *   ** Inconsistency **: `RoleService` mutations(assignments) were NOT being logged to the central`AuditService`, relying only on database columns.The Guarantees require "Audit all role/profile/permission mutations" via the audit path.
    *   ** Repair **: Updated `RoleService` to inject `AuditService` and log 'ROLE_ASSIGN' events.
    *   ** Repair **: Updated `AuditService` to support mutation logging separate from permission decisions.
*   ** Inconsistency **: `PermissionDecision` timestamp was implicit.Documentation requires explicit`evaluatedAt` in the decision object.
    *   ** Repair **: Verified `PermissionService` includes`evaluatedAt`.
*   ** Inconsistency **: Documentation claimed "Role Creation" audit gap.
    *   ** Repair **: Confirmed gap exists in code(no create method), forcing documentation to strictly list it as a functional gap.

---

## 2. Corrected Code

### `src/rbac/services/audit.service.ts`

    ```typescript
/**
 * FILE: services/audit.service.ts
 * PURPOSE: Secure, structured logging of RBAC decisions and mutations.
 * LAYER: Services
 */

import { PermissionAction, PermissionDecision } from '../models/rbac.types';

export class AuditService {
  /**
   * Log an access evaluation decision (ALLOW/DENY).
   */
  public async logDecision(
    organizationId: string,
    userId: string,
    moduleCode: string,
    action: PermissionAction,
    decision: PermissionDecision,
    requestId?: string
  ): Promise<void> {
    try {
      const logEntry = {
        type: 'DECISION',
        timestamp: decision.evaluatedAt,
        organizationId,
        userId,
        module: moduleCode,
        action,
        allowed: decision.allowed,
        reason: decision.reason,
        source: decision.source,
        requestId
      };

      if (!decision.allowed) {
        console.warn(`[RBAC AUDIT]DENY`, JSON.stringify(logEntry));
      } else {
        console.info(`[RBAC AUDIT]ALLOW`, JSON.stringify(logEntry));
      }
    } catch (err) {
      console.error('[RBAC AUDIT FAILURE]', err);
    }
  }

  /**
   * Log a system mutation (Role Assignment, etc).
   */
  public async logMutation(
    organizationId: string,
    userId: string, // Actor
    targetId: string, // Target resource ID
    action: string,   // e.g. 'ASSIGN_ROLE'
    details?: Record<string, any>
  ): Promise<void> {
    try {
       const logEntry = {
        type: 'MUTATION',
        timestamp: new Date(),
        organizationId,
        actorId: userId,
        targetId,
        action,
        details
      };
      console.info(`[RBAC AUDIT]MUTATION`, JSON.stringify(logEntry));
    } catch (err) {
      console.error('[RBAC AUDIT FAILURE]', err);
    }
  }
}
```

### `src/rbac/services/role.service.ts`

    ```typescript
/**
 * FILE: services/role.service.ts
 * PURPOSE: Business logic for Role management.
 * LAYER: Services
 */

import { RoleRepository } from '../repositories/role.repository';
import { AuditService } from './audit.service'; // Added Dependency
import { Role } from '../models/rbac.types';

export class RoleService {
  constructor(
    private roleRepo: RoleRepository,
    private auditService: AuditService // Injected
  ) {}

  public async getUserRoles(organizationId: string, userId: string): Promise<Role[]> {
    return this.roleRepo.findEffectiveRolesByUserId(organizationId, userId);
  }

  public async assignRole(
    organizationId: string, 
    userId: string, 
    roleId: string, 
    assignedBy: string
  ): Promise<void> {
    // 1. Validation
    const role = await this.roleRepo.findById(organizationId, roleId);
    if (!role) {
      throw new Error('Role not found or invalid');
    }

    // 2. Execution
    await this.roleRepo.assignToUser({
      organization_id: organizationId,
      user_id: userId,
      role_id: roleId,
      assigned_at: new Date(),
      assigned_by: assignedBy
    });

    // 3. Audit (Guaranteed)
    await this.auditService.logMutation(
      organizationId,
      assignedBy,
      userId,
      'ASSIGN_ROLE',
      { roleId, roleCode: role.code }
    );
  }
}
```

### `src/rbac/container.ts`

    ```typescript
import { PermissionRepository } from './repositories/permission.repository';
import { RoleRepository } from './repositories/role.repository';
import { ProfileRepository } from './repositories/profile.repository';
import { ModuleRepository } from './repositories/module.repository';
import { PermissionService } from './services/permission.service';
import { RoleService } from './services/role.service';
import { AuditService } from './services/audit.service';

// 1. Instantiate Repositories
const permissionRepo = new PermissionRepository();
const roleRepo = new RoleRepository();
const profileRepo = new ProfileRepository();
const moduleRepo = new ModuleRepository();

// 2. Instantiate Base Services
const auditService = new AuditService();

// 3. Instantiate Domain Services
export const permissionService = new PermissionService(
  roleRepo,
  profileRepo,
  permissionRepo,
  moduleRepo,
  auditService
);

// REPAIR: Inject auditService into RoleService
export const roleService = new RoleService(roleRepo, auditService);

export const repos = {
  permission: permissionRepo,
  role: roleRepo,
  profile: profileRepo,
  module: moduleRepo
};
```
