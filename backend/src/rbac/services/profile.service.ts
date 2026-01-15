/**
 * ProfileService
 * 
 * Service layer for Profile management.
 * OWNS: Profile lifecycle, profile-permission assignments, profile-role assignments
 * MUST NOT: Evaluate permissions, manage users directly, manage modules
 */

import { Profile } from '../models/profile.model';
import { Permission, PermissionAction } from '../models/permission.model';
import { ProfilePermissionEffect } from '../models/profile_permission.model';
import { IProfileRepository } from '../repositories/profile.repository';
import { IProfilePermissionRepository } from '../repositories/profile_permission.repository';
import { IPermissionRepository } from '../repositories/permission.repository';
import { IAuditService } from './audit.service';
import {
    ProfileNotFoundError,
    PermissionNotFoundError,
    DuplicateAssignmentError,
    RBACInternalError
} from '../errors/rbac.errors';
import { AuditAction, AuditStatus } from '../models/audit_log.model';

export interface IProfileService {
    /**
     * Get profile by ID
     * @throws ProfileNotFoundError
     */
    getById(organizationId: string, profileId: string): Promise<Profile>;

    /**
     * Get profile by code
     * @throws ProfileNotFoundError
     */
    getByCode(organizationId: string, code: string): Promise<Profile>;

    /**
     * List all profiles in organization
     */
    listAll(organizationId: string): Promise<Profile[]>;

    /**
     * List all active profiles in organization
     */
    listActive(organizationId: string): Promise<Profile[]>;

    /**
     * Create new profile
     * @throws DuplicateAssignmentError if code exists
     */
    create(
        organizationId: string,
        data: {
            name: string;
            code: string;
            description?: string;
            is_active?: boolean;
        },
        actingUserId: string
    ): Promise<Profile>;

    /**
     * Update profile
     * @throws ProfileNotFoundError
     */
    update(
        organizationId: string,
        profileId: string,
        data: Partial<Profile>,
        actingUserId: string
    ): Promise<Profile>;

    /**
     * Delete profile
     * @throws ProfileNotFoundError
     */
    delete(
        organizationId: string,
        profileId: string,
        actingUserId: string
    ): Promise<void>;

    /**
     * Assign permission to profile with effect
     * @throws ProfileNotFoundError
     * @throws PermissionNotFoundError
     * @throws DuplicateAssignmentError
     */
    assignPermission(
        organizationId: string,
        profileId: string,
        permissionId: string,
        effect: ProfilePermissionEffect,
        actingUserId: string
    ): Promise<void>;

    /**
     * Revoke permission from profile
     * @throws ProfileNotFoundError
     * @throws PermissionNotFoundError
     */
    revokePermission(
        organizationId: string,
        profileId: string,
        permissionId: string,
        actingUserId: string
    ): Promise<void>;

    /**
     * Get all permissions for a profile
     */
    getPermissions(organizationId: string, profileId: string): Promise<Array<{
        permission: Permission;
        effect: ProfilePermissionEffect;
    }>>;
}

/**
 * ProfileService Implementation
 */
export class ProfileService implements IProfileService {
    constructor(
        private readonly profileRepository: IProfileRepository,
        private readonly profilePermissionRepository: IProfilePermissionRepository,
        private readonly permissionRepository: IPermissionRepository,
        private readonly auditService: IAuditService
    ) { }

    async getById(organizationId: string, profileId: string): Promise<Profile> {
        // TODO_TEST: Verify profile retrieval
        const profile = await this.profileRepository.findById(organizationId, profileId);
        if (!profile) {
            throw new ProfileNotFoundError(organizationId, profileId);
        }
        return profile;
    }

    async getByCode(organizationId: string, code: string): Promise<Profile> {
        // TODO_TEST: Verify profile retrieval by code
        const profile = await this.profileRepository.findByCode(organizationId, code);
        if (!profile) {
            throw new ProfileNotFoundError(organizationId, code);
        }
        return profile;
    }

    async listAll(organizationId: string): Promise<Profile[]> {
        // TODO_TEST: Verify profile listing
        return await this.profileRepository.findAllByOrganization(organizationId);
    }

    async listActive(organizationId: string): Promise<Profile[]> {
        // TODO_TEST: Verify active profile listing
        return await this.profileRepository.findActiveByOrganization(organizationId);
    }

