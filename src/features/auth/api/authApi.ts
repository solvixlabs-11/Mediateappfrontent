import { apiClient } from "../../../api/client";
import { components } from "../../../api/schema";

export type LoginRequest = components["schemas"]["LoginRequest"];
export type TokenResponse = components["schemas"]["TokenResponse"];
export type UserSummary = components["schemas"]["UserSummary"];
export type ChangePasswordRequest = components["schemas"]["ChangePasswordRequest"];
export type RegisterRequest = components["schemas"]["RegisterRequest"];
export type MessageResponse = components["schemas"]["MessageResponse"];
export type AuthConfigResponse = components["schemas"]["AuthConfigResponse"];
export type DemoAccount = components["schemas"]["DemoAccount"];

export const authApi = {
  getConfig: async (): Promise<AuthConfigResponse> => {
    const res = await apiClient.get<AuthConfigResponse>("/api/v1/auth/config");
    return res.data;
  },

  login: async (credentials: LoginRequest): Promise<TokenResponse> => {
    const res = await apiClient.post<TokenResponse>("/api/v1/auth/login", credentials);
    return res.data;
  },

  getMe: async (): Promise<UserSummary> => {
    const res = await apiClient.get<UserSummary>("/api/v1/auth/me");
    return res.data;
  },

  logout: async (refreshToken?: string): Promise<MessageResponse> => {
    const res = await apiClient.post<MessageResponse>("/api/v1/auth/logout", {
      refresh_token: refreshToken,
    });
    return res.data;
  },

  logoutAll: async (): Promise<MessageResponse> => {
    const res = await apiClient.post<MessageResponse>("/api/v1/auth/logout-all");
    return res.data;
  },

  changePassword: async (payload: ChangePasswordRequest): Promise<MessageResponse> => {
    const res = await apiClient.post<MessageResponse>("/api/v1/auth/change-password", payload);
    return res.data;
  },

  register: async (payload: RegisterRequest): Promise<UserSummary> => {
    const res = await apiClient.post<UserSummary>("/api/v1/auth/register", payload);
    return res.data;
  },
};
