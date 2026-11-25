'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  login: (token: string, user: AdminUser) => void;
  updateUser: (partial: Partial<AdminUser>) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  updateUser: () => {},
  refreshUser: async () => {},
  logout: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const syncProfile = async (authToken: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
      const res = await fetch(`${baseUrl}/auth/super-admin/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const json = await res.json();
        const profile = json.data || json;
        if (profile && profile.name) {
          setUser((prev) => {
            const updated = {
              id: profile.id,
              email: profile.email,
              name: profile.name,
              role: profile.role,
              avatarUrl: profile.avatarUrl,
            };
            localStorage.setItem('webin10_admin_user', JSON.stringify(updated));
            return updated;
          });
        }
      }
    } catch {
      // Ignore background sync errors
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('webin10_admin_token');
    const savedUser = localStorage.getItem('webin10_admin_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        syncProfile(savedToken);
      } catch {
        localStorage.removeItem('webin10_admin_token');
        localStorage.removeItem('webin10_admin_user');
      }
    } else if (pathname !== '/login') {
      router.push('/login');
    }
    setIsLoading(false);
  }, [pathname, router]);

  const login = (newToken: string, newUser: AdminUser) => {
    localStorage.setItem('webin10_admin_token', newToken);
    localStorage.setItem('webin10_admin_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    router.push('/');
  };

  const updateUser = (partial: Partial<AdminUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...partial };
      localStorage.setItem('webin10_admin_user', JSON.stringify(next));
      return next;
    });
  };

  const refreshUser = async () => {
    const currentToken = token || localStorage.getItem('webin10_admin_token');
    if (currentToken) {
      await syncProfile(currentToken);
    }
  };

  const logout = () => {
    localStorage.removeItem('webin10_admin_token');
    localStorage.removeItem('webin10_admin_user');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, updateUser, refreshUser, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
