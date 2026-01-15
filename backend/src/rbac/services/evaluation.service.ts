/**
 * EvaluationService
 * 
 * SINGLE AUTHORITATIVE SOURCE for all permission evaluation.
 * 
 * CRITICAL RULES:
 * - This is the ONLY service that makes permission decisions
 * - All permission checks MUST flow through this service
 * - Deny-by-default: No permission = DENY
 * - Deny-override: Any DENY = DENY (even if ALLOW exists)
 * - Returns PermissionDecision (not boolean)
 * - Fail-closed on errors
 */

import { PermissionDecision, createDenyDecision, createAllowDecision } from '../types/permission-decision';
import { IUserRepository } from '../repositories/user.repository';
import { IModuleRepository } from '../repositories/module.repository';
import {
    PermissionDeniedError,
    TenantMismatchError,
    InvalidModuleActionError,
    RBACInternalError,
    UserNotFoundError,
    ModuleNotFoundError
} from '../errors/rbac.errors';

export interface IEvaluationService {
    /**
     * Evaluate if user has permission for module/action
     * 
     * CRITICAL: This is the single authoritative permission check.
     * 
     * Algorithm:
     * 1. Validate inputs (organizationId, userId, moduleCode, action)
     * 2. Query: User -> Roles -> Profiles -> Permissions
     * 3. Collect all effects (allow/deny)
     * 4. If ANY deny exists: DENY
     * 5. If NO deny AND at least one allow: ALLOW
     * 6. Otherwise: DENY (fail-closed)
     * 
     * @throws TenantMismatchError if user not in organization
     * @throws InvalidModuleActionError if module/action invalid
     * @throws RBACInternalError on system failure
     */
    evaluate(
        organizationId: string,
        userId: string,
        moduleCode: string,
        action: string
    ): Promise<PermissionDecision>;

    /**
     * Batch evaluate multiple permissions for same user
     * 
     * More efficient than multiple evaluate() calls.
     * Returns decisions in same order as requests.
     */
    evaluateBatch(
        organizationId: string,
        userId: string,
        requests: Array<{ moduleCode: string; action: string }>
    ): Promise<PermissionDecision[]>;

    /**
     * Check if user has permission (throws on denial)
     * 
     * Convenience wrapper around evaluate() that throws PermissionDeniedError.
     * Use this in middleware/guards.
     * 
     * @throws PermissionDeniedError if access denied
     * @throws TenantMismatchError if user not in organization
     * @throws InvalidModuleActionError if module/action invalid
     * @throws RBACInternalError on system failure
     */
    enforcePermission(
        organizationId: string,
        userId: string,
        moduleCode: string,
        action: string
    ): Promise<void>;
}

/**
 * EvaluationService Implementation
 * 
 * CRITICAL: This is the ONLY place permission decisions are made.
 */
export class EvaluationService implements IEvaluationService {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly moduleRepository: IModuleRepository
        // TODO: Add repositories for roles, profiles, permissions when implementing full evaluation
    ) { }

    async evaluate(
        organizationId: string,
        userId: string,
        moduleCode: string,
        action: string
    ): Promise<PermissionDecision> {
        try {
            // FAIL-CLOSED: Validate user exists and belongs to organization
            const user = await this.userRepository.findById(organizationId, userId);
            if (!user) {
                return createDenyDecision(
                    userId,
                    organizationId,
                    moduleCode,
                    action,
                    'User not found'
                );
            }

            // FAIL-CLOSED: Validate user belongs to organization
            if (user.organization_id !== organizationId) {
                throw new TenantMismatchError(organizationId, user.organization_id, `user ${userId}`);
            }

            // FAIL-CLOSED: Validate module exists
            const module = await this.moduleRepository.findByCode(organizationId, moduleCode);
            if (!module) {
                throw new InvalidModuleActionError(moduleCode, action);
            }

            // TODO_IMPLEMENTATION: Query User -> Roles -> Profiles -> Permissions
            // This requires joining:
            // 1. user_roles to get user's roles
            // 2. role_profiles to get profiles for those roles
            // 3. profile_permissions to get permissions for those profiles
            // 4. permissions to get actual permission details
            // 5. Filter by moduleCode and action
            // 6. Collect all effects (allow/deny)

            // TODO_TEST: Verify permission evaluation logic
            // For now, FAIL-CLOSED: deny by default
            return createDenyDecision(
                userId,
                organizationId,
                moduleCode,
                action,
                'Permission evaluation not yet implemented'
            );

        } catch (error) {
            // Re-throw known errors
            if (
                error instanceof TenantMismatchError ||
                error instanceof InvalidModuleActionError
            ) {
                throw error;
            }

            // FAIL-CLOSED: Unknown error = deny
            console.error('Permission evaluation failed:', error);
            throw new RBACInternalError('Permission evaluation failed', error as Error);
        }
    }

    async evaluateBatch(
        organizationId: string,
        userId: string,
        requests: Array<{ moduleCode: string; action: string }>
    ): Promise<PermissionDecision[]> {
        // TODO_IMPLEMENTATION: Optimize with single query
        // For now, evaluate individually
        const decisions: PermissionDecision[] = [];
        for (const req of requests) {
            decisions.push(await this.evaluate(organizationId, userId, req.moduleCode, req.action));
        }
        return decisions;
    }

    async enforcePermission(
        organizationId: string,
        userId: string,
        moduleCode: string,
        action: string
    ): Promise<void> {
        const decision = await this.evaluate(organizationId, userId, moduleCode, action);

        if (!decision.granted) {
            throw new PermissionDeniedError(
                userId,
                organizationId,
                moduleCode,
                action,
                decision.reason
            );
        }
    }
}
