import { apiClient } from '../lib/axios';
import type { ApiResponse, PaymentTransaction } from '../types';

export const paymentGatewayApi = {
  createTransaction: async (billId: string) => {
    const response = await apiClient.post<ApiResponse<PaymentTransaction>>(
      `/bills/${billId}/payment-transactions`,
    );
    return response.data.data;
  },

  getLatestTransaction: async (billId: string) => {
    const response = await apiClient.get<ApiResponse<PaymentTransaction | null>>(
      `/bills/${billId}/payment-transactions/latest`,
    );
    return response.data.data;
  },

  getTransaction: async (billId: string, transactionId: string) => {
    const response = await apiClient.get<ApiResponse<PaymentTransaction>>(
      `/bills/${billId}/payment-transactions/${transactionId}`,
    );
    return response.data.data;
  },
};
