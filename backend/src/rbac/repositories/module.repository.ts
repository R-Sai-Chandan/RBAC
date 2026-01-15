/**
 * ModuleRepository
 * 
 * Data access layer for Module entities.
 * All operations scoped to organizationId for multi-tenant isolation.
 */

import { Module } from '../models/module.model';

export interface IModuleRepository {
    /**
     * Find module by ID within organization
     * @throws ModuleNotFoundError
     */
    findById(organizationId: string, moduleId: string): Promise<Module | null>;

    /**
     * Find module by code within organization
     * @throws ModuleNotFoundError
     */
    findByCode(organizationId: string, code: string): Promise<Module | null>;

    /**
     * List all modules in organization
     */
    findAllByOrganization(organizationId: string): Promise<Module[]>;

    /**
     * List all active modules in organization
     */
    findActiveByOrganization(organizationId: string): Promise<Module[]>;

    /**
     * Create a new module
     * @throws ModuleCreationError
     * @throws DuplicateModuleCodeError
     */
    create(organizationId: string, data: Omit<Module, 'id' | 'organization_id'>): Promise<Module>;

    /**
     * Update module
     * @throws ModuleNotFoundError
     */
    update(organizationId: string, moduleId: string, data: Partial<Module>): Promise<Module>;

    /**
     * Delete module (cascade handled by DB)
     * @throws ModuleNotFoundError
     */
    delete(organizationId: string, moduleId: string): Promise<void>;
}
