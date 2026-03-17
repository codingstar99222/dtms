// frontend/src/services/dashboard.service.ts
import api from "./api";
import type { DashboardSummary } from "../types";

export const dashboardService = {
  async getSummary(
    startDate?: string,
    endDate?: string,
  ): Promise<DashboardSummary> {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await api.get(`/dashboard/summary?${params.toString()}`);
    return response.data;
  },

  async getMemberDashboard(
    userId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<DashboardSummary> {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await api.get(
      `/dashboard/member/${userId}?${params.toString()}`,
    );
    return response.data;
  },
};
