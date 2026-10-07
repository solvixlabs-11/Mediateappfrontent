import { apiClient } from "../../../api/client";
import { components } from "../../../api/schema";

export type ProductDto = components["schemas"]["ProductResponse"];
export type ProductVisualAidDto = components["schemas"]["ProductVisualAidResponse"];

export const productsApi = {
  list: async (params?: {
    category?: string;
    search?: string;
    is_sample_available?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<ProductDto[]> => {
    const res = await apiClient.get<ProductDto[]>("/api/v1/products", { params });
    return res.data;
  },

  getCategories: async (): Promise<string[]> => {
    const res = await apiClient.get<string[]>("/api/v1/products/categories");
    return res.data;
  },

  getById: async (id: number): Promise<ProductDto> => {
    const res = await apiClient.get<ProductDto>(`/api/v1/products/${id}`);
    return res.data;
  },
};
