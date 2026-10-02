import { apiClient } from "../../../api/client";
import { components } from "../../../api/schema";

export type TourProgramDto = components["schemas"]["TourProgramResponse"];
export type TourProgramCreatePayload = components["schemas"]["TourProgramCreateRequest"];

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

