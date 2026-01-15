/**
 * GroupService
 * 
 * Service layer for Group management.
 * OWNS: Group lifecycle, user-group memberships
 * MUST NOT: Evaluate permissions, manage roles directly, manage sharing rules
 */

import { Group } from '../models/group.model';
import { IGroupRepository } from '../repositories/group.repository';
import { IUserGroupRepository } from '../repositories/user_group.repository';
import { IAuditService } from './audit.service';
import {
    GroupNotFoundError,
    UserNotFoundError,
    DuplicateAssignmentError,
    RBACInternalError
} from '../errors/rbac.errors';
import { AuditAction, AuditStatus } from '../models/audit_log.model';

export interface IGroupService {
    /**
     * Get group by ID
     * @throws GroupNotFoundError
     */
    getById(organizationId: string, groupId: string): Promise<Group>;

    /**
     * Get group by name
     * @throws GroupNotFoundError
     */
    getByName(organizationId: string, name: string): Promise<Group>;

    /**
     * List all groups in organization
     */
    listAll(organizationId: string): Promise<Group[]>;

    /**
     * List all active groups in organization
     */
    listActive(organizationId: string): Promise<Group[]>;

    /**
     * Create new group
     * @throws DuplicateAssignmentError if name exists
     */
    create(
        organizationId: string,
        data: {
            name: string;
            description?: string;
            is_active?: boolean;
        },
        actingUserId: string
    ): Promise<Group>;

    /**
     * Update group
     * @throws GroupNotFoundError
     */
    update(
        organizationId: string,
        groupId: string,
        data: Partial<Group>,
        actingUserId: string
    ): Promise<Group>;

    /**
     * Delete group
     * @throws GroupNotFoundError
     */
    delete(
        organizationId: string,
        groupId: string,
        actingUserId: string
    ): Promise<void>;

    /**
     * Add user to group
     * @throws GroupNotFoundError
     * @throws UserNotFoundError
     * @throws DuplicateAssignmentError
     */
    addMember(
        organizationId: string,
        groupId: string,
        userId: string,
        actingUserId: string
    ): Promise<void>;

    /**
     * Remove user from group
     * @throws GroupNotFoundError
     * @throws UserNotFoundError
     */
    removeMember(
        organizationId: string,
        groupId: string,
        userId: string,
        actingUserId: string
    ): Promise<void>;

    /**
     * Get all users in a group
     */
    getMembers(organizationId: string, groupId: string): Promise<string[]>;

    /**
     * Get all groups a user belongs to
     */
    getUserGroups(organizationId: string, userId: string): Promise<Group[]>;
}

/**
 * GroupService Implementation
 */
export class GroupService implements IGroupService {
    constructor(
        private readonly groupRepository: IGroupRepository,
        private readonly userGroupRepository: IUserGroupRepository,
        private readonly auditService: IAuditService
    ) { }

    async getById(organizationId: string, groupId: string): Promise<Group> {
        // TODO_TEST: Verify group retrieval
        const group = await this.groupRepository.findById(organizationId, groupId);
        if (!group) {
            throw new GroupNotFoundError(organizationId, groupId);
        }
        return group;
    }

    async getByName(organizationId: string, name: string): Promise<Group> {
        // TODO_TEST: Verify group retrieval by name
        const group = await this.groupRepository.findByName(organizationId, name);
        if (!group) {
            throw new GroupNotFoundError(organizationId, name);
        }
        return group;
    }

    async listAll(organizationId: string): Promise<Group[]> {
        // TODO_TEST: Verify group listing
        return await this.groupRepository.findAllByOrganization(organizationId);
    }

    async listActive(organizationId: string): Promise<Group[]> {
        // TODO_TEST: Verify active group listing
        return await this.groupRepository.findActiveByOrganization(organizationId);
    }

