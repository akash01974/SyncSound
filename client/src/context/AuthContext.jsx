import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('syncsound_token'));
    const [loading, setLoading] = useState(true);

    const api = axios.create({
        baseURL: '/api',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    // Update axios headers when token changes
    useEffect(() => {
        if (token) {
            api.defaults.headers.Authorization = `Bearer ${token}`;
        } else {
            delete api.defaults.headers.Authorization;
        }
    }, [token]);

    const fetchUser = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const res = await axios.get('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(res.data);
        } catch (err) {
            console.error('Auth error:', err);
            localStorage.removeItem('syncsound_token');
            setToken(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const login = async (email, password) => {
        const res = await axios.post('/api/auth/login', { email, password });
        const { token: newToken, user: userData } = res.data;
        localStorage.setItem('syncsound_token', newToken);
        setToken(newToken);
        setUser(userData);
        return userData;
    };

    const signup = async (username, email, password) => {
        const res = await axios.post('/api/auth/signup', { username, email, password });
        const { token: newToken, user: userData } = res.data;
        localStorage.setItem('syncsound_token', newToken);
        setToken(newToken);
        setUser(userData);
        return userData;
    };

    const logout = () => {
        localStorage.removeItem('syncsound_token');
        setToken(null);
        setUser(null);
    };

    const updateProfile = async (updates) => {
        const res = await api.put('/users/profile', updates);
        setUser(res.data);
        return res.data;
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, signup, logout, updateProfile, api, fetchUser }}>
            {children}
        </AuthContext.Provider>
    );
}
