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
    login: (identifier: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem('user');
            }
        }
    }, []);

    const login = async (identifier: string, password: string) => {
        const response = await api.post('/auth/login', {
            identifier,
            password,
        });

        const { user: newUser } = response.data.data;
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) {
            console.error('Logout request failed:', e);
        } finally {
            localStorage.removeItem('user');
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
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
