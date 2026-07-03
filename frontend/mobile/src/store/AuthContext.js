import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(null);

    useEffect(() => {
        async function loadSession() {
            try {
                const storedToken = await AsyncStorage.getItem('flyby_token');
                const storedUser = await AsyncStorage.getItem('flyby_user');
                if (storedToken && storedUser) {
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                }
            } catch (e) {
                console.error('Failed to load session', e);
            } finally {
                setLoading(false);
            }
        }
        loadSession();
    }, []);

    async function signIn(token, user) {
        await AsyncStorage.setItem('flyby_token', token);
        await AsyncStorage.setItem('flyby_user', JSON.stringify(user));
        setToken(token);
        setUser(user);
    }

    async function signOut() {
        await AsyncStorage.removeItem('flyby_token');
        await AsyncStorage.removeItem('flyby_user');
        setToken(null);
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, token, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}