
/**
 * AuthSession Domain Model
 * 
 * Represents a user login session.
 * Corresponds to the 'auth_sessions' table.
 */

export interface AuthSession {
    readonly id: string; // BigInt
    readonly organization_id: string; // BigInt
    readonly user_id: string; // BigInt

    // Session Data
    ip_address?: string | null;
    user_agent?: string | null;

    // Timestamps
    readonly login_at: Date;
    logout_at?: Date | null;
}
