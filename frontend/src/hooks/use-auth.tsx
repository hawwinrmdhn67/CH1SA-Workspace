"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { checkAuth as checkAuthApi, login as loginApi, logout as logoutApi } from "@/lib/api/auth";

interface AuthContextType {
  isAuthenticated: boolean | null;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: null,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuthApi()
      .then(() => setIsAuthenticated(true))
      .catch(() => setIsAuthenticated(false));
  }, []);

  const login = async (password: string) => {
    await loginApi(password);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await logoutApi();
    } finally {
      setIsAuthenticated(false);
      router.push("/login");
    }
  };

  return <AuthContext.Provider value={{ isAuthenticated, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
