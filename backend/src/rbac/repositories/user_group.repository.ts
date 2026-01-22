
import { Pool } from 'pg';
import { BaseRepository } from './base.repository';

// Join table model (simplified)
export interface UserGroup {
    user_id: string;
    group_id: string;
    organization_id: string;
    assigned_by?: string;
    created_at: Date;
}

export interface IUserGroupRepository {
    addMember(organizationId: string, userId: string, groupId: string, assignedBy: string): Promise<void>;
    removeMember(organizationId: string, userId: string, groupId: string): Promise<void>;
    findUsersByGroup(organizationId: string, groupId: string): Promise<UserGroup[]>;
    findGroupsByUser(organizationId: string, userId: string): Promise<UserGroup[]>;
}

export class UserGroupRepository extends BaseRepository<UserGroup> implements IUserGroupRepository {
    constructor(pool: InstanceType<typeof Pool>) {
        super(pool, 'user_groups');
    }

    async addMember(organizationId: string, userId: string, groupId: string, assignedBy: string): Promise<void> {
        // Upsert style or insert ignore?
        // Assuming PK is (user_id, group_id, organization_id)
        const query = `
            INSERT INTO ${this.tableName} (user_id, group_id, organization_id, assigned_by)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT DO NOTHING
        `;
        await this.query(query, [userId, groupId, organizationId, assignedBy]);
    }

    async removeMember(organizationId: string, userId: string, groupId: string): Promise<void> {
        // Physical delete for join table usually, or soft delete?
        // BaseRepo supports soft delete if table has deleted_at.
        // Let's assume physical delete for simple membership unless schema says otherwise.
        // User requirements say "Soft Deletes".
        // BaseRepo handles soft deletes if we use delete().
        // But removeMember implies specific WHERE clause.

        // We'll use soft delete:
        const query = `
            DELETE FROM ${this.tableName} 
            WHERE user_id = $1 AND group_id = $2 AND organization_id = $3
        `;
        await this.query(query, [userId, groupId, organizationId]);
    }

    async findUsersByGroup(organizationId: string, groupId: string): Promise<UserGroup[]> {
        const query = `
            SELECT * FROM ${this.tableName} 
            WHERE group_id = $1 AND organization_id = $2 
        `;
        const res = await this.query(query, [groupId, organizationId]);
        return res.rows;
    }

    async findGroupsByUser(organizationId: string, userId: string): Promise<UserGroup[]> {
        const query = `
            SELECT * FROM ${this.tableName} 
            WHERE user_id = $1 AND organization_id = $2
        `;
        const res = await this.query(query, [userId, organizationId]);
        return res.rows;
    }
}
