import { apiClient } from "../../../api/client";

export interface TourProgramDto {
  id: number;
  user_id: number;
  title: string;
  start_date: string;
  end_date: string;
  route_details?: string | null;
  objectives?: string | null;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  approval_request_id?: number | null;
  rejection_reason?: string | null;
  created_at: string;
}

export interface TourProgramCreatePayload {
  title: string;
  start_date: string;
  end_date: string;
  route_details?: string | null;
  objectives?: string | null;
}

export const toursApi = {
  create: async (payload: TourProgramCreatePayload): Promise<TourProgramDto> => {
    const res = await apiClient.post<TourProgramDto>("/api/v1/tours/", payload);
    return res.data;
  },

  list: async (params?: { user_id?: number; status?: string }): Promise<TourProgramDto[]> => {
    const res = await apiClient.get<TourProgramDto[]>("/api/v1/tours/", { params });
    return res.data;
  },

  getUpcoming: async (): Promise<TourProgramDto[]> => {
    const res = await apiClient.get<TourProgramDto[]>("/api/v1/tours/upcoming");
    return res.data;
  },
};
