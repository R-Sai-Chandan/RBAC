/**
 * RBAC Custom Errors
 * 
 * Production-grade error classes for RBAC system.
 * All errors extend base RBACError for consistent handling.
 */

export class RBACError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * PermissionDeniedError
 * 
 * Thrown when user lacks required permission.
 * CRITICAL: This is the ONLY error that signals authorization failure.
 */
export class PermissionDeniedError extends RBACError {
    constructor(
        public readonly userId: string,
        public readonly organizationId: string,
        public readonly moduleCode: string,
        public readonly action: string,
        public readonly reason?: string
    ) {
        super(
            `Permission denied: User ${userId} cannot perform '${action}' on module '${moduleCode}'` +
            (reason ? `: ${reason}` : '')
        );
    }
}

/**
 * TenantMismatchError
 * 
 * Thrown when cross-organization access is attempted.
 * CRITICAL: This prevents data leakage across tenants.
 */
export class TenantMismatchError extends RBACError {
    constructor(
        public readonly expectedOrganizationId: string,
        public readonly actualOrganizationId: string,
        public readonly resource: string
    ) {
        super(
            `Tenant mismatch: Resource '${resource}' belongs to organization ${actualOrganizationId}, ` +
            `but request is for organization ${expectedOrganizationId}`
        );
    }
}

/**
 * InvalidModuleActionError
 * 
 * Thrown when invalid module code or action is requested.
 */
export class InvalidModuleActionError extends RBACError {
    constructor(
        public readonly moduleCode: string,
        public readonly action: string
    ) {
        super(`Invalid module/action combination: module='${moduleCode}', action='${action}'`);
    }
}

/**
 * RBACInternalError
 * 
 * Thrown when internal RBAC system error occurs.
 * CRITICAL: This signals system failure, not authorization failure.
 */
export class RBACInternalError extends RBACError {
    constructor(
        message: string,
        public readonly cause?: Error
    ) {
        super(`RBAC Internal Error: ${message}`);
        if (cause) {
            this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
        }
    }
}

/**
 * OrganizationNotFoundError
 */
export class OrganizationNotFoundError extends RBACError {
    constructor(public readonly organizationId: string) {
        super(`Organization not found: ${organizationId}`);
    }
}

/**
 * UserNotFoundError
 */
export class UserNotFoundError extends RBACError {
    constructor(
        public readonly organizationId: string,
        public readonly userId: string
    ) {
        super(`User not found: ${userId} in organization ${organizationId}`);
    }
}

/**
 * RoleNotFoundError
 */
export class RoleNotFoundError extends RBACError {
    constructor(
        public readonly organizationId: string,
        public readonly roleId: string
    ) {
        super(`Role not found: ${roleId} in organization ${organizationId}`);
    }
}

/**
 * ModuleNotFoundError
 */
export class ModuleNotFoundError extends RBACError {
    constructor(
        public readonly organizationId: string,
        public readonly moduleCode: string
    ) {
        super(`Module not found: ${moduleCode} in organization ${organizationId}`);
    }
}

/**
 * ProfileNotFoundError
 */
export class ProfileNotFoundError extends RBACError {
    constructor(
        public readonly organizationId: string,
        public readonly profileId: string
    ) {
        super(`Profile not found: ${profileId} in organization ${organizationId}`);
    }
}

/**
 * PermissionNotFoundError
 */
export class PermissionNotFoundError extends RBACError {
    constructor(
        public readonly organizationId: string,
        public readonly permissionId: string
    ) {
        super(`Permission not found: ${permissionId} in organization ${organizationId}`);
    }
}

/**
 * GroupNotFoundError
 */
export class GroupNotFoundError extends RBACError {
    constructor(
        public readonly organizationId: string,
        public readonly groupId: string
    ) {
        super(`Group not found: ${groupId} in organization ${organizationId}`);
    }
}

/**
 * CircularRoleHierarchyError
 */
export class CircularRoleHierarchyError extends RBACError {
    constructor(
        public readonly roleId: string,
        public readonly parentRoleId: string
    ) {
        super(`Circular role hierarchy detected: role ${roleId} cannot have parent ${parentRoleId}`);
    }
}

/**
 * DuplicateAssignmentError
 */
export class DuplicateAssignmentError extends RBACError {
    constructor(public readonly resource: string) {
        super(`Duplicate assignment: ${resource}`);
    }
}

