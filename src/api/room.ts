import { apiClient } from '../lib/axios';
import type { ApiResponse, Room, RoomStatus } from '../types';

export const roomsApi = {
  getAll: async (propertyId: string, params?: { status?: string }) => {
    const res = await apiClient.get<ApiResponse<Room[]>>(
      `/properties/${propertyId}/rooms`,
      { params },
    );
    return res.data;
  },

  getAvailable: async (propertyId: string) => {
    const res = await apiClient.get<ApiResponse<Room[]>>(
      `/properties/${propertyId}/rooms/available`,
    );
    return res.data.data;
  },

  getById: async (propertyId: string, roomId: string) => {
    const res = await apiClient.get<ApiResponse<Room>>(
      `/properties/${propertyId}/rooms/${roomId}`,
    );
    return res.data.data;
  },

  create: async (
    propertyId: string,
    data: {
      room_number: string;
      floor?: number;
      type: string;
      base_price: number;
      size_sqm?: number;
      notes?: string;
    },
  ) => {
    const res = await apiClient.post<ApiResponse<Room>>(
      `/properties/${propertyId}/rooms`,
      data,
    );
    return res.data.data;
  },

  updateStatus: async (
    propertyId: string,
    roomId: string,
    status: RoomStatus,
    notes?: string,
  ) => {
    const res = await apiClient.patch<ApiResponse<Room>>(
      `/properties/${propertyId}/rooms/${roomId}/status`,
      { status, notes },
    );
    return res.data.data;
  },

  update: async (
    propertyId: string,
    roomId: string,
    data: {
      floor?: number;
      type?: string;
      base_price?: number;
      size_sqm?: number;
      notes?: string;
    },
  ) => {
    const res = await apiClient.put<ApiResponse<Room>>(
      `/properties/${propertyId}/rooms/${roomId}`,
      data,
    );
    return res.data.data;
  },

  delete: async (propertyId: string, roomId: string) => {
    const res = await apiClient.delete<ApiResponse<null>>(
      `/properties/${propertyId}/rooms/${roomId}`,
    );
    return res.data;
  },
};
