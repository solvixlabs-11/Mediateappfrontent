import { apiClient } from "../../../api/client";
import { components } from "../../../api/schema";

export type AttendanceDto = components["schemas"]["AttendanceResponse"];
export type AttendanceCheckInRequest = components["schemas"]["AttendanceCheckInRequest"];
export type AttendanceCheckOutRequest = components["schemas"]["AttendanceCheckOutRequest"];

export const attendanceApi = {
  getToday: async (): Promise<AttendanceDto | null> => {
    const res = await apiClient.get<AttendanceDto | null>("/api/v1/attendance/today");
    return res.data;
  },

  checkIn: async (data: AttendanceCheckInRequest): Promise<AttendanceDto> => {
    const res = await apiClient.post<AttendanceDto>("/api/v1/attendance/check-in", data);
    return res.data;
  },

  checkOut: async (data: AttendanceCheckOutRequest): Promise<AttendanceDto> => {
    const res = await apiClient.post<AttendanceDto>("/api/v1/attendance/check-out", data);
    return res.data;
  },

  getHistory: async (params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<AttendanceDto[]> => {
    const res = await apiClient.get<AttendanceDto[]>("/api/v1/attendance/history", { params });
    return res.data;
  },
};

