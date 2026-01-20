import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/api';

import type { User, Organization } from '../types/models';

interface AuthContextType {
    user: User | null;
    organization: Organization | null;
    defaultLandingPage: string;
    flags: Record<string, boolean>; // Placeholder for future feature flags
    login: (identifier: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [defaultLandingPage, setDefaultLandingPage] = useState<string>('/rbac/profile');
    const [isLoading, setIsLoading] = useState(true);

    const fetchIdentity = useCallback(async () => {
        try {
            const response = await api.get('/me');
            const data = response.data.data;
            setUser(data.user);
            setOrganization(data.organization);
            setDefaultLandingPage(data.defaultLandingPage || '/rbac/profile');
        } catch (error: any) {
            // fail-silent on 401, just clear state
            setUser(null);
            setOrganization(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchIdentity();
    }, [fetchIdentity]);

    const login = async (identifier: string, password: string) => {
        setIsLoading(true);
        try {
            await api.post('/auth/login', { identifier, password });
            await fetchIdentity(); // Re-fetch full context after login
        } catch (error) {
            setIsLoading(false);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) {
            console.error('Logout failed', e);
        } finally {
            setUser(null);
            setOrganization(null);
            // We can optionally reload the page to clear all memory state
            window.location.href = '/rbac/login';
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            organization,
            defaultLandingPage,
            flags: {}, // Empty for now
            login,
            logout,
            isAuthenticated: !!user,
            isLoading
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
