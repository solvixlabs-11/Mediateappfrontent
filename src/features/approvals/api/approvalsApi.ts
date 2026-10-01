import { apiClient } from "../../../api/client";

export interface ApprovalRequestDto {
  id: number;
  entity_type: string;
  entity_id: number;
  requester_id: number;
  requester_name: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  current_step: number;
  total_steps: number;
  title: string;
  details: string | null;
  created_at: string;
}

export interface ApprovalDecisionPayload {
  decision: "APPROVED" | "REJECTED";
  comments?: string | null;
}

export const approvalsApi = {
  getPendingCount: async (): Promise<number> => {
    const res = await apiClient.get<{ pending_count: number }>("/api/v1/approvals/pending-count");
    return res.data.pending_count;
  },

  getInbox: async (): Promise<ApprovalRequestDto[]> => {
    const res = await apiClient.get<ApprovalRequestDto[]>("/api/v1/approvals/inbox");
    return res.data;
  },

  getMyRequests: async (): Promise<ApprovalRequestDto[]> => {
    const res = await apiClient.get<ApprovalRequestDto[]>("/api/v1/approvals/my-requests");
    return res.data;
  },

  processDecision: async (
    requestId: number,
    payload: ApprovalDecisionPayload
  ): Promise<ApprovalRequestDto> => {
    const res = await apiClient.post<ApprovalRequestDto>(
      `/api/v1/approvals/${requestId}/decision`,
      payload
    );
    return res.data;
  },
};
