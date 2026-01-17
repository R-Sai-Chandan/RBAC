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
import { encryptAES, decryptAES } from '../utils/crypto.utils';

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
        const config = await this.smtpConfigRepository.findById(organizationId, configId);
        if (!config) {
            throw new RBACInternalError(`SMTP config not found: ${configId}`);
        }

        // INVARIANT: Decrypt credentials when retrieving specific config
        if (config.password) {
            config.password = decryptAES(config.password);
        }

        return config;
    }

    async listAll(organizationId: string): Promise<SmtpConfig[]> {
        const configs = await this.smtpConfigRepository.findAllByOrganization(organizationId);

        // SECURITY: Never return decrypted passwords in list views
        // We strip them entirely to prevent accidental leakage in list APIs
        return configs.map(config => ({
            ...config,
            password: config.password ? '********' : null // Masked
        }));
    }

    async getActive(organizationId: string): Promise<SmtpConfig> {
        const config = await this.smtpConfigRepository.findActiveByOrganization(organizationId);
        if (!config) {
            throw new RBACInternalError(`No active SMTP config found for organization ${organizationId}`);
        }

        // INVARIANT: Decrypt credentials for active config usage (sending mail)
        if (config.password) {
            config.password = decryptAES(config.password);
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
        // INVARIANT: Encrypt credentials before storing
        const encryptedPassword = data.password ? encryptAES(data.password) : null;

        // Create the config
        const configData: Omit<SmtpConfig, 'id' | 'organization_id'> = {
            name: data.name,
            host: data.host,
            port: data.port,
            username: data.username || null,
            password: encryptedPassword,
            encryption: data.encryption,
            from_email: data.from_email,
            from_name: data.from_name || null,
            reply_to_email: data.reply_to_email || null,
            is_active: data.is_active ?? false // Default to false unless explicitly true
        };

        // TODO: In a real transaction we would:
        // 1. If is_active=true, deactivate all others
        // 2. Insert new config
        // Since we don't have transaction support in the repository interface yet, 
        // we adhere to fail-closed logic: if active requested, we first ensure others are inactive manually? 
        // Ideally the repository creates handle this logic, or we do strict sequential ops.
        // For strict RBAC/Safety: We will force newly created configs to be inactive unless explicit activation flow is called?
        // User requirements say: "Only ONE active SMTP config per organization".

        // Strategy: If user requests active, we create it first, then explicitly activate it to trigger the transactional swap logic if implemented.
        // But preventing 'race' requires DB transactions. 
        // Assuming the repository implementation handles creation or we just create it as inactive first if it conflicts.

        // Simplification for Step 6B: If is_active requested, we handle it after creation or rely on a specialized 'upsert' pattern?
        // Let's create it as-is. If is_active is true, we must deactivate others FIRST.

        if (configData.is_active) {
            const currentActive = await this.smtpConfigRepository.findActiveByOrganization(organizationId);
            if (currentActive) {
                await this.smtpConfigRepository.update(organizationId, currentActive.id, { is_active: false });
            }
        }

        const newConfig = await this.smtpConfigRepository.create(organizationId, configData);

        // TODO: Audit Log (Creation)

        return newConfig;
    }

    async update(
        organizationId: string,
        configId: string,
        data: Partial<SmtpConfig>,
        actingUserId: string
    ): Promise<SmtpConfig> {
        // INVARIANT: Encrypt credentials if password is updated
        if (data.password) {
            data.password = encryptAES(data.password);
        }

        // INVARIANT: Single active config enforcement
        if (data.is_active === true) {
            const currentActive = await this.smtpConfigRepository.findActiveByOrganization(organizationId);
            if (currentActive && currentActive.id !== configId) {
                await this.smtpConfigRepository.update(organizationId, currentActive.id, { is_active: false });
            }
        }

        const updatedConfig = await this.smtpConfigRepository.update(organizationId, configId, data);

        // TODO: Audit Log (Update)

        return updatedConfig;
    }

    async delete(
        organizationId: string,
        configId: string,
        actingUserId: string
    ): Promise<void> {
        await this.smtpConfigRepository.delete(organizationId, configId);
        // TODO: Audit Log (Deletion)
    }

    async activate(
        organizationId: string,
        configId: string,
        actingUserId: string
    ): Promise<void> {
        // 1. Check if exists
        const target = await this.smtpConfigRepository.findById(organizationId, configId);
        if (!target) {
            throw new RBACInternalError(`SMTP config not found: ${configId}`);
        }

        // 2. Find and deactivate current active (if any)
        const currentActive = await this.smtpConfigRepository.findActiveByOrganization(organizationId);
        if (currentActive && currentActive.id !== configId) {
            await this.smtpConfigRepository.update(organizationId, currentActive.id, { is_active: false });
        }

        // 3. Activate target
        await this.smtpConfigRepository.update(organizationId, configId, { is_active: true });

        // TODO: Audit Log (Activation)
    }
}
