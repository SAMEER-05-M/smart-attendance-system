import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; role: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('sams_token');
    const savedUser = localStorage.getItem('sams_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        // Verify with server in background
        api.getMe()
          .then((res: any) => {
            if (res.success && res.user) {
              setUser(res.user);
              localStorage.setItem('sams_user', JSON.stringify(res.user));
            }
          })
          .catch(() => {
            // Token might be expired, will be caught on next 401
          })
          .finally(() => setIsLoading(false));
        return;
      } catch (e) {
        localStorage.removeItem('sams_token');
        localStorage.removeItem('sams_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      if (res.success && res.token && res.user) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('sams_token', res.token);
        localStorage.setItem('sams_user', JSON.stringify(res.user));
        return { success: true, role: res.user.role };
      }
      throw new Error('Authentication response incomplete');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout().catch(() => {});
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('sams_token');
      localStorage.removeItem('sams_user');
    }
  };

  const refreshUser = async () => {
    try {
      const res: any = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem('sams_user', JSON.stringify(res.user));
      }
    } catch (e) {
      console.error('Failed to refresh user:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
