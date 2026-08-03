import { apiClient } from '../lib/axios';
import type { ApiResponse, User } from '../types';

export const authApi = {
  login: async (email: string, password: string, role: 'owner' | 'tenant') => {
    const res = await apiClient.post<ApiResponse<{
      access_token: string;
      refresh_token: string;
      user: User;
    }>>('/auth/login', { email, password, role });
    return res.data.data;
  },

  logout: async (refreshToken: string) => {
    await apiClient.post('/auth/logout', { refresh_token: refreshToken });
  },

  getProfile: async () => {
    const res = await apiClient.get<ApiResponse<User>>('/auth/me');
    return res.data.data;
  },
};