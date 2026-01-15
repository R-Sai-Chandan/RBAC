/**
 * SmtpConfigService
 * 
 * Service layer for SMTP configuration management.
 * OWNS: SMTP config lifecycle, credential encryption/decryption
 * MUST NOT: Send emails, evaluate permissions, manage users
 */

import { SmtpConfig, SmtpEncryption } from '../models/smtp_config.model';
import { ISmtpConfigRepository } from '../repositories/smtp_config.repository';
import { RBACInternalError } from '../errors/rbac.errors';

export interface ISmtpConfigService {
    /**
     * Get SMTP config by ID
     * @throws SmtpConfigNotFoundError
     */
    getById(organizationId: string, configId: string): Promise<SmtpConfig>;

    /**
     * List all SMTP configs in organization
     */
    listAll(organizationId: string): Promise<SmtpConfig[]>;

    /**
     * Get active SMTP config for organization
     * @throws SmtpConfigNotFoundError if no active config
     */
    getActive(organizationId: string): Promise<SmtpConfig>;

    /**
     * Create new SMTP config
     * @throws SmtpConfigCreationError
     */
    create(
        organizationId: string,
        data: {
            name: string;
            host: string;
            port: number;
            username?: string;
            password?: string;
            encryption: SmtpEncryption;
            from_email: string;
            from_name?: string;
            reply_to_email?: string;
            is_active?: boolean;
        },
        actingUserId: string
    ): Promise<SmtpConfig>;

    /**
     * Update SMTP config
     * @throws SmtpConfigNotFoundError
     */
    update(
        organizationId: string,
        configId: string,
        data: Partial<SmtpConfig>,
        actingUserId: string
    ): Promise<SmtpConfig>;

    /**
     * Delete SMTP config
     * @throws SmtpConfigNotFoundError
     */
    delete(
        organizationId: string,
        configId: string,
        actingUserId: string
    ): Promise<void>;

    /**
     * Activate SMTP config (deactivates all others)
     * @throws SmtpConfigNotFoundError
     */
    activate(
        organizationId: string,
        configId: string,
        actingUserId: string
    ): Promise<void>;
}

/**
 * SmtpConfigService Implementation
 */
export class SmtpConfigService implements ISmtpConfigService {
    constructor(private readonly smtpConfigRepository: ISmtpConfigRepository) { }

    async getById(organizationId: string, configId: string): Promise<SmtpConfig> {
        // TODO_INVARIANT: Decrypt credentials when retrieving
        // TODO_TEST: Verify SMTP config retrieval
        const config = await this.smtpConfigRepository.findById(organizationId, configId);
        if (!config) {
            throw new RBACInternalError(`SMTP config not found: ${configId}`);
        }
        return config;
    }

    async listAll(organizationId: string): Promise<SmtpConfig[]> {
        // TODO_TEST: Verify SMTP config listing
        return await this.smtpConfigRepository.findAllByOrganization(organizationId);
    }

    async getActive(organizationId: string): Promise<SmtpConfig> {
        // TODO_INVARIANT: Decrypt credentials when retrieving
        // TODO_TEST: Verify active SMTP config retrieval
        const config = await this.smtpConfigRepository.findActiveByOrganization(organizationId);
        if (!config) {
            throw new RBACInternalError(`No active SMTP config found for organization ${organizationId}`);
        }
        return config;
    }

    async create(
        organizationId: string,
        data: {
            name: string;
            host: string;
            port: number;
            username?: string;
            password?: string;
            encryption: SmtpEncryption;
            from_email: string;
            from_name?: string;
            reply_to_email?: string;
            is_active?: boolean;
        },
        actingUserId: string
    ): Promise<SmtpConfig> {
        // TODO_INVARIANT: Encrypt credentials before storing
        // TODO_INVARIANT: Ensure only one active config per organization
        // TODO_INVARIANT: Audit SMTP configuration changes
        // TODO_TEST: Verify SMTP config creation

        const configData: Omit<SmtpConfig, 'id' | 'organization_id'> = {
            name: data.name,
            host: data.host,
            port: data.port,
            username: data.username || null,
            password: data.password || null, // TODO: Encrypt before storing
            encryption: data.encryption,
            from_email: data.from_email,
            from_name: data.from_name || null,
            reply_to_email: data.reply_to_email || null,
            is_active: data.is_active ?? true
        };

        return await this.smtpConfigRepository.create(organizationId, configData);
    }

    async update(
        organizationId: string,
        configId: string,
        data: Partial<SmtpConfig>,
        actingUserId: string
    ): Promise<SmtpConfig> {
        // TODO_INVARIANT: Encrypt credentials if password is updated
        // TODO_INVARIANT: Ensure only one active config per organization
        // TODO_INVARIANT: Audit SMTP configuration changes
        // TODO_TEST: Verify SMTP config update

        return await this.smtpConfigRepository.update(organizationId, configId, data);
    }

    async delete(
        organizationId: string,
        configId: string,
        actingUserId: string
    ): Promise<void> {
        // TODO_INVARIANT: Audit SMTP configuration changes
        // TODO_TEST: Verify SMTP config deletion

        await this.smtpConfigRepository.delete(organizationId, configId);
    }

    async activate(
        organizationId: string,
        configId: string,
        actingUserId: string
    ): Promise<void> {
        // TODO_INVARIANT: Deactivate all other configs transactionally
        // TODO_INVARIANT: Audit SMTP configuration changes
        // TODO_TEST: Verify SMTP config activation

        // For now, just update the config to active
        await this.smtpConfigRepository.update(organizationId, configId, { is_active: true });
    }
}
