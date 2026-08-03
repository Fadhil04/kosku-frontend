import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { authApi } from "../api/auth";
import { apiClient } from "../lib/axios";
import { AuthContext } from "./auth-context";
import type { User } from "../types";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      authApi
        .getProfile()
        .then((user) => {
          setUser(user);
          // Backfill tenant lama yang belum punya createdByOwnerId
          if (user.role === 'owner') {
            apiClient.post('/admin/backfill/tenant-owner').catch(() => {});
          }
        })
        .catch(() => localStorage.clear())
        .finally(() => setIsLoading(false));
    } else {
      const timer = window.setTimeout(() => setIsLoading(false), 0);
      return () => window.clearTimeout(timer);
    }
  }, []);

  const login = async (
    email: string,
    password: string,
    role: "owner" | "tenant",
  ) => {
    const data = await authApi.login(email, password, role);
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    setUser(data.user);

    // Backfill createdByOwnerId untuk tenant lama yang belum punya
    // Dipanggil sekali setelah login, aman diulang (idempotent)
    if (role === 'owner') {
      apiClient.post('/admin/backfill/tenant-owner').catch(() => {
        // Bukan operasi kritis — gagal tidak masalah
      });
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("refresh_token") || "";
    await authApi.logout(refreshToken).catch(() => {});
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
