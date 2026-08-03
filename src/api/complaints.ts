import { apiClient } from '../lib/axios';
import type { ApiResponse, Complaint } from '../types';

export const complaintsApi = {
  getAll: async (params?: { status?: string; property_id?: string }) => {
    const res = await apiClient.get<ApiResponse<Complaint[]>>('/complaints', {
      params,
    });
    return res.data;
  },

  updateStatus: async (
    id: string,
    status: string,
    note?: string,
  ) => {
    const res = await apiClient.patch(`/complaints/${id}/status`, {
      status,
      note,
    });
    return res.data.data;
  },
};