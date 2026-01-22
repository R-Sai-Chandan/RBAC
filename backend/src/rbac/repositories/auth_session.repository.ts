
import { Pool } from 'pg';
import { BaseRepository } from './base.repository';
import { AuthSession } from '../models/auth_session.model';

export interface IAuthSessionRepository {
    create(organizationId: string, data: any): Promise<AuthSession>;
    findById(organizationId: string, sessionId: string): Promise<AuthSession | null>;
    update(organizationId: string, sessionId: string, data: any): Promise<AuthSession>;
    delete(organizationId: string, sessionId: string): Promise<void>;
    findAllByUser(organizationId: string, userId: string): Promise<AuthSession[]>;
    findActiveByUser(organizationId: string, userId: string): Promise<AuthSession[]>;
    deleteAllByUser(organizationId: string, userId: string): Promise<void>;
    findBySessionIdGlobal(sessionId: string): Promise<AuthSession | null>;
}

export class AuthSessionRepository extends BaseRepository<AuthSession> implements IAuthSessionRepository {
    constructor(pool: InstanceType<typeof Pool>) {
        super(pool, 'auth_sessions');
    }

    async findAllByUser(organizationId: string, userId: string): Promise<AuthSession[]> {
        const res = await this.query(
            `SELECT * FROM ${this.tableName} WHERE user_id = $1 AND organization_id = $2`,
            [userId, organizationId]
        );
        return res.rows;
    }

    async findActiveByUser(organizationId: string, userId: string): Promise<AuthSession[]> {
        // active = logout_at is null (and not deleted)
        const res = await this.query(
            `SELECT * FROM ${this.tableName} WHERE user_id = $1 AND organization_id = $2 AND logout_at IS NULL `,
            [userId, organizationId]
        );
        return res.rows;
    }

    async deleteAllByUser(organizationId: string, userId: string): Promise<void> {
        await this.query(
            `DELETE FROM ${this.tableName} WHERE user_id = $1 AND organization_id = $2`,
            [userId, organizationId]
        );
    }

    async findBySessionIdGlobal(sessionId: string): Promise<AuthSession | null> {
        const res = await this.query(
            `SELECT * FROM ${this.tableName} WHERE id = $1 `,
            [sessionId]
        );
        return res.rows[0] || null;
    }

    async update(organizationId: string, sessionId: string, data: Partial<AuthSession>): Promise<AuthSession> {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClause = keys.map((key, index) => `${key} = $${index + 3}`).join(', ');

        const query = `
            UPDATE ${this.tableName} 
            SET ${setClause}
            WHERE organization_id = $1 AND id = $2
            RETURNING *
        `;
        const res = await this.query(query, [ organizationId, sessionId, ...values]);
        if (res.rows.length === 0) throw new Error(`Entity ${sessionId} not found for update`);
        return res.rows[0]!;
}

}
