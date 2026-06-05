"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { AuthUser } from "@/types";
import { authApi } from "@/lib/api";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    localStorage.setItem("crm_token", newToken);
    // Set cookie that expires in 30 days
    document.cookie = `crm_token=${newToken}; path=/; max-age=${30 * 24 * 60 * 60}; samesite=lax`;
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("crm_token");
    // Clear cookie
    document.cookie = "crm_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      logout();
    }
  }, [logout]);

  useEffect(() => {
    const stored = localStorage.getItem("crm_token");
    if (!stored) {
      setLoading(false);
      return;
    }
    setToken(stored);
    authApi
      .me()
      .then((me) => setUser(me))
      .catch(() => {
        localStorage.removeItem("crm_token");
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
