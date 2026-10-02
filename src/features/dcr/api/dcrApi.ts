import { apiClient } from "../../../api/client";
import { components } from "../../../api/schema";

export type PlannedVisitDto = components["schemas"]["PlannedVisitResponse"];
export type PlannedVisitCreatePayload = components["schemas"]["PlannedVisitCreate"];
export type PostCallAnalysisDto = components["schemas"]["DcrPostCallAnalysisResponse"];
export type ProductDetailDto = components["schemas"]["DcrProductDetailResponse"];
export type DcrVisitDto = components["schemas"]["DcrVisitResponse"];
export type DcrVisitCreatePayload = components["schemas"]["DcrVisitCreate"];
export type FollowUpDto = components["schemas"]["FollowUpResponse"];
export type FollowUpCreatePayload = components["schemas"]["FollowUpCreate"];
export type DcrDailySummaryDto = components["schemas"]["DcrDailySummary"];

export const dcrApi = {
  // PLANS
  createPlan: async (data: PlannedVisitCreatePayload): Promise<PlannedVisitDto> => {
    const res = await apiClient.post<PlannedVisitDto>("/api/v1/dcr/plans", data);
    return res.data;
  },

  listPlans: async (params?: {
    plan_date?: string;
    status?: string;
  }): Promise<PlannedVisitDto[]> => {
    const res = await apiClient.get<PlannedVisitDto[]>("/api/v1/dcr/plans", { params });
    return res.data;
  },

  // DCR VISITS
  submitDcr: async (data: DcrVisitCreatePayload): Promise<DcrVisitDto> => {
    const res = await apiClient.post<DcrVisitDto>("/api/v1/dcr/visits", data);
    return res.data;
  },

  listVisits: async (params?: {
    dcr_date?: string;
    customer_type?: string;
  }): Promise<DcrVisitDto[]> => {
    const res = await apiClient.get<DcrVisitDto[]>("/api/v1/dcr/visits", { params });
    return res.data;
  },

  getSummary: async (date?: string): Promise<DcrDailySummaryDto> => {
    const res = await apiClient.get<DcrDailySummaryDto>("/api/v1/dcr/summary", {
      params: { dcr_date: date },
    });
    return res.data;
  },

  // FOLLOW-UPS
  listFollowUps: async (params?: {
    status?: string;
    overdue_only?: boolean;
  }): Promise<FollowUpDto[]> => {
    const res = await apiClient.get<FollowUpDto[]>("/api/v1/dcr/follow-ups", { params });
    return res.data;
  },

  completeFollowUp: async (id: number): Promise<FollowUpDto> => {
    const res = await apiClient.post<FollowUpDto>(`/api/v1/dcr/follow-ups/${id}/complete`);
    return res.data;
  },
};

