
import { Pool, QueryResultRow } from 'pg';
import { Module } from '../models/module.model';

export interface IModuleRepository {
    findAll(organizationId: string, filters?: any): Promise<Module[]>;
    findByCode(organizationId: string, code: string): Promise<Module | null>;
    findById(organizationId: string, id: string): Promise<Module | null>;
    create(organizationId: string, data: Partial<Module>): Promise<Module>;
}

export class ModuleRepository implements IModuleRepository {
    private tableName = 'modules';

    constructor(private pool: InstanceType<typeof Pool>) { }

    protected async query<T extends QueryResultRow>(
        text: string,
        params?: unknown[]
    ): Promise<{ rows: T[], rowCount: number | null }> {
        return this.pool.query<T>(text, params);
    }

    async findById(organizationId: string, id: string): Promise<Module | null> {
        const res = await this.query<Module>(
            `SELECT * FROM ${this.tableName} WHERE id = $1 AND organization_id = $2`,
            [id, organizationId]
        );
        return res.rows[0] || null;
    }

    async findByCode(organizationId: string, code: string): Promise<Module | null> {
        const res = await this.query<Module>(
            `SELECT * FROM ${this.tableName} WHERE code = $1 AND organization_id = $2 `,
            [code, organizationId]
        );
        return res.rows[0] || null;
    }

    async findAll(organizationId: string, filters?: Record<string, unknown>): Promise<Module[]> {
        let query = `SELECT * FROM ${this.tableName} WHERE organization_id = $1 `;
        const params: unknown[] = [organizationId];

        if (filters && Object.keys(filters).length > 0) {
            Object.keys(filters).forEach((key, index) => {
                query += ` AND ${key} = $${index + 2}`;
                params.push(filters[key]);
            });
        }

        const res = await this.query<Module>(query, params);
        return res.rows;
    }

    async create(organizationId: string, data: Partial<Module>): Promise<Module> {
        const { organization_id, ...cleanData } = data as any;

        const keys = Object.keys(cleanData);
        const values = Object.values(cleanData);
        const indices = keys.map((_, i) => `$${i + 2}`).join(', ');
        const columns = keys.join(', ');

        const query = `
            INSERT INTO ${this.tableName} (organization_id, ${columns})
            VALUES ($1, ${indices})
            RETURNING *
        `;

        const res = await this.query<Module>(query, [organizationId, ...values]);
        return res.rows[0]!;
    }
}
