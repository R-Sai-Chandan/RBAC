/**
 * AuthSessionRepository
 * 
 * Data access layer for AuthSession entities.
 * All operations scoped to organizationId for multi-tenant isolation.
 */

import { AuthSession } from '../models/auth_session.model';

export interface IAuthSessionRepository {
    /**
     * Find session by ID within organization
     * @throws AuthSessionNotFoundError
     */
    findById(organizationId: string, sessionId: string): Promise<AuthSession | null>;

    /**
     * Find all active sessions for a user
     */
    findActiveByUser(organizationId: string, userId: string): Promise<AuthSession[]>;

    /**
     * Find all sessions for a user (active and logged out)
     */
    findAllByUser(organizationId: string, userId: string): Promise<AuthSession[]>;

    /**
     * Create a new session
     * @throws AuthSessionCreationError
     */
    create(organizationId: string, data: Omit<AuthSession, 'id' | 'organization_id' | 'login_at'>): Promise<AuthSession>;

    /**
     * Update session (e.g., set logout_at)
     * @throws AuthSessionNotFoundError
     */
    update(organizationId: string, sessionId: string, data: Partial<AuthSession>): Promise<AuthSession>;

    /**
     * Delete session
     * @throws AuthSessionNotFoundError
     */
    delete(organizationId: string, sessionId: string): Promise<void>;

    /**
     * Delete all sessions for a user
     */
    deleteAllByUser(organizationId: string, userId: string): Promise<void>;
}