    async create(
        organizationId: string,
        data: {
            name: string;
            description?: string;
            is_active?: boolean;
        },
        actingUserId: string
    ): Promise<Group> {
        // INVARIANT: Enforce authorization for creating groups
        // WHY: Only authorized users should create groups
        // TODO_IMPLEMENTATION: Check authorization via EvaluationService

        const groupData: Omit<Group, 'id' | 'organization_id' | 'created_at'> = {
            name: data.name,
            description: data.description || null,
            is_active: data.is_active ?? true,
            created_by: actingUserId
        };

        const group = await this.groupRepository.create(organizationId, groupData);

        // TODO_TEST: Verify group creation
        return group;
    }

    async update(
        organizationId: string,
        groupId: string,
        data: Partial<Group>,
        actingUserId: string
    ): Promise<Group> {
        // INVARIANT: Enforce business rules around group activation/deactivation
        // WHY: A group cannot be deactivated if active users or sharing rules depend on it
        if (data.is_active === false) {
            // TODO_IMPLEMENTATION: Check if active users or sharing rules depend on this group
            // For now, allow deactivation
        }

        const updated = await this.groupRepository.update(organizationId, groupId, data);

        // TODO_TEST: Verify group update and deactivation rules
        return updated;
    }

    async delete(
        organizationId: string,
        groupId: string,
        actingUserId: string
    ): Promise<void> {
        // INVARIANT: Enforce authorization for deleting groups
        // WHY: Only authorized users should delete groups
        // TODO_IMPLEMENTATION: Check authorization via EvaluationService

        await this.groupRepository.delete(organizationId, groupId);

        // TODO_TEST: Verify group deletion
    }

    async addMember(
        organizationId: string,
        groupId: string,
        userId: string,
        actingUserId: string
    ): Promise<void> {
        // INVARIANT: Enforce authorization for assigning users to groups
        // WHY: Only authorized users should manage group membership
        // TODO_IMPLEMENTATION: Check authorization via EvaluationService

        await this.userGroupRepository.addMember(organizationId, userId, groupId, actingUserId);

        // INVARIANT: Audit user-group membership changes
        // WHY: All membership changes must be logged for security audit trail
        await this.auditService.log(organizationId, {
            user_id: actingUserId,
            action: AuditAction.CREATE,
            entity_type: 'user_group',
            entity_id: `${userId}:${groupId}`,
            new_values: { user_id: userId, group_id: groupId },
            status: AuditStatus.SUCCESS
        }).catch(err => console.error('Audit logging failed:', err));

        // TODO_TEST: Verify user addition to group and audit logging
    }

    async removeMember(
        organizationId: string,
        groupId: string,
        userId: string,
        actingUserId: string
    ): Promise<void> {
        await this.userGroupRepository.removeMember(organizationId, userId, groupId);

        // INVARIANT: Audit user-group membership changes
        // WHY: All membership changes must be logged for security audit trail
        await this.auditService.log(organizationId, {
            user_id: actingUserId,
            action: AuditAction.DELETE,
            entity_type: 'user_group',
            entity_id: `${userId}:${groupId}`,
            old_values: { user_id: userId, group_id: groupId },
            status: AuditStatus.SUCCESS
        }).catch(err => console.error('Audit logging failed:', err));

        // TODO_TEST: Verify user removal from group and audit logging
    }

    async getMembers(organizationId: string, groupId: string): Promise<string[]> {
        // TODO_TEST: Verify group members retrieval
        const userGroups = await this.userGroupRepository.findUsersByGroup(organizationId, groupId);
        return userGroups.map(ug => ug.user_id);
    }

    async getUserGroups(organizationId: string, userId: string): Promise<Group[]> {
        // TODO_TEST: Verify user groups retrieval
        const userGroups = await this.userGroupRepository.findGroupsByUser(organizationId, userId);

        const groups: Group[] = [];
        for (const ug of userGroups) {
            const group = await this.groupRepository.findById(organizationId, ug.group_id);
            if (group) {
                groups.push(group);
            }
        }

        return groups;
    }
}
