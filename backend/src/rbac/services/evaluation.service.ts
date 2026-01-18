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
import { IUserRoleRepository } from '../repositories/user_role.repository';
import { IRoleProfileRepository } from '../repositories/role_profile.repository';
import { IProfilePermissionRepository } from '../repositories/profile_permission.repository';
import { IPermissionRepository } from '../repositories/permission.repository';
import {
    PermissionDeniedError,
    TenantMismatchError,
    InvalidModuleActionError,
    RBACInternalError,
    RBACError
} from '../errors/rbac.errors';
import { ProfilePermissionEffect } from '../models/profile_permission.model';
import { PermissionAction } from '../models/permission.model';

export interface IEvaluationService {
    /**
     * Evaluate if user has permission for module/action
     * @see EvaluationService.evaluate
     */
    evaluate(
        organizationId: string,
        userId: string,
        moduleCode: string,
        action: string
    ): Promise<PermissionDecision>;

    /**
     * Batch evaluate multiple permissions
     */
    evaluateBatch(
        organizationId: string,
        userId: string,
        requests: Array<{ moduleCode: string; action: string }>
    ): Promise<PermissionDecision[]>;

    /**
     * Check if user has permission (throws on denial)
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
        private readonly moduleRepository: IModuleRepository,
        private readonly userRoleRepository: IUserRoleRepository,
        private readonly roleProfileRepository: IRoleProfileRepository,
        private readonly profilePermissionRepository: IProfilePermissionRepository,
        private readonly permissionRepository: IPermissionRepository
    ) { }

    async evaluate(
        organizationId: string,
        userId: string,
        moduleCode: string,
        action: string
    ): Promise<PermissionDecision> {
        try {
            // 1. Validate Context & Inputs
            const user = await this.userRepository.findById(organizationId, userId);
            if (!user) {
                return createDenyDecision(userId, organizationId, moduleCode, action, 'User not found');
            }
            if (user.organization_id !== organizationId) {
                throw new TenantMismatchError(organizationId, user.organization_id, `user ${userId}`);
            }

            // 2. Validate Module
            const module = await this.moduleRepository.findByCode(organizationId, moduleCode);
            if (!module) {
                throw new InvalidModuleActionError(moduleCode, action);
            }

            // 3. Resolve Roles
            const userRoles = await this.userRoleRepository.findRolesByUser(organizationId, userId);
            if (userRoles.length === 0) {
                return createDenyDecision(userId, organizationId, moduleCode, action, 'User has no roles');
            }

            // 4. Resolve Profiles through Roles
            const profileIds = new Set<string>();
            for (const userRole of userRoles) {
                const roleProfiles = await this.roleProfileRepository.findProfilesByRole(organizationId, userRole.role_id);
                roleProfiles.forEach(rp => profileIds.add(rp.profile_id));
            }

            if (profileIds.size === 0) {
                return createDenyDecision(userId, organizationId, moduleCode, action, 'User roles have no profiles');
            }

            // 5. Resolve Permissions matching Module/Action
            // Strategy:
            // - Find the Permission definition for "Module + Action"
            // - Use that PermissionID to find if it's assigned to any of the user's Profiles
            // - Check Effects (Deny vs Allow)

            // 5a. Find Target Permission Definition
            const targetPermission = await this.permissionRepository.findByModuleAndAction(
                organizationId,
                module.id,
                action as PermissionAction // Assertion assuming action string is valid PermissionAction
            );

            if (!targetPermission) {
                // If permission definition doesn't exist in DB, nobody can have it.
                // Fail safe: DENY
                return createDenyDecision(userId, organizationId, moduleCode, action, 'Permission definition not found');
            }

            // 5b. Check Assignments across all Profiles
            let explicitAllow = false;
            let explicitDeny = false;

            for (const profileId of profileIds) {
                const assignment = await this.profilePermissionRepository.findAssignment(
                    organizationId,
                    profileId,
                    targetPermission.id
                );

                if (assignment) {
                    if (assignment.effect === ProfilePermissionEffect.DENY) {
                        explicitDeny = true;
                        // Optimization: Fail fast on first DENY?
                        // "Deny-override: Any DENY = DENY".
                        // Yes, we can break early if we find a DENY.
                        break;
                    }
                    if (assignment.effect === ProfilePermissionEffect.ALLOW) {
                        explicitAllow = true;
                    }
                }
            }

            // 6. Make Decision
            if (explicitDeny) {
                return createDenyDecision(userId, organizationId, moduleCode, action, 'Explicit DENY in profile');
            }

            if (explicitAllow) {
                return createAllowDecision(userId, organizationId, moduleCode, action, 'Explicit allow found');
            }

            // Default: DENY
            return createDenyDecision(userId, organizationId, moduleCode, action, 'No matching ALLOW permission');

        } catch (error) {
            // Re-throw specific domain errors
            if (error instanceof RBACError) {
                if (error instanceof RBACInternalError) throw error;
                if (error instanceof TenantMismatchError) throw error;
                if (error instanceof InvalidModuleActionError) throw error;
                // For other RBAC errors, treat as system failure or fall through to closed
            }

            console.error('Permission evaluation failed:', error);
            throw new RBACInternalError('Permission evaluation failed', error as Error);
        }
    }

    async evaluateBatch(
        organizationId: string,
        userId: string,
        requests: Array<{ moduleCode: string; action: string }>
    ): Promise<PermissionDecision[]> {
        // TODO: Optimize with batch queries if performance becomes an issue
        const decisions: PermissionDecision[] = [];
        for (const req of requests) {
            try {
                decisions.push(await this.evaluate(organizationId, userId, req.moduleCode, req.action));
            } catch (error) {
                // For batch, we probably want to return individual failures as Denials rather than blowing up the whole batch?
                // Or throw strictly? 
                // Decision: Fail closed for individual item.
                decisions.push(createDenyDecision(userId, organizationId, req.moduleCode, req.action, 'Evaluation Error'));
            }
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
            // AUDIT: Log denial (Non-blocking)
            // In production, call this.auditService.log(...)
            // Requirement: "Ensure audit logging never blocks the request"
            // We use setTimeout or fire-and-forget promise if we had a service.
            // Here we strictly log to stdout for audit capture.
            console.log(`[AUDIT_DENIAL] User: ${userId}, Org: ${organizationId}, Module: ${moduleCode}, Action: ${action}, Reason: ${decision.reason}`);

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
