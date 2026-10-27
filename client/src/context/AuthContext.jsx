import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';
const AuthContext = createContext(undefined);
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('shelfwise_user');
        return saved ? JSON.parse(saved) : null;
    });
    const [token, setToken] = useState(() => localStorage.getItem('shelfwise_token'));
    const [loading, setLoading] = useState(true);
    const refreshUser = async () => {
        try {
            if (!localStorage.getItem('shelfwise_token')) {
                setUser(null);
                setLoading(false);
                return;
            }
            const res = await api.get('/auth/me');
            if (res.data.success) {
                setUser(res.data.data);
                localStorage.setItem('shelfwise_user', JSON.stringify(res.data.data));
            }
        }
        catch {
            setUser(null);
            localStorage.removeItem('shelfwise_token');
            localStorage.removeItem('shelfwise_user');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        refreshUser();
    }, []);
    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const { token: newToken, user: newUser } = res.data.data;
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('shelfwise_token', newToken);
        localStorage.setItem('shelfwise_user', JSON.stringify(newUser));
        return newUser;
    };
    const register = async (data) => {
        const res = await api.post('/auth/register', data);
        const { token: newToken, user: newUser } = res.data.data;
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('shelfwise_token', newToken);
        localStorage.setItem('shelfwise_user', JSON.stringify(newUser));
        return newUser;
    };
    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('shelfwise_token');
        localStorage.removeItem('shelfwise_user');
    };
    return (<AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>);
};
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context)
        throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
