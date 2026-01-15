/**
 * SharingRuleService
 * 
 * Service layer for SharingRule management.
 * OWNS: Sharing rule lifecycle, rule validation
 * MUST NOT: Evaluate permissions, manage record shares directly, manage users/roles/groups
 */

import { SharingRule, SharingRuleType } from '../models/sharing_rule.model';
import { ISharingRuleRepository } from '../repositories/sharing_rule.repository';
import { RBACInternalError } from '../errors/rbac.errors';

export interface ISharingRuleService {
    /**
     * Get sharing rule by ID
     * @throws SharingRuleNotFoundError
     */
    getById(organizationId: string, ruleId: string): Promise<SharingRule>;

    /**
     * List all sharing rules in organization
     */
    listAll(organizationId: string): Promise<SharingRule[]>;

    /**
     * List all active sharing rules in organization
     */
    listActive(organizationId: string): Promise<SharingRule[]>;

    /**
     * List sharing rules by type
     */
    listByType(organizationId: string, ruleType: SharingRuleType): Promise<SharingRule[]>;

    /**
     * List sharing rules for a module
     */
    listByModule(organizationId: string, moduleId: string): Promise<SharingRule[]>;

    /**
     * Create new sharing rule
     * @throws SharingRuleCreationError
     */
    create(
        organizationId: string,
        data: {
            rule_type: SharingRuleType;
            source_user_id?: string;
            target_user_id?: string;
            source_role_id?: string;
            target_role_id?: string;
            source_group_id?: string;
            target_group_id?: string;
            module_id?: string;
            is_active?: boolean;
        },
        actingUserId: string
    ): Promise<SharingRule>;

    /**
     * Update sharing rule
     * @throws SharingRuleNotFoundError
     */
    update(
        organizationId: string,
        ruleId: string,
        data: Partial<SharingRule>,
        actingUserId: string
    ): Promise<SharingRule>;

    /**
     * Delete sharing rule
     * @throws SharingRuleNotFoundError
     */
    delete(
        organizationId: string,
        ruleId: string,
        actingUserId: string
    ): Promise<void>;
}

/**
 * SharingRuleService Implementation
 */
export class SharingRuleService implements ISharingRuleService {
    constructor(private readonly sharingRuleRepository: ISharingRuleRepository) { }

    async getById(organizationId: string, ruleId: string): Promise<SharingRule> {
        // TODO_TEST: Verify sharing rule retrieval
        const rule = await this.sharingRuleRepository.findById(organizationId, ruleId);
        if (!rule) {
            throw new RBACInternalError(`Sharing rule not found: ${ruleId}`);
        }
        return rule;
    }

    async listAll(organizationId: string): Promise<SharingRule[]> {
        // TODO_TEST: Verify sharing rule listing
        return await this.sharingRuleRepository.findAllByOrganization(organizationId);
    }

    async listActive(organizationId: string): Promise<SharingRule[]> {
        // TODO_TEST: Verify active sharing rule listing
        return await this.sharingRuleRepository.findActiveByOrganization(organizationId);
    }

    async listByType(organizationId: string, ruleType: SharingRuleType): Promise<SharingRule[]> {
        // TODO_TEST: Verify sharing rule listing by type
        return await this.sharingRuleRepository.findByType(organizationId, ruleType);
    }

    async listByModule(organizationId: string, moduleId: string): Promise<SharingRule[]> {
        // TODO_TEST: Verify sharing rule listing by module
        return await this.sharingRuleRepository.findByModule(organizationId, moduleId);
    }

    async create(
        organizationId: string,
        data: {
            rule_type: SharingRuleType;
            source_user_id?: string;
            target_user_id?: string;
            source_role_id?: string;
            target_role_id?: string;
            source_group_id?: string;
            target_group_id?: string;
            module_id?: string;
            is_active?: boolean;
        },
        actingUserId: string
    ): Promise<SharingRule> {
        // TODO_INVARIANT: Enforce authorization for creating sharing rules
        // TODO_INVARIANT: Prevent conflicting or overlapping sharing rules
        // TODO_INVARIANT: Enforce rule_type semantics
        // TODO_TEST: Verify sharing rule creation

        const ruleData: Omit<SharingRule, 'id' | 'organization_id' | 'created_at'> = {
            rule_type: data.rule_type,
            source_user_id: data.source_user_id || null,
            target_user_id: data.target_user_id || null,
            source_role_id: data.source_role_id || null,
            target_role_id: data.target_role_id || null,
            source_group_id: data.source_group_id || null,
            target_group_id: data.target_group_id || null,
            module_id: data.module_id || null,
            is_active: data.is_active ?? true,
            created_by: actingUserId
        };

        return await this.sharingRuleRepository.create(organizationId, ruleData);
    }

    async update(
        organizationId: string,
        ruleId: string,
        data: Partial<SharingRule>,
        actingUserId: string
    ): Promise<SharingRule> {
        // TODO_INVARIANT: Enforce authorization for updating sharing rules
        // TODO_INVARIANT: Prevent conflicting or overlapping sharing rules
        // TODO_TEST: Verify sharing rule update

        return await this.sharingRuleRepository.update(organizationId, ruleId, data);
    }

    async delete(
        organizationId: string,
        ruleId: string,
        actingUserId: string
    ): Promise<void> {
        // TODO_INVARIANT: Enforce authorization for deleting sharing rules
        // TODO_TEST: Verify sharing rule deletion

        await this.sharingRuleRepository.delete(organizationId, ruleId);
    }
}
