import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { AUTH_CHANGED_EVENT } from '../api';
import type { User } from '../types';

interface AuthContextType {
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;
    isAuthenticated: boolean;
    logout: () => void;
}

const AUTH_STORAGE_KEY = 'user';

function readStoredUser(): User | null {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!saved) return null;
    try {
        return JSON.parse(saved) as User;
    } catch {
        return null;
    }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(() => readStoredUser());

    // Resync React state from localStorage whenever it changes, regardless of who
    // changed it: the axios interceptor (token refresh / 401), another browser
    // tab, or another component in this tab. Without this, login from one place
    // and refresh from another can leave the UI showing stale auth state.
    useEffect(() => {
        const resync = () => setCurrentUser(readStoredUser());
        window.addEventListener(AUTH_CHANGED_EVENT, resync);
        window.addEventListener('storage', resync);
        return () => {
            window.removeEventListener(AUTH_CHANGED_EVENT, resync);
            window.removeEventListener('storage', resync);
        };
    }, []);

    const handleSetUser = useCallback((user: User | null) => {
        setCurrentUser(user);
        if (user) {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(AUTH_STORAGE_KEY);
        }
        // Notify any same-tab listener (e.g. the api interceptor's clearStoredUser
        // path uses the same channel) so all auth-aware code reads from one source.
        window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT));
    }, []);

    const logout = useCallback(() => {
        // Defensive: if any caller previously set a global Authorization header
        // on the axios singleton, clear it. The current request interceptor sets
        // headers per-request from localStorage, so this is mainly future-proofing.
        delete axios.defaults.headers.common['Authorization'];
        handleSetUser(null);
    }, [handleSetUser]);

    return (
        <AuthContext.Provider
            value={{
                currentUser,
                setCurrentUser: handleSetUser,
                isAuthenticated: !!currentUser,
                logout,
            }}
        >
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
