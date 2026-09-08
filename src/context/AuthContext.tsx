import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiMe, apiLogin, apiRegister, apiLogout, ServerUser } from '../utils/api';

export interface AuthContextType {
  user: ServerUser | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ServerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiMe()
      .then(res => setUser(res.user))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const res = await apiLogin(email, password);
      setUser(res.user);
    } catch (err: any) {
      setError(err.message || 'Could not sign in.');
      throw err;
    }
  }, []);

  const register = useCallback(async (email: string, password: string, displayName?: string) => {
    setError(null);
    try {
      const res = await apiRegister(email, password, displayName);
      setUser(res.user);
    } catch (err: any) {
      setError(err.message || 'Could not create account.');
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    await apiLogout().catch(() => {});
    setUser(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
