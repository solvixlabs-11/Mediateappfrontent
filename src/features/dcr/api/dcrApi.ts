import { apiClient } from "../../../api/client";

export interface PlannedVisitDto {
  id: number;
  user_id: number;
  plan_date: string;
  customer_type: "DOCTOR" | "CHEMIST" | "HOSPITAL" | "STOCKIST";
  doctor_id?: number | null;
  chemist_id?: number | null;
  hospital_id?: number | null;
  stockist_id?: number | null;
  customer_name?: string | null;
  priority: string;
  visit_purpose?: string | null;
  status: "PLANNED" | "COMPLETED" | "MISSED" | "CANCELLED";
  notes?: string | null;
  created_at: string;
}

export interface PostCallAnalysisDto {
  id?: number;
  call_outcome: string;
  doctor_feedback?: string | null;
  prescription_commitment: string;
  next_visit_date?: string | null;
  follow_up_required: boolean;
  follow_up_notes?: string | null;
}

export interface ProductDetailDto {
  product_name: string;
  sample_quantity: number;
  gift_quantity: number;
  remarks?: string | null;
}

export interface DcrVisitDto {
  id: number;
  user_id: number;
  dcr_date: string;
  customer_type: "DOCTOR" | "CHEMIST" | "HOSPITAL" | "STOCKIST";
  doctor_id?: number | null;
  chemist_id?: number | null;
  hospital_id?: number | null;
  stockist_id?: number | null;
  customer_name?: string | null;
  planned_visit_id?: number | null;
  visit_type: string;
  joint_manager_id?: number | null;
  call_time: string;
  call_duration_minutes: number;
  latitude?: number | null;
  longitude?: number | null;
  location_accuracy?: number | null;
  distance_to_customer_meters?: number | null;
  is_geofence_verified: boolean;
  geofence_radius_meters: number;
  remarks?: string | null;
  pob_amount: number;
  status: string;
  created_at: string;
  post_call_analysis?: PostCallAnalysisDto | null;
  product_details: ProductDetailDto[];
}

export interface FollowUpDto {
  id: number;
  user_id: number;
  customer_type: string;
  doctor_id?: number | null;
  chemist_id?: number | null;
  hospital_id?: number | null;
  stockist_id?: number | null;
  customer_name?: string | null;
  dcr_visit_id?: number | null;
  due_date: string;
  title: string;
  notes?: string | null;
  priority: string;
  status: "PENDING" | "COMPLETED" | "OVERDUE" | "CANCELLED";
  completed_at?: string | null;
  created_at: string;
}

export interface DcrDailySummaryDto {
  dcr_date: string;
  total_calls: number;
  doctor_calls: number;
  chemist_calls: number;
  hospital_calls: number;
  stockist_calls: number;
  geofence_verified_count: number;
  total_pob_amount: number;
  planned_calls_count: number;
  missed_calls_count: number;
}

export const dcrApi = {
  // PLANS
  createPlan: async (data: {
    plan_date: string;
    customer_type: string;
    doctor_id?: number;
    chemist_id?: number;
    hospital_id?: number;
    stockist_id?: number;
    priority?: string;
    visit_purpose?: string;
    notes?: string;
    client_uuid?: string;
  }): Promise<PlannedVisitDto> => {
    const res = await apiClient.post<PlannedVisitDto>("/api/v1/dcr/plans", data);
    return res.data;
  },

  listPlans: async (params?: {
    plan_date?: string;
    status?: string;
  }): Promise<PlannedVisitDto[]> => {
    const res = await apiClient.get<PlannedVisitDto[]>("/api/v1/dcr/plans", { params });
    return res.data;
  },

  // DCR VISITS
  submitDcr: async (data: {
    dcr_date: string;
    customer_type: string;
    doctor_id?: number;
    chemist_id?: number;
    hospital_id?: number;
    stockist_id?: number;
    planned_visit_id?: number;
    visit_type?: string;
    call_duration_minutes?: number;
    latitude?: number;
    longitude?: number;
    remarks?: string;
    pob_amount?: number;
    post_call_analysis?: {
      call_outcome: string;
      doctor_feedback?: string;
      prescription_commitment: string;
      next_visit_date?: string;
      follow_up_required: boolean;
      follow_up_notes?: string;
    };
    product_details?: Array<{
      product_name: string;
      sample_quantity: number;
      gift_quantity: number;
      remarks?: string;
    }>;
    client_uuid?: string;
  }): Promise<DcrVisitDto> => {
    const res = await apiClient.post<DcrVisitDto>("/api/v1/dcr/visits", data);
    return res.data;
  },

  listVisits: async (params?: {
    dcr_date?: string;
    customer_type?: string;
  }): Promise<DcrVisitDto[]> => {
    const res = await apiClient.get<DcrVisitDto[]>("/api/v1/dcr/visits", { params });
    return res.data;
  },

  getSummary: async (date?: string): Promise<DcrDailySummaryDto> => {
    const res = await apiClient.get<DcrDailySummaryDto>("/api/v1/dcr/summary", {
      params: { dcr_date: date },
    });
    return res.data;
  },

  // FOLLOW-UPS
  listFollowUps: async (params?: {
    status?: string;
    overdue_only?: boolean;
  }): Promise<FollowUpDto[]> => {
    const res = await apiClient.get<FollowUpDto[]>("/api/v1/dcr/follow-ups", { params });
    return res.data;
  },

  completeFollowUp: async (id: number): Promise<FollowUpDto> => {
    const res = await apiClient.post<FollowUpDto>(`/api/v1/dcr/follow-ups/${id}/complete`);
    return res.data;
  },
};
