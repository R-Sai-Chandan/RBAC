
/**
 * SmtpConfig Domain Model
 * 
 * Represents SMTP configuration for an organization.
 * Corresponds to the 'smtp_config' table.
 */

export enum SmtpEncryption {
    NONE = 'none',
    TLS = 'tls',
    SSL = 'ssl'
}

export interface SmtpConfig {
    readonly id: string; // BigInt
    readonly organization_id: string; // BigInt

    name: string;

    // Connection
    host: string;
    port: number;
    username?: string | null;
    password?: string | null; // Encrypted content in practice
    encryption: SmtpEncryption;

    // Sender info
    from_email: string;
    from_name?: string | null;
    reply_to_email?: string | null;

    // Status
    is_active: boolean;
}
