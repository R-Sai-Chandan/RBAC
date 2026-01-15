/**
 * UserGroupRepository
 * 
 * Data access layer for UserGroup assignments.
 * All operations scoped to organizationId for multi-tenant isolation.
 */

import { UserGroup } from '../models/user_group.model';

export interface IUserGroupRepository {
    /**
     * Find all groups assigned to a user
     */
    findGroupsByUser(organizationId: string, userId: string): Promise<UserGroup[]>;

    /**
     * Find all users in a group
     */
    findUsersByGroup(organizationId: string, groupId: string): Promise<UserGroup[]>;

    /**
     * Check if user is in specific group
     */
    isMember(organizationId: string, userId: string, groupId: string): Promise<boolean>;

    /**
     * Add user to group
     * @throws UserGroupAssignmentError
     * @throws DuplicateAssignmentError
     */
    addMember(organizationId: string, userId: string, groupId: string, assignedBy?: string): Promise<UserGroup>;

    /**
     * Remove user from group
     * @throws UserGroupNotFoundError
     */
    removeMember(organizationId: string, userId: string, groupId: string): Promise<void>;

    /**
     * Remove user from all groups
     */
    removeAllByUser(organizationId: string, userId: string): Promise<void>;
}
