import { apiClient } from '../lib/axios';
import type { ApiResponse, Tenant } from '../types';

export const tenantsApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const res = await apiClient.get<ApiResponse<Tenant[]>>('/tenants', { params });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Tenant>>(`/tenants/${id}`);
    return res.data.data;
  },

  // Backend tidak butuh password — sistem generate & kirim via email otomatis
  create: async (data: {
    email: string;
    full_name: string;
    phone_number?: string;
    id_card_number?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
  }) => {
    const res = await apiClient.post<ApiResponse<Tenant>>('/tenants', data);
    return res.data.data;
  },

  update: async (
    id: string,
    data: {
      full_name?: string;
      phone_number?: string;
      id_card_number?: string;
      emergency_contact_name?: string;
      emergency_contact_phone?: string;
    },
  ) => {
    const res = await apiClient.put<ApiResponse<Tenant>>(`/tenants/${id}`, data);
    return res.data.data;
  },
};
