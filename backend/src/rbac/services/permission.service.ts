/**
 * PermissionService
 * 
 * Business logic for permission and profile management.
 * NO permission evaluation logic here.
 */

import { Permission, PermissionAction } from '../models/permission.model';
import { Profile } from '../models/profile.model';
import { ProfilePermissionEffect } from '../models/profile_permission.model';
import { IPermissionRepository } from '../repositories/permission.repository';
import { IProfileRepository } from '../repositories/profile.repository';
import { IRoleProfileRepository } from '../repositories/role_profile.repository';
import { IProfilePermissionRepository } from '../repositories/profile_permission.repository';
import { IModuleRepository } from '../repositories/module.repository';
import { IAuditService } from './audit.service';
import {
    PermissionNotFoundError,
    ProfileNotFoundError,
    DuplicateAssignmentError,
    ModuleNotFoundError,
    RoleNotFoundError,
    RBACInternalError
} from '../errors/rbac.errors';
import { AuditAction, AuditStatus } from '../models/audit_log.model';

export interface IPermissionService {
    /**
     * Get permission by ID
     * @throws PermissionNotFoundError
     */
    getPermissionById(organizationId: string, permissionId: string): Promise<Permission>;

    /**
     * Get permission by module and action
     * @throws PermissionNotFoundError
     */
    getPermissionByModuleAction(
        organizationId: string,
        moduleCode: string,
        action: PermissionAction
    ): Promise<Permission>;

    /**
     * List all permissions for module
     */
    listPermissionsByModule(organizationId: string, moduleCode: string): Promise<Permission[]>;

    /**
     * List all permissions in organization
     */
    listAllPermissions(organizationId: string): Promise<Permission[]>;

    /**
     * Create permission
     * @throws DuplicateAssignmentError
     * @throws ModuleNotFoundError
     */
    createPermission(
        organizationId: string,
        data: {
            module_id: string;
            action: PermissionAction;
            description?: string;
            is_active?: boolean;
        }
    ): Promise<Permission>;

    /**
     * Update permission
     * @throws PermissionNotFoundError
     */
    updatePermission(
        organizationId: string,
        permissionId: string,
        data: Partial<Permission>
    ): Promise<Permission>;

    /**
     * Delete permission
     * @throws PermissionNotFoundError
     */
    deletePermission(organizationId: string, permissionId: string): Promise<void>;

    /**
     * Get profile by ID
     * @throws ProfileNotFoundError
     */
    getProfileById(organizationId: string, profileId: string): Promise<Profile>;

    /**
     * Get profile by code
     * @throws ProfileNotFoundError
     */
    getProfileByCode(organizationId: string, code: string): Promise<Profile>;

    /**
     * List all profiles
     */
    listAllProfiles(organizationId: string): Promise<Profile[]>;

    /**
     * Create profile
     * @throws DuplicateAssignmentError
     */
    createProfile(
        organizationId: string,
        data: {
            name: string;
            code: string;
            description?: string;
            is_active?: boolean;
        },
        createdBy?: string
    ): Promise<Profile>;

    /**
     * Update profile
     * @throws ProfileNotFoundError
     */
    updateProfile(
        organizationId: string,
        profileId: string,
        data: Partial<Profile>
    ): Promise<Profile>;

    /**
     * Delete profile
     * @throws ProfileNotFoundError
     */
    deleteProfile(organizationId: string, profileId: string): Promise<void>;

    /**
     * Assign permission to profile with effect
     * @throws ProfileNotFoundError
     * @throws PermissionNotFoundError
     * @throws DuplicateAssignmentError
     */
    assignPermissionToProfile(
        organizationId: string,
        profileId: string,
        permissionId: string,
        effect: ProfilePermissionEffect
    ): Promise<void>;

    /**
     * Revoke permission from profile
     * @throws ProfileNotFoundError
     * @throws PermissionNotFoundError
     */
    revokePermissionFromProfile(
        organizationId: string,
        profileId: string,
        permissionId: string
    ): Promise<void>;

    /**
     * Assign profile to role
     * @throws ProfileNotFoundError
     * @throws RoleNotFoundError
     * @throws DuplicateAssignmentError
     */
    assignProfileToRole(
        organizationId: string,
        profileId: string,
        roleId: string,
        assignedBy?: string
    ): Promise<void>;

    /**
     * Revoke profile from role
     * @throws ProfileNotFoundError
     * @throws RoleNotFoundError
     */
    revokeProfileFromRole(
        organizationId: string,
        profileId: string,
        roleId: string
    ): Promise<void>;

    /**
     * Get all permissions for a profile
     */
    getProfilePermissions(organizationId: string, profileId: string): Promise<Array<{
        permission: Permission;
        effect: ProfilePermissionEffect;
    }>>;

    /**
     * Get all profiles for a role
     */
    getRoleProfiles(organizationId: string, roleId: string): Promise<Profile[]>;
}

