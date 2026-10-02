import { apiClient } from "../../../api/client";
import { components } from "../../../api/schema";

export type TaskDto = components["schemas"]["TaskResponse"];
export type TaskCreatePayload = components["schemas"]["TaskCreate"];
export type TaskUpdatePayload = components["schemas"]["TaskUpdate"];
export type TaskCommentDto = components["schemas"]["TaskCommentResponse"];
export type TaskCommentCreatePayload = components["schemas"]["TaskCommentCreate"];
export type TaskSummaryDto = components["schemas"]["TaskSummaryResponse"];

export interface TaskFilterParams {
  status?: string;
  priority?: string;
  due_date?: string;
  overdue_only?: boolean;
  today_only?: boolean;
  upcoming_only?: boolean;
  search?: string;
  skip?: number;
  limit?: number;
}

export const tasksApi = {
  getSummary: async (): Promise<TaskSummaryDto> => {
    const res = await apiClient.get<TaskSummaryDto>("/api/v1/tasks/summary");
    return res.data;
  },

  list: async (params?: TaskFilterParams): Promise<TaskDto[]> => {
    const res = await apiClient.get<TaskDto[]>("/api/v1/tasks", { params });
    return res.data;
  },

  getById: async (id: number): Promise<TaskDto> => {
    const res = await apiClient.get<TaskDto>(`/api/v1/tasks/${id}`);
    return res.data;
  },

  create: async (payload: TaskCreatePayload): Promise<TaskDto> => {
    const res = await apiClient.post<TaskDto>("/api/v1/tasks", payload);
    return res.data;
  },

  update: async (id: number, payload: TaskUpdatePayload): Promise<TaskDto> => {
    const res = await apiClient.put<TaskDto>(`/api/v1/tasks/${id}`, payload);
    return res.data;
  },

  toggleComplete: async (id: number): Promise<TaskDto> => {
    const res = await apiClient.post<TaskDto>(`/api/v1/tasks/${id}/complete`);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/tasks/${id}`);
  },

  addComment: async (taskId: number, payload: TaskCommentCreatePayload): Promise<TaskCommentDto> => {
    const res = await apiClient.post<TaskCommentDto>(`/api/v1/tasks/${taskId}/comments`, payload);
    return res.data;
  },
};
