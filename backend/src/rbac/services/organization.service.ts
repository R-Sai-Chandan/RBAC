
import { IOrganizationRepository } from '../repositories/organization.repository';
import { IModuleSeederService } from './moduleSeeder.service';
import { Organization } from '../models/organization.model';
import { ModuleTemplate } from '../config/module-templates';
import { RBACInternalError } from '../errors/rbac.errors';

export interface IOrganizationService {
    createOrganization(
        data: Omit<Organization, 'id' | 'created_at' | 'updated_at'>,
        productTemplates?: ModuleTemplate[]
    ): Promise<Organization>;

    getOrganization(id: string): Promise<Organization>;
}

export class OrganizationService implements IOrganizationService {
    constructor(
        private organizationRepository: IOrganizationRepository,
        private moduleSeederService: IModuleSeederService
    ) { }

    async createOrganization(
        data: Omit<Organization, 'id' | 'created_at' | 'updated_at'>,
        productTemplates: ModuleTemplate[] = []
    ): Promise<Organization> {
        // 1. Create Organization
        let organization: Organization;
        try {
            organization = await this.organizationRepository.create(data);
        } catch (error) {
            console.error('Organization creation failed', error);
            throw new RBACInternalError('Failed to create organization');
        }

        // 2. Seed Modules
        try {
            await this.moduleSeederService.seed(organization.id, productTemplates);
        } catch (error) {
            console.error(`Module seeding failed for organization ${organization.id}`, error);
            // Decide: Rollback organization? 
            // Ideally yes, but repositories don't expose transaction context easily here without UnitOfWork/TransactionManager.
            // For this stabilization pass, we will log and potentially leave org in partial state (no modules), 
            // or re-throw. 
            // Since "System-Managed Modules" are critical, an org without modules is broken.
            // We should try to delete the org or throw.
            // Let's attempt cleanup and throw.
            try {
                await this.organizationRepository.delete(organization.id);
            } catch (cleanupError) {
                console.error('Failed to cleanup organization after seeding failure', cleanupError);
            }
            throw new RBACInternalError('Failed to seed organization modules');
        }

        return organization;
    }

    async getOrganization(id: string): Promise<Organization> {
        const org = await this.organizationRepository.findById(id);
        if (!org) {
            throw new RBACInternalError(`Organization not found: ${id}`);
        }
        return org;
    }
}
