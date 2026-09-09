"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { checkAuth as checkAuthApi, login as loginApi, logout as logoutApi } from "@/lib/api/auth";

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: string;
  isActive: boolean;
  mustChangePassword?: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean | null;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: null,
  user: null,
  login: async () => {},
  logout: async () => {},
  checkAuth: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  const checkAuth = async () => {
    try {
      const response = await checkAuthApi();
      const user: User = {
        id: response.id,
        username: response.username,
        displayName: response.display_name,
        role: response.role,
        isActive: response.is_active,
        mustChangePassword: response.must_change_password,
      };
      setUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    await loginApi(username, password);
    await checkAuth();
  };

  const logout = async () => {
    try {
      await logoutApi();
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      router.push("/login");
    }
  };

  return <AuthContext.Provider value={{ isAuthenticated, user, login, logout, checkAuth }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
