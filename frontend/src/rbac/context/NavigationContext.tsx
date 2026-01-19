import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/api';
import { useAuth } from './AuthContext';

export interface NavChild {
    code: string;
    label: string;
    route: string;
    isVisible: boolean;
    actions: string[];
}

export interface NavModule {
    code: string;
    label: string;
    route: string;
    icon: string;
    isVisible: boolean;
    actions: string[];
    children: NavChild[];
}

interface NavigationContextType {
    modules: NavModule[];
    loading: boolean;
    isLoaded: boolean;
    error: string | null;
    getModule: (code: string) => NavModule | NavChild | undefined;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [modules, setModules] = useState<NavModule[]>([]);
    const [loading, setLoading] = useState(true); // Start true to fail closed
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthenticated) {
            setLoading(true);
            api.get('/me/navigation')
                .then(res => {
                    setModules(res.data.data.modules || []);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Failed to load navigation', err);
                    setError('Failed to load navigation');
                    setLoading(false);
                });
        } else {
            setModules([]);
            setLoading(false);
        }
    }, [isAuthenticated]);

    const getModule = (code: string) => {
        for (const mod of modules) {
            if (mod.code === code) return mod;
            if (mod.children) {
                const child = mod.children.find(c => c.code === code);
                if (child) return child;
            }
        }
        return undefined;
    };

    return (
        <NavigationContext.Provider value={{ modules, loading, isLoaded: !loading, error, getModule }}>
            {children}
        </NavigationContext.Provider>
    );
}

export function useNavigationContext() {
    const context = useContext(NavigationContext);
    if (context === undefined) {
        throw new Error('useNavigationContext must be used within a NavigationProvider');
    }
    return context;
}
