
import { Pool, QueryResultRow } from 'pg';

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

export class UserGroupRepository implements IUserGroupRepository {
    private tableName = 'user_groups';

    constructor(private pool: InstanceType<typeof Pool>) { }

    protected async query<T extends QueryResultRow>(
        text: string,
        params?: unknown[]
    ): Promise<{ rows: T[], rowCount: number | null }> {
        return this.pool.query<T>(text, params);
    }

    async addMember(organizationId: string, userId: string, groupId: string, assignedBy: string): Promise<void> {
        const query = `
            INSERT INTO ${this.tableName} (user_id, group_id, organization_id, assigned_by)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT DO NOTHING
        `;
        await this.query(query, [userId, groupId, organizationId, assignedBy]);
    }

    async removeMember(organizationId: string, userId: string, groupId: string): Promise<void> {
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
        const res = await this.query<UserGroup>(query, [groupId, organizationId]);
        return res.rows;
    }

    async findGroupsByUser(organizationId: string, userId: string): Promise<UserGroup[]> {
        const query = `
            SELECT * FROM ${this.tableName} 
            WHERE user_id = $1 AND organization_id = $2
        `;
        const res = await this.query<UserGroup>(query, [userId, organizationId]);
        return res.rows;
    }
}
