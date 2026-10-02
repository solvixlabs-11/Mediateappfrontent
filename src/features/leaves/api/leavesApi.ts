import { apiClient } from "../../../api/client";
import { components } from "../../../api/schema";

export type LeaveBalanceDto = components["schemas"]["LeaveBalanceResponse"];
export type LeaveDto = components["schemas"]["LeaveResponse"];
export type LeaveApplyPayload = components["schemas"]["LeaveApplyRequest"];

export const leavesApi = {
  getBalance: async (userId?: number, year?: number): Promise<LeaveBalanceDto> => {
    const res = await apiClient.get<LeaveBalanceDto>("/api/v1/leaves/balance", {
      params: { user_id: userId, year },
    });
    return res.data;
  },

  apply: async (payload: LeaveApplyPayload): Promise<LeaveDto> => {
    const res = await apiClient.post<LeaveDto>("/api/v1/leaves/apply", payload);
    return res.data;
  },

  list: async (): Promise<LeaveDto[]> => {
    const res = await apiClient.get<LeaveDto[]>("/api/v1/leaves/");
    return res.data;
  },

  cancel: async (leaveId: number): Promise<LeaveDto> => {
    const res = await apiClient.post<LeaveDto>(`/api/v1/leaves/${leaveId}/cancel`);
    return res.data;
  },
};

