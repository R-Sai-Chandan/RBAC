/**
 * SmtpConfigRepository
 * 
 * Data access layer for SmtpConfig entities.
 * All operations scoped to organizationId for multi-tenant isolation.
 */

import { SmtpConfig } from '../models/smtp_config.model';

export interface ISmtpConfigRepository {
    /**
     * Find SMTP config by ID within organization
     * @throws SmtpConfigNotFoundError
     */
    findById(organizationId: string, configId: string): Promise<SmtpConfig | null>;

    /**
     * List all SMTP configs in organization
     */
    findAllByOrganization(organizationId: string): Promise<SmtpConfig[]>;

    /**
     * Find active SMTP config for organization
     */
    findActiveByOrganization(organizationId: string): Promise<SmtpConfig | null>;

    /**
     * Create a new SMTP config
     * @throws SmtpConfigCreationError
     */
    create(organizationId: string, data: Omit<SmtpConfig, 'id' | 'organization_id'>): Promise<SmtpConfig>;

    /**
     * Update SMTP config
     * @throws SmtpConfigNotFoundError
     */
    update(organizationId: string, configId: string, data: Partial<SmtpConfig>): Promise<SmtpConfig>;

    /**
     * Delete SMTP config
     * @throws SmtpConfigNotFoundError
     */
    delete(organizationId: string, configId: string): Promise<void>;
}
