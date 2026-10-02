import { apiClient } from "../../../api/client";
import { components } from "../../../api/schema";

export type AdminLiveActivityResponse = components["schemas"]["AdminLiveActivityResponse"];
export type LiveActivitySummary = components["schemas"]["LiveActivitySummary"];
export type MrLiveActivityItem = components["schemas"]["MrLiveActivityItem"];
export type PendingApprovalsSummary = components["schemas"]["PendingApprovalsSummary"];
export type MrDashboardResponse = components["schemas"]["MrDashboardResponse"];
export type ManagerDashboardResponse = components["schemas"]["ManagerDashboardResponse"];

export const dashboardApi = {
  /**
   * Fetch real-time live field activity and MR states for Admin & Manager (Section 8.2)
   */
  getAdminLiveActivity: async (): Promise<AdminLiveActivityResponse> => {
    const res = await apiClient.get<AdminLiveActivityResponse>(
      "/api/v1/dashboard/admin/live-activity"
    );
    return res.data;
  },

  /**
   * Fetch MR personal daily and monthly KPIs
   */
  getMrDashboard: async (): Promise<MrDashboardResponse> => {
    const res = await apiClient.get<MrDashboardResponse>("/api/v1/dashboard/mr");
    return res.data;
  },

  /**
   * Fetch Manager team overview and pending approvals
   */
  getManagerDashboard: async (): Promise<ManagerDashboardResponse> => {
    const res = await apiClient.get<ManagerDashboardResponse>("/api/v1/dashboard/manager");
    return res.data;
  },
};
