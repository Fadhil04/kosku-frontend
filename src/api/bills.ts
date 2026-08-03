import { apiClient } from '../lib/axios';
import type { ApiResponse, Bill } from '../types';

export const billsApi = {
  getAll: async (params?: { status?: string; property_id?: string }) => {
    const res = await apiClient.get<ApiResponse<Bill[]>>('/bills', { params });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Bill>>(`/bills/${id}`);
    return res.data.data;
  },

  getOverdue: async () => {
    const res = await apiClient.get<ApiResponse<Bill[]>>('/bills/overdue');
    return res.data.data;
  },

  recordPayment: async (
    billId: string,
    data: {
      idempotency_key: string;
      amount: number;
      payment_method: string;
      payment_date: string;
      reference_number?: string;
    },
  ) => {
    const res = await apiClient.post(`/bills/${billId}/payments`, data);
    return res.data.data;
  },
};