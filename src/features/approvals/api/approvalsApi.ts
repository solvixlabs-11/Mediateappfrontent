import { apiClient } from "../../../api/client";
import { components } from "../../../api/schema";

export type ApprovalRequestDto = components["schemas"]["ApprovalRequestResponse"];
export type ApprovalDecisionPayload = components["schemas"]["ApprovalDecisionRequest"];

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

