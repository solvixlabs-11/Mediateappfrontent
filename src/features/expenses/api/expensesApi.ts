import { apiClient } from "../../../api/client";

export interface ExpenseDto {
  id: number;
  user_id: number;
  expense_date: string;
  expense_type: "DAILY_ALLOWANCE" | "TRAVEL_FARE" | "LODGING" | "MISCELLANEOUS";
  amount: number;
  description?: string | null;
  receipt_file_id?: number | null;
  status: "SUBMITTED" | "APPROVED" | "REJECTED";
  approval_request_id?: number | null;
  rejection_reason?: string | null;
  client_uuid?: string | null;
  created_at: string;
}

export interface ExpenseCreatePayload {
  expense_date: string;
  expense_type: "DAILY_ALLOWANCE" | "TRAVEL_FARE" | "LODGING" | "MISCELLANEOUS";
  amount: number;
  description?: string | null;
  receipt_file_id?: number | null;
  client_uuid?: string | null;
}

export interface ExpenseSummaryDto {
  total_claimed: number;
  total_approved: number;
  total_pending: number;
  total_rejected: number;
  count: number;
}

export const expensesApi = {
  create: async (payload: ExpenseCreatePayload): Promise<ExpenseDto> => {
    const res = await apiClient.post<ExpenseDto>("/api/v1/expenses/", payload);
    return res.data;
  },

  list: async (params?: { user_id?: number; status?: string }): Promise<ExpenseDto[]> => {
    const res = await apiClient.get<ExpenseDto[]>("/api/v1/expenses/", { params });
    return res.data;
  },

  getSummary: async (params?: {
    year?: number;
    month?: number;
    user_id?: number;
  }): Promise<ExpenseSummaryDto> => {
    const res = await apiClient.get<ExpenseSummaryDto>("/api/v1/expenses/summary", { params });
    return res.data;
  },
};
