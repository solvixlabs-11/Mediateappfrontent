import { apiClient } from "../../../api/client";

export interface HospitalSummaryDto {
  hospital_id: number;
  hospital_name: string;
  department?: string | null;
  visiting_hours?: string | null;
  is_primary: boolean;
}

export interface DoctorDto {
  id: number;
  code: string;
  full_name: string;
  qualification?: string | null;
  specialization?: string | null;
  category: string;
  phone?: string | null;
  email?: string | null;
  clinic_name?: string | null;
  address?: string | null;
  area_id?: number | null;
  territory_id?: number | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  date_of_birth?: string | null;
  anniversary_date?: string | null;
  is_active: boolean;
  hospitals: HospitalSummaryDto[];
  created_at: string;
}

export interface DoctorCreateDto {
  full_name: string;
  qualification?: string;
  specialization?: string;
  category?: string;
  phone?: string;
  email?: string;
  clinic_name?: string;
  address?: string;
  area_id?: number;
  territory_id?: number;
  pincode?: string;
  latitude?: number;
  longitude?: number;
}

export interface HospitalDto {
  id: number;
  code: string;
  name: string;
  type: string;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  area_id?: number | null;
  territory_id?: number | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  bed_count?: number | null;
  is_active: boolean;
  created_at: string;
}

export interface ChemistDto {
  id: number;
  code: string;
  shop_name: string;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  dl_number?: string | null;
  gstin?: string | null;
  address?: string | null;
  area_id?: number | null;
  territory_id?: number | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_active: boolean;
  created_at: string;
}

export interface ChemistCreateDto {
  shop_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  dl_number?: string;
  gstin?: string;
  address?: string;
  area_id?: number;
  territory_id?: number;
  pincode?: string;
  latitude?: number;
  longitude?: number;
}

export interface StockistDto {
  id: number;
  code: string;
  agency_name: string;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  dl_number?: string | null;
  gstin?: string | null;
  address?: string | null;
  area_id?: number | null;
  territory_id?: number | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  credit_days: number;
  is_active: boolean;
  created_at: string;
}

export interface NearbyCustomerDto {
  id: number;
  customer_type: "DOCTOR" | "CHEMIST" | "STOCKIST" | "HOSPITAL";
  name: string;
  category_or_type?: string | null;
  address?: string | null;
  phone?: string | null;
  latitude: number;
  longitude: number;
  distance_meters: number;
  in_geofence: boolean;
}

export const customersApi = {
  // DOCTORS
  listDoctors: async (params?: {
    search?: string;
    specialization?: string;
    category?: string;
    territory_id?: number;
    active_only?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<DoctorDto[]> => {
    const res = await apiClient.get<DoctorDto[]>("/api/v1/customers/doctors", { params });
    return res.data;
  },

  getDoctor: async (id: number): Promise<DoctorDto> => {
    const res = await apiClient.get<DoctorDto>(`/api/v1/customers/doctors/${id}`);
    return res.data;
  },

  createDoctor: async (data: DoctorCreateDto): Promise<DoctorDto> => {
    const res = await apiClient.post<DoctorDto>("/api/v1/customers/doctors", data);
    return res.data;
  },

  // HOSPITALS
  listHospitals: async (params?: {
    search?: string;
    type?: string;
    active_only?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<HospitalDto[]> => {
    const res = await apiClient.get<HospitalDto[]>("/api/v1/customers/hospitals", { params });
    return res.data;
  },

  createHospital: async (data: {
    name: string;
    type?: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    territory_id?: number;
    bed_count?: number;
    latitude?: number;
    longitude?: number;
  }): Promise<HospitalDto> => {
    const res = await apiClient.post<HospitalDto>("/api/v1/customers/hospitals", data);
    return res.data;
  },

  mapDoctorToHospital: async (data: {
    hospital_id: number;
    doctor_id: number;
    department?: string;
    visiting_hours?: string;
    is_primary?: boolean;
  }): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>("/api/v1/customers/hospitals/map-doctor", data);
    return res.data;
  },

  // CHEMISTS
  listChemists: async (params?: {
    search?: string;
    active_only?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<ChemistDto[]> => {
    const res = await apiClient.get<ChemistDto[]>("/api/v1/customers/chemists", { params });
    return res.data;
  },

  createChemist: async (data: ChemistCreateDto): Promise<ChemistDto> => {
    const res = await apiClient.post<ChemistDto>("/api/v1/customers/chemists", data);
    return res.data;
  },

  // STOCKISTS
  listStockists: async (params?: {
    search?: string;
    active_only?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<StockistDto[]> => {
    const res = await apiClient.get<StockistDto[]>("/api/v1/customers/stockists", { params });
    return res.data;
  },

  // NEARBY GEOFENCE
  getNearbyCustomers: async (params: {
    latitude: number;
    longitude: number;
    radius_meters?: number;
  }): Promise<NearbyCustomerDto[]> => {
    const res = await apiClient.get<NearbyCustomerDto[]>("/api/v1/customers/nearby", { params });
    return res.data;
  },
};
