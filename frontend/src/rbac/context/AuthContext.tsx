import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/api';

interface User {
    id: string;
    username: string;
    fullName: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    organizationId: string | null;
    login: (orgId: string, identifier: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider - Manages authentication state
 * Session ID is handled via HTTP-only cookies (not accessible to JS).
 * Only user context is stored in localStorage for UI purposes.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [organizationId, setOrganizationId] = useState<string | null>(
        localStorage.getItem('organizationId')
    );

    useEffect(() => {
        // On mount, restore user from localStorage if available
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem('user');
            }
        }
    }, []);

    const login = async (orgId: string, identifier: string, password: string) => {
        // Store org ID for API interceptor before making request
        localStorage.setItem('organizationId', orgId);
        setOrganizationId(orgId);

        try {
            const response = await api.post('/auth/login', {
                organizationId: orgId,
                identifier,
                password,
            });

            // Session ID is now in HTTP-only cookie
            // Only store user context for UI
            const { user: newUser } = response.data.data;

            localStorage.setItem('user', JSON.stringify(newUser));
            setUser(newUser);
        } catch (error) {
            // Clear on failure
            localStorage.removeItem('organizationId');
            setOrganizationId(null);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) {
            console.error('Logout request failed:', e);
        } finally {
            localStorage.removeItem('organizationId');
            localStorage.removeItem('user');
            setOrganizationId(null);
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            organizationId,
            login,
            logout,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
