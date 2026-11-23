import { apiClient, API_BASE_URL } from "../../../api/client";
import { components } from "../../../api/schema";

export type ReportColumn = components["schemas"]["ReportColumn"];

export interface ReportFilterSchema {
  date_range?: boolean;
  mr_picker?: boolean;
  manager_picker?: boolean;
  territory_picker?: boolean;
  customer_type_picker?: boolean;
  status_picker?: boolean;
  status_options?: string[];
  specialization_picker?: boolean;
  category_picker?: boolean;
  category_options?: string[];
  active_picker?: boolean;
  work_type_picker?: boolean;
  visit_type_picker?: boolean;
  verified_picker?: boolean;
  deviation_type_picker?: boolean;
  days_not_seen_picker?: boolean;
  [key: string]: unknown;
}

export interface ReportCatalogItem {
  key: string;
  title: string;
  name?: string;
  group: string;
  description: string;
  filter_schema: ReportFilterSchema;
  available_formats?: string[];
  formats?: string[];
  status: string;
  is_ready?: boolean;
  coming_soon_reason?: string | null;
  report_number?: number | null;
  allowed_roles?: string[];
  sort_order?: number;
}

export interface ReportCatalogResponse {
  role?: string;
  groups?: string[];
  reports: ReportCatalogItem[];
  items?: ReportCatalogItem[];
  total?: number;
  scope_label?: string;
}

export interface ReportMeta {
  key?: string;
  report_key?: string;
  title?: string;
  group?: string;
  filters?: Record<string, unknown>;
  scope_label?: string;
  user_scope?: string;
  generated_at?: string;
  columns?: ReportColumn[];
  total_records?: number;
  landscape?: boolean;
  [key: string]: unknown;
}

export interface ReportResponse {
  meta?: ReportMeta;
  columns: ReportColumn[];
  summary?: Record<string, unknown>;
  items: Record<string, unknown>[];
  rows?: Record<string, unknown>[];
  total: number;
  total_records?: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export type ReportsDashboardDto = components["schemas"]["ReportsDashboardResponse"];
export type ReportsSummaryDto = components["schemas"]["ReportsSummaryResponse"];
export type MRPerformanceDto = components["schemas"]["MRPerformanceReportItem"];
export type CustomerCoverageDto = components["schemas"]["CustomerCoverageReportItem"];

export interface ReportQueryParams {
  from_date?: string;
  to_date?: string;
  start_date?: string;
  end_date?: string;
  mr_id?: number | null;
  manager_id?: number | null;
  territory_id?: number | null;
  customer_type?: string | null;
  status?: string | null;
  specialization?: string | null;
  category?: string | null;
  active?: boolean | null;
  work_type?: string | null;
  visit_type?: string | null;
  verified?: boolean | null;
  deviation_type?: string | null;
  days_not_seen?: number | null;
  page?: number;
  page_size?: number;
}

export const reportsApi = {
  /** Fetch accessible reports catalog for caller's role */
  getCatalog: async (): Promise<ReportCatalogResponse> => {
    const res = await apiClient.get<ReportCatalogResponse>("/api/v1/reports");
    return res.data;
  },

  /** Fetch paged report data with summary and items */
  getReport: async (key: string, params?: ReportQueryParams): Promise<ReportResponse> => {
    const cleanParams: Record<string, any> = {};
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          cleanParams[k] = v;
        }
      });
    }
    const res = await apiClient.get<ReportResponse>(`/api/v1/reports/${encodeURIComponent(key)}`, {
      params: cleanParams,
    });
    return res.data;
  },

  /** Fetch dashboard reports KPIs */
  getDashboardReports: async (params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<ReportsDashboardDto> => {
    const res = await apiClient.get<ReportsDashboardDto>("/api/v1/reports/dashboard", { params });
    return res.data;
  },

  /** Build absolute download URL for report export */
  getExportUrl: (key: string, format: "xlsx" | "pdf", params?: ReportQueryParams): string => {
    const url = new URL(`${API_BASE_URL}/api/v1/reports/${encodeURIComponent(key)}/export`);
    url.searchParams.set("format", format);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "" && k !== "page" && k !== "page_size") {
          url.searchParams.set(k, String(v));
        }
      });
    }
    return url.toString();
  },
};
