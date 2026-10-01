import { apiClient } from "../../../api/client";

export interface AttendanceDto {
  id: number;
  user_id: number;
  date: string;
  status: string;
  check_in_time?: string | null;
  check_in_latitude?: number | null;
  check_in_longitude?: number | null;
  check_in_address?: string | null;
  check_in_accuracy?: number | null;
  check_in_mock_flag: boolean;
  check_out_time?: string | null;
  check_out_latitude?: number | null;
  check_out_longitude?: number | null;
  check_out_address?: string | null;
  check_out_accuracy?: number | null;
  check_out_mock_flag: boolean;
  total_work_minutes?: number | null;
  remarks?: string | null;
  created_at: string;
}

export const attendanceApi = {
  getToday: async (): Promise<AttendanceDto | null> => {
    const res = await apiClient.get<AttendanceDto | null>("/api/v1/attendance/today");
    return res.data;
  },

  checkIn: async (data: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
    remarks?: string;
    client_uuid?: string;
  }): Promise<AttendanceDto> => {
    const res = await apiClient.post<AttendanceDto>("/api/v1/attendance/check-in", data);
    return res.data;
  },

  checkOut: async (data: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
    remarks?: string;
  }): Promise<AttendanceDto> => {
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
