import { apiClient } from "../lib/axios";
import type { ApiResponse, Complaint } from "../types";

export const complaintsApi = {
  getAll: async (params?: {
    status?: string;
    property_id?: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await apiClient.get<ApiResponse<Complaint[]>>("/complaints", {
      params,
    });
    return res.data;
  },

  createComplaint: async (data: {
    room_id: string;
    title: string;
    description: string;
    category:
      | "FACILITY_DAMAGE"
      | "NEIGHBOR_DISTURBANCE"
      | "CLEANLINESS"
      | "SECURITY"
      | "OTHER";
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  }) => {
    const res = await apiClient.post<ApiResponse<Complaint>>(
      "/complaints",
      data,
    );
    return res.data.data;
  },

  getById: async (id: string) => {
    const res = await apiClient.get(`/complaints/${id}`);
    return res.data.data;
  },

  updateStatus: async (id: string, status: string, note?: string) => {
    const res = await apiClient.patch(`/complaints/${id}/status`, {
      status,
      note,
    });
    return res.data.data;
  },

  addResponse: async (id: string, message: string) => {
    const res = await apiClient.post(`/complaints/${id}/responses`, {
      message,
    });
    return res.data.data;
  },

  getSummary: async () => {
    const res = await apiClient.get<{
      data: {
        total: number;
        open: number;
        in_progress: number;
        resolved: number;
        closed: number;
        by_priority: Record<string, number>;
        by_category: Record<string, number>;
      };
    }>("/complaints/summary");
    return res.data.data;
  },
};