    async create(
        organizationId: string,
        data: {
            name: string;
            code: string;
            description?: string;
            is_active?: boolean;
        },
        actingUserId: string
    ): Promise<Profile> {
        // INVARIANT: Enforce profile creation workflows
        // WHY: Business workflow rules must be satisfied before creating profiles
        // TODO_IMPLEMENTATION: Add workflow validation logic

        const profileData: Omit<Profile, 'id' | 'organization_id' | 'created_at'> = {
            name: data.name,
            code: data.code,
            description: data.description || null,
            is_active: data.is_active ?? true,
            created_by: actingUserId
        };

        const profile = await this.profileRepository.create(organizationId, profileData);

        // INVARIANT: Audit profile lifecycle changes
        // WHY: All profile mutations must be logged for security audit trail
        await this.auditService.log(organizationId, {
            user_id: actingUserId,
            action: AuditAction.CREATE,
            entity_type: 'profile',
            entity_id: profile.id,
            new_values: profileData,
            status: AuditStatus.SUCCESS
        }).catch(err => console.error('Audit logging failed:', err));

        // TODO_TEST: Verify profile creation and audit logging
        return profile;
    }

    async update(
        organizationId: string,
        profileId: string,
        data: Partial<Profile>,
        actingUserId: string
    ): Promise<Profile> {
        // INVARIANT: Enforce profile activation workflows
        // WHY: Business workflow rules must be satisfied before activating profiles
        // TODO_IMPLEMENTATION: Add workflow validation logic

        const updated = await this.profileRepository.update(organizationId, profileId, data);

        // INVARIANT: Audit profile lifecycle changes
        // WHY: All profile mutations must be logged for security audit trail
        await this.auditService.log(organizationId, {
            user_id: actingUserId,
            action: AuditAction.UPDATE,
            entity_type: 'profile',
            entity_id: profileId,
            new_values: data,
            status: AuditStatus.SUCCESS
        }).catch(err => console.error('Audit logging failed:', err));

        // TODO_TEST: Verify profile update and audit logging
        return updated;
    }

    async delete(
        organizationId: string,
        profileId: string,
        actingUserId: string
    ): Promise<void> {
        await this.profileRepository.delete(organizationId, profileId);

        // INVARIANT: Audit profile lifecycle changes
        // WHY: All profile mutations must be logged for security audit trail
        await this.auditService.log(organizationId, {
            user_id: actingUserId,
            action: AuditAction.DELETE,
            entity_type: 'profile',
            entity_id: profileId,
            status: AuditStatus.SUCCESS
        }).catch(err => console.error('Audit logging failed:', err));

        // TODO_TEST: Verify profile deletion and audit logging
    }

    async assignPermission(
        organizationId: string,
        profileId: string,
        permissionId: string,
        effect: ProfilePermissionEffect,
        actingUserId: string
    ): Promise<void> {
        // INVARIANT: Prevent conflicting allow/deny rules
        // WHY: A profile cannot have both allow and deny for the same permission
        const existing = await this.profilePermissionRepository.findPermissionsByProfile(organizationId, profileId);
        const conflict = existing.find(pp => pp.permission_id === permissionId && pp.effect !== effect);

        if (conflict) {
            throw new RBACInternalError(
                `Conflicting permission effect: profile ${profileId} already has ${conflict.effect} for permission ${permissionId}`
            );
        }

        // INVARIANT: Enforce authorization for assigning permissions
        // WHY: Only authorized users should assign permissions
        // TODO_IMPLEMENTATION: Check authorization via EvaluationService

        await this.profilePermissionRepository.assign(organizationId, profileId, permissionId, effect);

        // TODO_TEST: Verify permission assignment and conflict prevention
    }

    async revokePermission(
        organizationId: string,
        profileId: string,
        permissionId: string,
        actingUserId: string
    ): Promise<void> {
        // INVARIANT: Enforce authorization for revoking permissions
        // WHY: Only authorized users should revoke permissions
        // TODO_IMPLEMENTATION: Check authorization via EvaluationService

        await this.profilePermissionRepository.revoke(organizationId, profileId, permissionId);

        // TODO_TEST: Verify permission revocation
    }

    async getPermissions(organizationId: string, profileId: string): Promise<Array<{
        permission: Permission;
        effect: ProfilePermissionEffect;
    }>> {
        // TODO_TEST: Verify profile permissions retrieval
        const assignments = await this.profilePermissionRepository.findPermissionsByProfile(organizationId, profileId);

        const result: Array<{ permission: Permission; effect: ProfilePermissionEffect }> = [];
        for (const assignment of assignments) {
            const permission = await this.permissionRepository.findById(organizationId, assignment.permission_id);
            if (permission) {
                result.push({ permission, effect: assignment.effect });
            }
        }

        return result;
    }
}
