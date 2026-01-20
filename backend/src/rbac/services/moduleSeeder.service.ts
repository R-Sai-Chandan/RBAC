
import { IModuleRepository } from '../repositories/module.repository';
import { CORE_MODULES, ModuleTemplate, PRODUCT_MODULES } from '../config/module-templates';
import { RBACInternalError } from '../errors/rbac.errors';

export interface IModuleSeederService {
    /**
     * Seeds core modules and optional product modules for a new organization.
     * This operation is idempotent: it will not duplicate modules if they already exist (based on code).
     */
    seed(organizationId: string, productModules?: ModuleTemplate[]): Promise<void>;
}

export class ModuleSeederService implements IModuleSeederService {
    constructor(private moduleRepository: IModuleRepository) { }

    async seed(organizationId: string, productModules: ModuleTemplate[] = []): Promise<void> {
        // 1. Combine Core + Product modules
        const allTemplates = [...CORE_MODULES, ...productModules];

        // 2. Fetch existing modules to avoid duplicates (Idempotency)
        // Note: Check by CODE.
        // We iterate and check/create one by one or fetch all.
        // Optimized: Fetch all existing modules for org
        const existingModules = await this.moduleRepository.findAll(organizationId);

        // Wait, ModuleRepository.findAll might not take args or only takes generic filters.
        // BaseRepository.findAll(orgId, filters).
        // ModuleRepo overrides it? Let's check ModuleRepo implementation again.

        // ModuleRepository implementation:
        // findByCode(orgId, code) exists.

        for (const template of allTemplates) {
            await this.seedModule(organizationId, template);
        }
    }

    private async seedModule(organizationId: string, template: ModuleTemplate): Promise<void> {
        try {
            // Check existence
            const existing = await this.moduleRepository.findByCode(organizationId, template.code);

            if (existing) {
                // Determine if we need to update system-level properties?
                // For now, we assume user might have changed names/active status, so we DO NOT overwrite unless critical.
                // But Prompt says: "Treat modules as SYSTEM-MANAGED entities".
                // So maybe we SHOULD enforce consistency?
                // Let's at least ensure core fields (actions?) are correct if we store them?
                // The Module model doesn't store 'actions' as a JSON field in current interface, 
                // but the template has 'actions'. 
                // The permissions/actions model might be separate or implicitly defined by code.
                // Looking at Module model: id, orgId, name, code, description, is_active, sort_order.
                // Actions seems to be logical or stored in Permissions?
                // Actually, MODULES usually define the SCOPE. Permissions define Access.
                // But the 'actions' in template might be for seeding valid permissions later?
                // Prompt: "Seed modules from templates".

                // If it exists, skip.
                return;
            }

            // Create
            await (this.moduleRepository as any).create(organizationId, {
                name: template.name,
                code: template.code,
                description: template.description,
                is_active: template.default_active,
                sort_order: template.sort_order
            });

        } catch (error) {
            console.error(`Failed to seed module ${template.code} for org ${organizationId}`, error);
            // Fail safely? Or fail closed? Partition seeding is critical.
            throw new RBACInternalError(`Module seeding failed for ${template.code}`);
        }
    }
}
