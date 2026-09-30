import { apiClient } from "../../../api/client";
import {
  CreateUserPayload,
  FileUploadResponse,
  ManagerAssignmentResponse,
  ManagerSummary,
  RoleSummary,
  UpdateProfilePayload,
  UpdateUserPayload,
  UserDetail,
  UserListResponse,
} from "../types";

export const usersApi = {
  /** Get all available system roles */
  getRoles: async (): Promise<RoleSummary[]> => {
    const res = await apiClient.get<RoleSummary[]>("/api/v1/users/roles");
    return res.data;
  },

  /** Get list of active managers for dropdowns */
  getManagers: async (): Promise<ManagerSummary[]> => {
    const res = await apiClient.get<ManagerSummary[]>("/api/v1/users/managers");
    return res.data;
  },

  /** Get team members for logged-in manager */
  getMyTeam: async (): Promise<UserDetail[]> => {
    const res = await apiClient.get<UserDetail[]>("/api/v1/users/my-team");
    return res.data;
  },

  /** Get profile of current user with manager info */
  getProfile: async (): Promise<UserDetail> => {
    const res = await apiClient.get<UserDetail>("/api/v1/users/me/profile");
    return res.data;
  },

  /** Update current user's profile */
  updateProfile: async (payload: UpdateProfilePayload): Promise<UserDetail> => {
    const res = await apiClient.put<UserDetail>("/api/v1/users/me/profile", payload);
    return res.data;
  },

  /** List users with filters and pagination */
  listUsers: async (params?: {
    role?: string;
    search?: string;
    is_active?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<UserListResponse> => {
    const res = await apiClient.get<UserListResponse>("/api/v1/users", { params });
    return res.data;
  },

  /** Get detailed user by ID */
  getUser: async (userId: number): Promise<UserDetail> => {
    const res = await apiClient.get<UserDetail>(`/api/v1/users/${userId}`);
    return res.data;
  },

  /** Create new user (Admin) */
  createUser: async (payload: CreateUserPayload): Promise<UserDetail> => {
    const res = await apiClient.post<UserDetail>("/api/v1/users", payload);
    return res.data;
  },

  /** Update user attributes (Admin) */
  updateUser: async (userId: number, payload: UpdateUserPayload): Promise<UserDetail> => {
    const res = await apiClient.put<UserDetail>(`/api/v1/users/${userId}`, payload);
    return res.data;
  },

  /** Toggle user active status (BR-14 revokes session) */
  updateStatus: async (
    userId: number,
    isActive: boolean,
    reason?: string
  ): Promise<UserDetail> => {
    const res = await apiClient.patch<UserDetail>(`/api/v1/users/${userId}/status`, {
      is_active: isActive,
      reason,
    });
    return res.data;
  },

  /** Assign MR to a Manager */
  assignManager: async (
    mrId: number,
    managerId: number
  ): Promise<ManagerAssignmentResponse> => {
    const res = await apiClient.post<ManagerAssignmentResponse>(
      `/api/v1/users/${mrId}/assign-manager`,
      { manager_id: managerId }
    );
    return res.data;
  },

  /** View manager assignment history for an MR */
  getAssignmentHistory: async (mrId: number): Promise<ManagerAssignmentResponse[]> => {
    const res = await apiClient.get<ManagerAssignmentResponse[]>(
      `/api/v1/users/${mrId}/assignments`
    );
    return res.data;
  },

  /** Upload file or photo through StorageProvider */
  uploadFile: async (
    fileUri: string,
    filename: string,
    mimeType: string = "image/jpeg"
  ): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append("file", {
      uri: fileUri,
      name: filename,
      type: mimeType,
    } as unknown as Blob);

    const res = await apiClient.post<FileUploadResponse>("/api/v1/files/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },
};
