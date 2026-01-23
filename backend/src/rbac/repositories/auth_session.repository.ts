
import { Pool, QueryResultRow } from 'pg';
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

export class AuthSessionRepository implements IAuthSessionRepository {
    private tableName = 'auth_sessions';

    constructor(private pool: InstanceType<typeof Pool>) { }

    protected async query<T extends QueryResultRow>(
        text: string,
        params?: unknown[]
    ): Promise<{ rows: T[], rowCount: number | null }> {
        return this.pool.query<T>(text, params);
    }

    async findById(organizationId: string, sessionId: string): Promise<AuthSession | null> {
        const res = await this.query<AuthSession>(
            `SELECT * FROM ${this.tableName} WHERE id = $1 AND organization_id = $2`,
            [sessionId, organizationId]
        );
        return res.rows[0] || null;
    }

    async findAllByUser(organizationId: string, userId: string): Promise<AuthSession[]> {
        const res = await this.query<AuthSession>(
            `SELECT * FROM ${this.tableName} WHERE user_id = $1 AND organization_id = $2`,
            [userId, organizationId]
        );
        return res.rows;
    }

    async findActiveByUser(organizationId: string, userId: string): Promise<AuthSession[]> {
        const res = await this.query<AuthSession>(
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
        const res = await this.query<AuthSession>(
            `SELECT * FROM ${this.tableName} WHERE id = $1 `,
            [sessionId]
        );
        return res.rows[0] || null;
    }

    async create(organizationId: string, data: Record<string, unknown>): Promise<AuthSession> {
        const { organization_id, ...cleanData } = data;

        const keys = Object.keys(cleanData);
        const values = Object.values(cleanData);
        const indices = keys.map((_, i) => `$${i + 2}`).join(', ');
        const columns = keys.join(', ');

        const query = `
            INSERT INTO ${this.tableName} (organization_id, ${columns})
            VALUES ($1, ${indices})
            RETURNING *
        `;

        const res = await this.query<AuthSession>(query, [organizationId, ...values]);
        return res.rows[0]!;
    }

    async update(organizationId: string, sessionId: string, data: Partial<AuthSession>): Promise<AuthSession> {
        const keys = Object.keys(data);
        const values = Object.values(data);
        if (keys.length === 0) return this.findById(organizationId, sessionId) as Promise<AuthSession>;

        const setClause = keys.map((key, index) => `${key} = $${index + 3}`).join(', ');

        const query = `
            UPDATE ${this.tableName} 
            SET ${setClause}
            WHERE organization_id = $1 AND id = $2
            RETURNING *
        `;
        const res = await this.query<AuthSession>(query, [organizationId, sessionId, ...values]);
        if (res.rows.length === 0) throw new Error(`Session ${sessionId} not found for update`);
        return res.rows[0]!;
    }

    async delete(organizationId: string, sessionId: string): Promise<void> {
        await this.query(
            `DELETE FROM ${this.tableName} WHERE id = $1 AND organization_id = $2`,
            [sessionId, organizationId]
        );
    }
}
