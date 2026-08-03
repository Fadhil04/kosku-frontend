import { apiClient } from '../lib/axios';
import type { ApiResponse, Contract } from '../types';

export const contractsApi = {
  getAll: async (params?: { status?: string; property_id?: string }) => {
    const res = await apiClient.get<ApiResponse<Contract[]>>('/contracts', { params });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Contract>>(`/contracts/${id}`);
    return res.data.data;
  },

  getExpiringSoon: async (days = 30) => {
    const res = await apiClient.get<ApiResponse<Contract[]>>('/contracts/expiring-soon', {
      params: { days },
    });
    return res.data.data;
  },

  create: async (data: {
    room_id: string;
    tenant_id: string;
    start_date: string;
    end_date: string;
    monthly_rent: number;
    deposit_amount?: number;
    billing_date?: number;
    notes?: string;
  }) => {
    const res = await apiClient.post<ApiResponse<Contract>>('/contracts', data);
    return res.data.data;
  },

  terminate: async (
    id: string,
    data: { termination_date: string; termination_reason: string; deposit_action: string },
  ) => {
    const res = await apiClient.patch(`/contracts/${id}/terminate`, data);
    return res.data.data;
  },

  renew: async (id: string, data: { new_end_date: string; new_monthly_rent?: number }) => {
    const res = await apiClient.patch(`/contracts/${id}/renew`, data);
    return res.data.data;
  },
};
