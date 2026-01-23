
import { Pool, QueryResultRow } from 'pg';
import { User } from '../models/user.model';

export interface IUserRepository {
    findById(organizationId: string, userId: string): Promise<User | null>;
    findByUsername(organizationId: string, username: string): Promise<User | null>;
    findByEmail(organizationId: string, email: string): Promise<User | null>;
    findByUsernameGlobal(username: string): Promise<User | null>;
    findByEmailGlobal(email: string): Promise<User | null>;
    findAllByOrganization(organizationId: string): Promise<User[]>;
    create(organizationId: string, data: any): Promise<User>;
    update(organizationId: string, userId: string, data: Partial<User>): Promise<User>;
    delete(organizationId: string, userId: string): Promise<void>;
    findAll(organizationId: string, filters?: any): Promise<User[]>;
}

export class UserRepository implements IUserRepository {
    private tableName = 'users';

    constructor(private pool: InstanceType<typeof Pool>) { }

    protected async query<T extends QueryResultRow>(
        text: string,
        params?: unknown[]
    ): Promise<{ rows: T[], rowCount: number | null }> {
        return this.pool.query<T>(text, params);
    }

    async findById(organizationId: string, userId: string): Promise<User | null> {
        const res = await this.query<User>(
            `SELECT * FROM ${this.tableName} WHERE id = $1 AND organization_id = $2`,
            [userId, organizationId]
        );
        return res.rows[0] || null;
    }

    async findByUsername(organizationId: string, username: string): Promise<User | null> {
        const res = await this.query<User>(
            `SELECT * FROM ${this.tableName} WHERE username = $1 AND organization_id = $2 `,
            [username, organizationId]
        );
        return res.rows[0] || null;
    }

    async findByEmail(organizationId: string, email: string): Promise<User | null> {
        const res = await this.query<User>(
            `SELECT * FROM ${this.tableName} WHERE primary_email = $1 AND organization_id = $2 `,
            [email, organizationId]
        );
        return res.rows[0] || null;
    }

    async findAllByOrganization(organizationId: string): Promise<User[]> {
        return this.findAll(organizationId);
    }

    async findByUsernameGlobal(username: string): Promise<User | null> {
        const res = await this.query<User>(
            `SELECT * FROM ${this.tableName} WHERE username = $1  LIMIT 1`,
            [username]
        );
        return res.rows[0] || null;
    }

    async findByEmailGlobal(email: string): Promise<User | null> {
        const res = await this.query<User>(
            `SELECT * FROM ${this.tableName} WHERE primary_email = $1 LIMIT 1`,
            [email]
        );
        return res.rows[0] || null;
    }

    async findAll(organizationId: string, filters?: Record<string, unknown>): Promise<User[]> {
        let query = `SELECT * FROM ${this.tableName} WHERE organization_id = $1 `;
        const params: unknown[] = [organizationId];

        // Simple filter implementation
        if (filters && Object.keys(filters).length > 0) {
            Object.keys(filters).forEach((key, index) => {
                query += ` AND ${key} = $${index + 2}`;
                params.push(filters[key]);
            });
        }

        const res = await this.query<User>(query, params);
        return res.rows;
    }

    async create(organizationId: string, data: Record<string, unknown>): Promise<User> {
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

        const res = await this.query<User>(query, [organizationId, ...values]);
        return res.rows[0]!;
    }

    async update(organizationId: string, userId: string, data: Partial<User>): Promise<User> {
        const keys = Object.keys(data);
        const values = Object.values(data);
        if (keys.length === 0) return this.findById(organizationId, userId) as Promise<User>;

        const setClause = keys.map((key, i) => `${key} = $${i + 3}`).join(', ');

        const query = `
            UPDATE ${this.tableName}
            SET ${setClause}, updated_at = NOW()
            WHERE id = $1 AND organization_id = $2
            RETURNING *
        `;

        const res = await this.query<User>(query, [userId, organizationId, ...values]);
        if (res.rows.length === 0) throw new Error(`User ${userId} not found for update`);
        return res.rows[0]!;
    }

    async delete(organizationId: string, userId: string): Promise<void> {
        // Soft delete: Set status to 'deleted' instead of physical deletion
        await this.query(
            `UPDATE ${this.tableName} SET status = 'deleted' WHERE id = $1 AND organization_id = $2`,
            [userId, organizationId]
        );
    }

}

