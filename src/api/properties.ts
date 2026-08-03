import { apiClient } from '../lib/axios';
import type { ApiResponse, Property } from '../types';

export const propertiesApi = {
  getAll: async () => {
    const res = await apiClient.get<ApiResponse<Property[]>>('/properties');
    return res.data;
  },

  getById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Property>>(`/properties/${id}`);
    return res.data.data;
  },

  create: async (data: {
    name: string;
    address: string;
    city: string;
    province: string;
    postal_code?: string;
  }) => {
    const res = await apiClient.post<ApiResponse<Property>>('/properties', data);
    return res.data.data;
  },
};