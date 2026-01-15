
/**
 * AuditLog Domain Model
 * 
 * Represents a system audit log entry.
 * Corresponds to the 'audit_logs' table.
 */

export enum AuditAction {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete'
}

export enum AuditStatus {
    SUCCESS = 'success',
    FAILED = 'failed'
}

export interface AuditLog {
    readonly id: string; // BigInt
    readonly organization_id: string; // BigInt

    // Actor
    readonly user_id?: string | null; // BigInt
    readonly role_id?: string | null; // BigInt

    // Action
    action: AuditAction;

    // Target
    readonly module_id?: string | null; // BigInt
    entity_type?: string | null;
    entity_id?: string | null; // BigInt

    // Changes
    old_values?: Record<string, any> | null;
    new_values?: Record<string, any> | null;

    // Metadata
    ip_address?: string | null;
    user_agent?: string | null;
    status: AuditStatus;

    readonly created_at: Date;
}
