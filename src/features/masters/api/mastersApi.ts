import { apiClient } from "../../../api/client";

export interface MasterItemDto {
  id: number;
  type: string;
  code: string;
  name: string;
  description?: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface StateDto {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
}

export interface CityDto {
  id: number;
  state_id: number;
  code: string;
  name: string;
  is_active: boolean;
}

export interface AreaDto {
  id: number;
  city_id: number;
  name: string;
  pincode?: string | null;
  is_active: boolean;
}

export interface BulkDropdownsDto {
  specializations: MasterItemDto[];
  customer_categories: MasterItemDto[];
  visit_priorities: MasterItemDto[];
  states: StateDto[];
}

export const mastersApi = {
  getBulkDropdowns: async (): Promise<BulkDropdownsDto> => {
    const res = await apiClient.get<BulkDropdownsDto>("/api/v1/masters/bulk-dropdowns");
    return res.data;
  },

  listItems: async (type?: string): Promise<MasterItemDto[]> => {
    const res = await apiClient.get<MasterItemDto[]>("/api/v1/masters", {
      params: { type },
    });
    return res.data;
  },

  createItem: async (data: {
    type: string;
    code: string;
    name: string;
    description?: string;
    display_order?: number;
  }): Promise<MasterItemDto> => {
    const res = await apiClient.post<MasterItemDto>("/api/v1/masters", data);
    return res.data;
  },

  getStates: async (): Promise<StateDto[]> => {
    const res = await apiClient.get<StateDto[]>("/api/v1/masters/states");
    return res.data;
  },

  getCities: async (stateId?: number): Promise<CityDto[]> => {
    const res = await apiClient.get<CityDto[]>("/api/v1/masters/cities", {
      params: { state_id: stateId },
    });
    return res.data;
  },

  getAreas: async (cityId?: number): Promise<AreaDto[]> => {
    const res = await apiClient.get<AreaDto[]>("/api/v1/masters/areas", {
      params: { city_id: cityId },
    });
    return res.data;
  },
};