/**
 * PermissionService Implementation
 */
export class PermissionService implements IPermissionService {
    constructor(
        private readonly permissionRepository: IPermissionRepository,
        private readonly profileRepository: IProfileRepository,
        private readonly roleProfileRepository: IRoleProfileRepository,
        private readonly profilePermissionRepository: IProfilePermissionRepository,
        private readonly moduleRepository: IModuleRepository,
        private readonly auditService: IAuditService
    ) { }

    async getPermissionById(organizationId: string, permissionId: string): Promise<Permission> {
        // TODO_TEST: Verify permission retrieval
        const permission = await this.permissionRepository.findById(organizationId, permissionId);
        if (!permission) {
            throw new PermissionNotFoundError(organizationId, permissionId);
        }
        return permission;
    }

    async getPermissionByModuleAction(
        organizationId: string,
        moduleCode: string,
        action: PermissionAction
    ): Promise<Permission> {
        // TODO_TEST: Verify permission retrieval by module/action
        // TODO_IMPLEMENTATION: Need to resolve moduleCode to moduleId first
        throw new Error('Not implemented: getPermissionByModuleAction');
    }

    async listPermissionsByModule(organizationId: string, moduleCode: string): Promise<Permission[]> {
        // TODO_TEST: Verify permission listing by module
        // TODO_IMPLEMENTATION: Need to resolve moduleCode to moduleId first
        throw new Error('Not implemented: listPermissionsByModule');
    }

    async listAllPermissions(organizationId: string): Promise<Permission[]> {
        // TODO_TEST: Verify permission listing
        return await this.permissionRepository.findAllByOrganization(organizationId);
    }

    async createPermission(
        organizationId: string,
        data: {
            module_id: string;
            action: PermissionAction;
            description?: string;
            is_active?: boolean;
        }
    ): Promise<Permission> {
        // INVARIANT: Prevent activating permissions when parent module is inactive
        // WHY: Permissions should only be active if their parent module is active
        if (data.is_active !== false) {
            const module = await this.moduleRepository.findById(organizationId, data.module_id);
            if (!module) {
                throw new ModuleNotFoundError(organizationId, data.module_id);
            }
            if (!module.is_active) {
                throw new RBACInternalError(
                    `Cannot activate permission for inactive module ${data.module_id}`
                );
            }
        }

        const permissionData: Omit<Permission, 'id' | 'organization_id'> = {
            module_id: data.module_id,
            action: data.action,
            description: data.description || null,
            is_active: data.is_active ?? true
        };

        const permission = await this.permissionRepository.create(organizationId, permissionData);

        // INVARIANT: Audit permission lifecycle changes
        // WHY: All permission mutations must be logged for security audit trail
        await this.auditService.log(organizationId, {
            action: AuditAction.CREATE,
            entity_type: 'permission',
            entity_id: permission.id,
            new_values: permissionData,
            status: AuditStatus.SUCCESS
        }).catch(err => console.error('Audit logging failed:', err));

        // TODO_TEST: Verify permission creation and module activation check
        return permission;
    }

    async updatePermission(
        organizationId: string,
        permissionId: string,
        data: Partial<Permission>
    ): Promise<Permission> {
        // INVARIANT: Prevent activating permissions when parent module is inactive
        // WHY: Permissions should only be active if their parent module is active
        if (data.is_active === true) {
            const permission = await this.permissionRepository.findById(organizationId, permissionId);
            if (!permission) {
                throw new PermissionNotFoundError(organizationId, permissionId);
            }

            const module = await this.moduleRepository.findById(organizationId, permission.module_id);
            if (module && !module.is_active) {
                throw new RBACInternalError(
                    `Cannot activate permission ${permissionId} for inactive module ${permission.module_id}`
                );
            }
        }

        const updated = await this.permissionRepository.update(organizationId, permissionId, data);

        // INVARIANT: Audit permission lifecycle changes
        // WHY: All permission mutations must be logged for security audit trail
        await this.auditService.log(organizationId, {
            action: AuditAction.UPDATE,
            entity_type: 'permission',
            entity_id: permissionId,
            new_values: data,
            status: AuditStatus.SUCCESS
        }).catch(err => console.error('Audit logging failed:', err));

        // TODO_TEST: Verify permission update and module activation check
        return updated;
    }

    async deletePermission(organizationId: string, permissionId: string): Promise<void> {
        await this.permissionRepository.delete(organizationId, permissionId);

        // INVARIANT: Audit permission lifecycle changes
        // WHY: All permission mutations must be logged for security audit trail
        await this.auditService.log(organizationId, {
            action: AuditAction.DELETE,
            entity_type: 'permission',
            entity_id: permissionId,
            status: AuditStatus.SUCCESS
        }).catch(err => console.error('Audit logging failed:', err));

        // TODO_TEST: Verify permission deletion
    }

