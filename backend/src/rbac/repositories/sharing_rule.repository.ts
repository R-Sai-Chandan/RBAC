/**
 * SharingRuleRepository
 * 
 * Data access layer for SharingRule entities.
 * All operations scoped to organizationId for multi-tenant isolation.
 */

import { SharingRule, SharingRuleType } from '../models/sharing_rule.model';

export interface ISharingRuleRepository {
    /**
     * Find sharing rule by ID within organization
     * @throws SharingRuleNotFoundError
     */
    findById(organizationId: string, ruleId: string): Promise<SharingRule | null>;

    /**
     * List all sharing rules in organization
     */
    findAllByOrganization(organizationId: string): Promise<SharingRule[]>;

    /**
     * List all active sharing rules in organization
     */
    findActiveByOrganization(organizationId: string): Promise<SharingRule[]>;

    /**
     * Find sharing rules by type
     */
    findByType(organizationId: string, ruleType: SharingRuleType): Promise<SharingRule[]>;

    /**
     * Find sharing rules for a module
     */
    findByModule(organizationId: string, moduleId: string): Promise<SharingRule[]>;

    /**
     * Create a new sharing rule
     * @throws SharingRuleCreationError
     */
    create(organizationId: string, data: Omit<SharingRule, 'id' | 'organization_id' | 'created_at'>): Promise<SharingRule>;

    /**
     * Update sharing rule
     * @throws SharingRuleNotFoundError
     */
    update(organizationId: string, ruleId: string, data: Partial<SharingRule>): Promise<SharingRule>;

    /**
     * Delete sharing rule (cascade handled by DB)
     * @throws SharingRuleNotFoundError
     */
    delete(organizationId: string, ruleId: string): Promise<void>;
}
