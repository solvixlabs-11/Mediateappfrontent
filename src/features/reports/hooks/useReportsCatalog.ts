import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useCallback } from "react";
import { reportsApi, ReportCatalogItem } from "../api/reportsApi";
import { reportsStorage, RecentExportItem } from "../services/reportsStorage";
import { getReportErrorMessage } from "../utils/reportErrors";

export interface GroupedReports {
  groupName: string;
  items: ReportCatalogItem[];
}

export function useReportsCatalog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [recentExports, setRecentExports] = useState<RecentExportItem[]>([]);

  const catalogQuery = useQuery({
    queryKey: ["reports", "catalog"],
    queryFn: async () => {
      const res = await reportsApi.getCatalog();
      return res;
    },
    staleTime: 5 * 60 * 1000,
  });

  const loadRecentExports = useCallback(async () => {
    const recents = await reportsStorage.getRecentExports();
    setRecentExports(recents);
  }, []);

  const reports = catalogQuery.data?.reports || [];
  const scopeLabel = catalogQuery.data?.scope_label || "Your scope";
  const userRole = catalogQuery.data?.role || "";

  // Group names ordering per specification: Activity, Customers, HR and Expense, Approvals
  const groupedReports = useMemo(() => {
    const filtered = reports.filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.key.toLowerCase().includes(q)
      );
    });

    const standardGroups = ["Activity", "Customers", "HR and Expense", "Approvals"];
    const groupsMap = new Map<string, ReportCatalogItem[]>();

    standardGroups.forEach((g) => groupsMap.set(g, []));

    filtered.forEach((report) => {
      let g = report.group || "Activity";
      // Normalize group names if needed
      if (g.toLowerCase().includes("hr") || g.toLowerCase().includes("expense")) {
        g = "HR and Expense";
      } else if (g.toLowerCase().includes("customer")) {
        g = "Customers";
      } else if (g.toLowerCase().includes("approval")) {
        g = "Approvals";
      } else if (g.toLowerCase().includes("activity") || g.toLowerCase().includes("dcr") || g.toLowerCase().includes("visit")) {
        g = "Activity";
      }

      if (!groupsMap.has(g)) {
        groupsMap.set(g, []);
      }
      groupsMap.get(g)!.push(report);
    });

    const result: GroupedReports[] = [];
    // Push standard groups first, then any extra
    groupsMap.forEach((items, groupName) => {
      if (items.length > 0) {
        result.push({ groupName, items });
      }
    });

    return result;
  }, [reports, searchQuery]);

  return {
    isLoading: catalogQuery.isLoading,
    isError: catalogQuery.isError,
    error: catalogQuery.error,
    errorMessage: catalogQuery.error ? getReportErrorMessage(catalogQuery.error) : null,
    refetch: catalogQuery.refetch,
    scopeLabel,
    userRole,
    searchQuery,
    setSearchQuery,
    groupedReports,
    recentExports,
    loadRecentExports,
  };
}
