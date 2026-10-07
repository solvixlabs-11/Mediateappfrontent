import { apiClient, API_BASE_URL } from "../../../api/client";
import { components } from "../../../api/schema";

export type ReportCatalogResponse = components["schemas"]["ReportCatalogResponse"];
export type ReportCatalogItem = components["schemas"]["ReportCatalogItem"];
export type ReportResponse = components["schemas"]["ReportResponse"];
export type ReportMeta = components["schemas"]["ReportMeta"];
export type ReportColumn = components["schemas"]["ReportColumn"];
export type ReportFilterSchema = components["schemas"]["ReportFilterSchema"];
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
