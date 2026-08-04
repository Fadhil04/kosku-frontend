import { apiClient } from "../lib/axios";
import type { ApiResponse, User } from "../types";

const normalizeUser = (user: unknown): User => {
  const source = user as Partial<User> & Record<string, unknown>;

  return {
    id: String(source.id ?? ""),
    email: String(source.email ?? ""),
    full_name: String(
      (source.full_name as string | undefined) ??
      (source.fullName as string | undefined) ??
      "",
    ),
    role: (source.role as "owner" | "tenant") ?? "owner",
    phone_number:
      (source.phone_number as string | null | undefined) ??
      (source.phoneNumber as string | null | undefined) ??
      null,
    avatar_url:
      (source.avatar_url as string | null | undefined) ??
      (source.avatarUrl as string | null | undefined) ??
      null,
  };
};

export const authApi = {
  login: async (email: string, password: string, role?: "owner" | "tenant") => {
    const res = await apiClient.post<
      ApiResponse<{
        access_token: string;
        refresh_token: string;
        user: User;
      }>
    >("/auth/login", { email, password, ...(role ? { role } : {}) });
    return {
      ...res.data.data,
      user: normalizeUser(res.data.data.user),
    };
  },

  logout: async (refreshToken: string) => {
    await apiClient.post("/auth/logout", { refresh_token: refreshToken });
  },

  getProfile: async () => {
    const res = await apiClient.get<ApiResponse<User>>("/auth/me");
    return normalizeUser(res.data.data);
  },

  forgotPassword: async (email: string, role: "owner" | "tenant") => {
    const res = await apiClient.post<ApiResponse<null>>("/auth/forgot-password", { email, role });
    return res.data;
  },

  resetPassword: async (data: { token: string; new_password: string; confirm_password: string }) => {
    const res = await apiClient.post<ApiResponse<null>>("/auth/reset-password", data);
    return res.data;
  },
};
