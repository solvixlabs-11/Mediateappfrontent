import { apiClient } from "../../../api/client";
import { components } from "../../../api/schema";

export type NotificationDto = components["schemas"]["NotificationResponse"];
export type NotificationSummaryDto = components["schemas"]["NotificationSummaryResponse"];
export type DeviceTokenRegisterPayload = components["schemas"]["DeviceTokenRegisterRequest"];
export type DeviceTokenDto = components["schemas"]["DeviceTokenResponse"];

export interface NotificationFilterParams {
  unread_only?: boolean;
  notification_type?: string;
  skip?: number;
  limit?: number;
}

export const notificationsApi = {
  getSummary: async (): Promise<NotificationSummaryDto> => {
    const res = await apiClient.get<NotificationSummaryDto>("/api/v1/notifications/summary");
    return res.data;
  },

  list: async (params?: NotificationFilterParams): Promise<NotificationDto[]> => {
    const res = await apiClient.get<NotificationDto[]>("/api/v1/notifications", { params });
    return res.data;
  },

  markRead: async (id: number): Promise<NotificationDto> => {
    const res = await apiClient.post<NotificationDto>(`/api/v1/notifications/${id}/read`);
    return res.data;
  },

  markAllRead: async (): Promise<{ marked_read_count: number }> => {
    const res = await apiClient.post<{ marked_read_count: number }>("/api/v1/notifications/read-all");
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/notifications/${id}`);
  },

  registerDeviceToken: async (payload: DeviceTokenRegisterPayload): Promise<DeviceTokenDto> => {
    const res = await apiClient.post<DeviceTokenDto>("/api/v1/notifications/device-token", payload);
    return res.data;
  },
};
