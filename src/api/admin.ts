import { apiClient } from "../lib/axios";
import type { ApiResponse } from "../types";

export const adminApi = {
  triggerBillReminders: async () => {
    const res = await apiClient.post<ApiResponse<{ jobId: string }>>("/admin/trigger/bill-reminders");
    return res.data;
  },

  triggerMonthlyBills: async () => {
    const res = await apiClient.post<ApiResponse<{ jobId: string }>>("/admin/trigger/monthly-bills");
    return res.data;
  },

  triggerExpiringContracts: async () => {
    const res = await apiClient.post<ApiResponse<{ jobId: string }>>("/admin/trigger/expiring-contracts");
    return res.data;
  },

  triggerBackfill: async () => {
    const res = await apiClient.post<ApiResponse<{ updated: number }>>("/admin/backfill/tenant-owner");
    return res.data;
  },
};
