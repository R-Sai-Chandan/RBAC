/**
 * UserRepository
 * 
 * Data access layer for User entities.
 * All operations scoped to organizationId for multi-tenant isolation.
 */

import { User } from '../models/user.model';

export interface IUserRepository {
    /**
     * Find user by ID within organization
     * @throws UserNotFoundError
     */
    findById(organizationId: string, userId: string): Promise<User | null>;

    /**
     * Find user by username within organization
     * @throws UserNotFoundError
     */
    findByUsername(organizationId: string, username: string): Promise<User | null>;

    /**
     * Find user by email within organization
     * @throws UserNotFoundError
     */
    findByEmail(organizationId: string, email: string): Promise<User | null>;

    /**
     * List all users in organization
     */
    findAllByOrganization(organizationId: string): Promise<User[]>;

    /**
     * Create a new user
     * @throws UserCreationError
     * @throws DuplicateUsernameError
     * @throws DuplicateEmailError
     */
    create(organizationId: string, data: Omit<User, 'id' | 'organization_id' | 'created_at' | 'updated_at'>): Promise<User>;

    /**
     * Update user
     * @throws UserNotFoundError
     */
    update(organizationId: string, userId: string, data: Partial<User>): Promise<User>;

    /**
     * Delete user (cascade handled by DB)
     * @throws UserNotFoundError
     */
    delete(organizationId: string, userId: string): Promise<void>;
}
