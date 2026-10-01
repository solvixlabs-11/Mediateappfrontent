import { apiClient } from "../../../api/client";
import { AreaDto } from "../../masters/api/mastersApi";

export interface TerritoryDto {
  id: number;
  name: string;
  code: string;
  headquarters: string;
  state_id?: number | null;
  description?: string | null;
  is_active: boolean;
  areas: AreaDto[];
  created_at: string;
}

export interface TerritoryCreateDto {
  name: string;
  code: string;
  headquarters: string;
  state_id?: number | null;
  description?: string | null;
  area_ids?: number[];
}

export const territoriesApi = {
  getMyTerritories: async (): Promise<TerritoryDto[]> => {
    const res = await apiClient.get<TerritoryDto[]>("/api/v1/territories/my-territories");
    return res.data;
  },

  listTerritories: async (params?: {
    search?: string;
    state_id?: number;
    active_only?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<TerritoryDto[]> => {
    const res = await apiClient.get<TerritoryDto[]>("/api/v1/territories", { params });
    return res.data;
  },

  getTerritoryById: async (id: number): Promise<TerritoryDto> => {
    const res = await apiClient.get<TerritoryDto>(`/api/v1/territories/${id}`);
    return res.data;
  },

  createTerritory: async (data: TerritoryCreateDto): Promise<TerritoryDto> => {
    const res = await apiClient.post<TerritoryDto>("/api/v1/territories", data);
    return res.data;
  },

  assignUser: async (territoryId: number, userId: number): Promise<{ id: number; user_id: number; territory_id: number }> => {
    const res = await apiClient.post(`/api/v1/territories/${territoryId}/assign`, { user_id: userId });
    return res.data;
  },
};
