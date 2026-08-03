import { apiClient } from '../lib/axios';
import type { ApiResponse, DashboardSummary } from '../types';

export const reportsApi = {
  getDashboard: async () => {
    const res = await apiClient.get<ApiResponse<DashboardSummary>>(
      '/reports/dashboard',
    );
    return res.data.data;
  },

  getRevenue: async (propertyId: string, month: number, year: number) => {
    const res = await apiClient.get('/reports/revenue', {
      params: { property_id: propertyId, month, year },
    });
    return res.data.data;
  },
};