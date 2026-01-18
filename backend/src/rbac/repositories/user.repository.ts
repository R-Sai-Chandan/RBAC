
import { Pool } from 'pg';
import { BaseRepository } from './base.repository';
import { User } from '../models/user.model';

export interface IUserRepository {
    findById(organizationId: string, userId: string): Promise<User | null>;
    findByUsername(organizationId: string, username: string): Promise<User | null>;
    findByEmail(organizationId: string, email: string): Promise<User | null>;
    findAllByOrganization(organizationId: string): Promise<User[]>;
    create(organizationId: string, data: any): Promise<User>;
    update(organizationId: string, userId: string, data: Partial<User>): Promise<User>;
    delete(organizationId: string, userId: string): Promise<void>;
    findAll(organizationId: string, filters?: any): Promise<User[]>; // For Filter Support
}

export class UserRepository extends BaseRepository<User> implements IUserRepository {
    constructor(pool: Pool) {
        super(pool, 'users');
    }

    async findByUsername(organizationId: string, username: string): Promise<User | null> {
        const res = await this.query(
            `SELECT * FROM ${this.tableName} WHERE username = $1 AND organization_id = $2 AND deleted_at IS NULL`,
            [username, organizationId]
        );
        return res.rows[0] || null;
    }

    async findByEmail(organizationId: string, email: string): Promise<User | null> {
        const res = await this.query(
            `SELECT * FROM ${this.tableName} WHERE primary_email = $1 AND organization_id = $2 AND deleted_at IS NULL`,
            [email, organizationId]
        );
        return res.rows[0] || null;
    }

    async findAllByOrganization(organizationId: string): Promise<User[]> {
        return this.findAll(organizationId);
    }
}

