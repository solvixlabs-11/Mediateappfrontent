import { apiClient } from "../../../api/client";
import { components } from "../../../api/schema";

export type OrderDto = components["schemas"]["OrderResponse"];
export type OrderItemDto = components["schemas"]["OrderItemResponse"];
export type OrderCreateDto = components["schemas"]["OrderCreate"];
export type OrderItemCreateDto = components["schemas"]["OrderItemCreate"];

export const ordersApi = {
  list: async (params?: {
    customer_type?: string;
    customer_id?: number;
    status?: string;
    skip?: number;
    limit?: number;
  }): Promise<OrderDto[]> => {
    const res = await apiClient.get<OrderDto[]>("/api/v1/orders", { params });
    return res.data;
  },

  getById: async (id: number): Promise<OrderDto> => {
    const res = await apiClient.get<OrderDto>(`/api/v1/orders/${id}`);
    return res.data;
  },

  create: async (data: OrderCreateDto): Promise<OrderDto> => {
    const res = await apiClient.post<OrderDto>("/api/v1/orders", data);
    return res.data;
  },

  updateStatus: async (id: number, status: string): Promise<OrderDto> => {
    const res = await apiClient.patch<OrderDto>(`/api/v1/orders/${id}/status`, null, {
      params: { status },
    });
    return res.data;
  },
};
