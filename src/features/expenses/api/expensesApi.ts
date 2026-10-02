import { apiClient } from "../../../api/client";
import { components } from "../../../api/schema";

export type ExpenseDto = components["schemas"]["ExpenseResponse"];
export type ExpenseCreatePayload = components["schemas"]["ExpenseCreateRequest"];
export type ExpenseSummaryDto = components["schemas"]["MonthlyExpenseSummaryResponse"];

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

