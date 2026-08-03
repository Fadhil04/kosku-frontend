import { apiClient } from '../lib/axios';
import type { ApiResponse, DashboardSummary } from '../types';

export const reportsApi = {
  getDashboard: async () => {
    const res = await apiClient.get<ApiResponse<DashboardSummary>>('/reports/dashboard');
    return res.data.data;
  },

  getRevenue: async (propertyId: string, month: number, year: number) => {
    const res = await apiClient.get('/reports/revenue', {
      params: { property_id: propertyId, month, year },
    });
    return res.data.data;
  },

  getOccupancy: async (propertyId: string, year: number) => {
    const res = await apiClient.get('/reports/occupancy', {
      params: { property_id: propertyId, year },
    });
    return res.data.data;
  },

  getPaymentBehavior: async (propertyId: string, months = 6) => {
    const res = await apiClient.get('/reports/payment-behavior', {
      params: { property_id: propertyId, months },
    });
    return res.data.data;
  },

  getComplaintsSummary: async (propertyId: string, month?: number, year?: number) => {
    const res = await apiClient.get('/reports/complaints', {
      params: { property_id: propertyId, month, year },
    });
    return res.data.data;
  },

  getExpiringContracts: async (days = 30, propertyId?: string) => {
    const res = await apiClient.get('/reports/expiring-contracts', {
      params: { days, property_id: propertyId },
    });
    return res.data.data;
  },
};
