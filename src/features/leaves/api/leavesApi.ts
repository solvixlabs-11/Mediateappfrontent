import { apiClient } from "../../../api/client";

export interface LeaveBalanceDto {
  user_id: number;
  year: number;
  casual_leave_balance: number;
  sick_leave_balance: number;
  earned_leave_balance: number;
  total_balance: number;
}

export interface LeaveDto {
  id: number;
  user_id: number;
  leave_type: "CASUAL" | "SICK" | "EARNED";
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
  status: "APPLIED" | "APPROVED" | "REJECTED" | "CANCELLED";
  approval_request_id?: number | null;
  rejection_reason?: string | null;
  client_uuid?: string | null;
  created_at: string;
}

export interface LeaveApplyPayload {
  leave_type: "CASUAL" | "SICK" | "EARNED";
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
  client_uuid?: string | null;
}

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
