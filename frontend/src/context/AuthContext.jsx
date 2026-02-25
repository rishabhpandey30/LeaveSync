import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

// ── Context creation ──────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ── Storage helpers ───────────────────────────────────────────────────────────
const TOKEN_KEY = 'lms_token';
const USER_KEY = 'lms_user';

const saveToStorage = (user, token) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const clearStorage = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
};

// ── Provider ──────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem(USER_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch { return null; }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ── Verify token on mount (get fresh user from server) ───────────────────
    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            verifyToken();
        } else {
            setLoading(false);
        }
    }, []);

    const verifyToken = async () => {
        try {
            const { data } = await api.get('/auth/me');
            if (data.success) {
                setUser(data.data);
                saveToStorage(data.data, null);
            }
        } catch {
            clearStorage();
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    // ── Login ─────────────────────────────────────────────────────────────────
    const login = useCallback(async (email, password) => {
        setError(null);
        try {
            const { data } = await api.post('/auth/login', { email, password });
            if (data.success) {
                const { token, ...userData } = data.data;
                saveToStorage(userData, token);
                setUser(userData);
                return { success: true };
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed. Please try again.';
            setError(msg);
            return { success: false, message: msg };
        }
    }, []);

    // ── Register ──────────────────────────────────────────────────────────────
    const register = useCallback(async (formData) => {
        setError(null);
        try {
            const { data } = await api.post('/auth/register', formData);
            if (data.success) {
                const { token, ...userData } = data.data;
                saveToStorage(userData, token);
                setUser(userData);
                return { success: true };
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Registration failed.';
            const errors = err.response?.data?.errors;
            setError(msg);
            return { success: false, message: msg, errors };
        }
    }, []);

    // ── Logout ────────────────────────────────────────────────────────────────
    const logout = useCallback(() => {
        clearStorage();
        setUser(null);
        setError(null);
    }, []);

    // ── Update profile in context ─────────────────────────────────────────────
    const updateUserInContext = useCallback((updatedUser) => {
        setUser((prev) => ({ ...prev, ...updatedUser }));
        saveToStorage({ ...user, ...updatedUser }, null);
    }, [user]);

    // ── Refresh user from server ──────────────────────────────────────────────
    const refreshUser = useCallback(async () => {
        try {
            const { data } = await api.get('/auth/me');
            if (data.success) {
                setUser(data.data);
                saveToStorage(data.data, null);
            }
        } catch {/* silent */ }
    }, []);

    // ── Computed helpers ──────────────────────────────────────────────────────
    const isAdmin = user?.role === 'admin';
    const isManager = user?.role === 'manager';
    const isEmployee = user?.role === 'employee';
    const isAuthenticated = !!user;

    const value = {
        user,
        loading,
        error,
        isAuthenticated,
        isAdmin,
        isManager,
        isEmployee,
        login,
        register,
        logout,
        updateUserInContext,
        refreshUser,
        clearError: () => setError(null),
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ── Custom hook ───────────────────────────────────────────────────────────────
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
