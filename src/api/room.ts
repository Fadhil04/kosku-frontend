import { apiClient } from '../lib/axios';
import type { ApiResponse, Room } from '../types';

export const roomsApi = {
  getAll: async (propertyId: string) => {
    const res = await apiClient.get<ApiResponse<Room[]>>(
      `/properties/${propertyId}/rooms`,
    );
    return res.data;
  },

  updateStatus: async (
    propertyId: string,
    roomId: string,
    status: Room['status'],
    notes?: string,
  ) => {
    const res = await apiClient.patch<ApiResponse<Room>>(
      `/properties/${propertyId}/rooms/${roomId}/status`,
      { status, notes },
    );
    return res.data.data;
  },
};