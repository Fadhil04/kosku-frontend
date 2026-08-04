import { apiClient } from '../lib/axios';
import type { ApiResponse, Bill, Payment } from '../types';

export const billsApi = {
  getAll: async (params?: { status?: string; property_id?: string; page?: number; limit?: number }) => {
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

  getPayments: async (billId: string) => {
    const res = await apiClient.get(`/bills/${billId}/payments`);
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

  applyDiscount: async (
    billId: string,
    data: { discount_amount: number; discount_reason: string },
  ) => {
    const res = await apiClient.patch(`/bills/${billId}/discount`, data);
    return res.data.data;
  },

  waiveBill: async (billId: string, data: { reason: string }) => {
    const res = await apiClient.patch(`/bills/${billId}/waive`, data);
    return res.data.data;
  },

  getPaymentById: async (paymentId: string) => {
    const res = await apiClient.get<ApiResponse<Payment>>(`/payments/${paymentId}`);
    return res.data.data;
  },
};
