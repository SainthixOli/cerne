import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { AuthContext } from './authContext';
import { subscribeToForbidden, subscribeToUnauthorized } from '../services/sessionEvents';
import toast from 'react-hot-toast';

export default function AuthProvider({ children }) {
    const queryClient = useQueryClient();
    const [user, setUser] = useState(null);
    const [status, setStatus] = useState('loading');

    const clearSession = useCallback(() => {
        setUser(null);
        setStatus('anonymous');
        queryClient.clear();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }, [queryClient]);

    const refreshSession = useCallback(async () => {
        try {
            const response = await api.get('/auth/session', {
                silent: true,
                skipAuthHandling: true
            });
            setUser(response.data.user);
            setStatus('authenticated');
            return response.data.user;
        } catch (error) {
            if (error.status === 401) {
                clearSession();
                return null;
            }
            setStatus('error');
            throw error;
        }
    }, [clearSession]);

    useEffect(() => {
        refreshSession().catch(() => {});
        const unsubscribeUnauthorized = subscribeToUnauthorized(clearSession);
        const unsubscribeForbidden = subscribeToForbidden(() => {
            toast.error('Você não tem permissão para executar esta operação.');
        });
        return () => {
            unsubscribeUnauthorized();
            unsubscribeForbidden();
        };
    }, [clearSession, refreshSession]);

    const login = useCallback(async (credentials) => {
        const response = await api.post('/auth/login', credentials, { skipAuthHandling: true });
        setUser(response.data.user);
        setStatus('authenticated');
        return response.data.user;
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.post('/auth/logout', {}, { silent: true, skipAuthHandling: true });
        } finally {
            clearSession();
        }
    }, [clearSession]);

    const updateUser = useCallback((patch) => {
        setUser((current) => current ? { ...current, ...patch } : current);
    }, []);

    const value = useMemo(() => ({
        user,
        status,
        isAuthenticated: status === 'authenticated',
        login,
        logout,
        refreshSession,
        updateUser
    }), [user, status, login, logout, refreshSession, updateUser]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