    async getProfileById(organizationId: string, profileId: string): Promise<Profile> {
        // TODO_TEST: Verify profile retrieval
        const profile = await this.profileRepository.findById(organizationId, profileId);
        if (!profile) {
            throw new ProfileNotFoundError(organizationId, profileId);
        }
        return profile;
    }

    async getProfileByCode(organizationId: string, code: string): Promise<Profile> {
        // TODO_TEST: Verify profile retrieval by code
        const profile = await this.profileRepository.findByCode(organizationId, code);
        if (!profile) {
            throw new ProfileNotFoundError(organizationId, code);
        }
        return profile;
    }

    async listAllProfiles(organizationId: string): Promise<Profile[]> {
        // TODO_TEST: Verify profile listing
        return await this.profileRepository.findAllByOrganization(organizationId);
    }

    async createProfile(
        organizationId: string,
        data: {
            name: string;
            code: string;
            description?: string;
            is_active?: boolean;
        },
        createdBy?: string
    ): Promise<Profile> {
        // INVARIANT: Enforce profile creation workflows
        // WHY: Business workflow rules must be satisfied
        // TODO_IMPLEMENTATION: Add workflow validation logic

        const profileData: Omit<Profile, 'id' | 'organization_id' | 'created_at'> = {
            name: data.name,
            code: data.code,
            description: data.description || null,
            is_active: data.is_active ?? true,
            created_by: createdBy || null
        };

        const profile = await this.profileRepository.create(organizationId, profileData);

        // INVARIANT: Audit profile lifecycle changes
        // WHY: All profile mutations must be logged for security audit trail
        await this.auditService.log(organizationId, {
            action: AuditAction.CREATE,
            entity_type: 'profile',
            entity_id: profile.id,
            new_values: profileData,
            status: AuditStatus.SUCCESS
        }).catch(err => console.error('Audit logging failed:', err));

        // TODO_TEST: Verify profile creation
        return profile;
    }

    async updateProfile(
        organizationId: string,
        profileId: string,
        data: Partial<Profile>
    ): Promise<Profile> {
        // INVARIANT: Enforce profile activation workflows
        // WHY: Business workflow rules must be satisfied
        // TODO_IMPLEMENTATION: Add workflow validation logic

        const updated = await this.profileRepository.update(organizationId, profileId, data);

        // INVARIANT: Audit profile lifecycle changes
        // WHY: All profile mutations must be logged for security audit trail
        await this.auditService.log(organizationId, {
            action: AuditAction.UPDATE,
            entity_type: 'profile',
            entity_id: profileId,
            new_values: data,
            status: AuditStatus.SUCCESS
        }).catch(err => console.error('Audit logging failed:', err));

        // TODO_TEST: Verify profile update
        return updated;
    }

    async deleteProfile(organizationId: string, profileId: string): Promise<void> {
        await this.profileRepository.delete(organizationId, profileId);

        // INVARIANT: Audit profile lifecycle changes
        // WHY: All profile mutations must be logged for security audit trail
        await this.auditService.log(organizationId, {
            action: AuditAction.DELETE,
            entity_type: 'profile',
            entity_id: profileId,
            status: AuditStatus.SUCCESS
        }).catch(err => console.error('Audit logging failed:', err));

        // TODO_TEST: Verify profile deletion
    }

    async assignPermissionToProfile(
        organizationId: string,
        profileId: string,
        permissionId: string,
        effect: ProfilePermissionEffect
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

    async revokePermissionFromProfile(
        organizationId: string,
        profileId: string,
        permissionId: string
    ): Promise<void> {
        // INVARIANT: Enforce authorization for revoking permissions
        // WHY: Only authorized users should revoke permissions
        // TODO_IMPLEMENTATION: Check authorization via EvaluationService

        await this.profilePermissionRepository.revoke(organizationId, profileId, permissionId);

        // TODO_TEST: Verify permission revocation
    }

    async assignProfileToRole(
        organizationId: string,
        profileId: string,
        roleId: string,
        assignedBy?: string
    ): Promise<void> {
        // TODO_TEST: Verify profile assignment to role
        await this.roleProfileRepository.assign(organizationId, roleId, profileId, assignedBy);
    }

    async revokeProfileFromRole(
        organizationId: string,
        profileId: string,
        roleId: string
    ): Promise<void> {
        // TODO_TEST: Verify profile revocation from role
        await this.roleProfileRepository.revoke(organizationId, roleId, profileId);
    }

    async getProfilePermissions(organizationId: string, profileId: string): Promise<Array<{
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

    async getRoleProfiles(organizationId: string, roleId: string): Promise<Profile[]> {
        // TODO_TEST: Verify role profiles retrieval
        const assignments = await this.roleProfileRepository.findProfilesByRole(organizationId, roleId);

        const profiles: Profile[] = [];
        for (const assignment of assignments) {
            const profile = await this.profileRepository.findById(organizationId, assignment.profile_id);
            if (profile) {
                profiles.push(profile);
            }
        }

        return profiles;
    }
}
