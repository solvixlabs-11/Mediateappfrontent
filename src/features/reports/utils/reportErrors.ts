/**
 * Friendly error messages for Report operations conforming to Reports Spec Section 4 & Section 9.
 */
export function getReportErrorMessage(error: any): string {
  if (!error) return "An unexpected error occurred.";

  const detail = error?.response?.data?.detail;
  const code = error?.response?.data?.code || error?.code;

  if (code === "REPORT_SCOPE_DENIED" || detail?.includes("REPORT_SCOPE_DENIED")) {
    return "You do not have permission to view data for this representative or team.";
  }

  if (code === "REPORT_RANGE_TOO_LARGE" || detail?.includes("REPORT_RANGE_TOO_LARGE")) {
    return "Date range cannot exceed 92 days. Please select a shorter range.";
  }

  if (code === "EXPORT_TOO_LARGE" || detail?.includes("EXPORT_TOO_LARGE")) {
    return "Export exceeds 50,000 records. Please refine your date range or filters.";
  }

  if (code === "REPORT_NOT_FOUND" || detail?.includes("REPORT_NOT_FOUND")) {
    return "The requested report definition was not found on the server.";
  }

  if (code === "INVALID_FILTER" || detail?.includes("INVALID_FILTER")) {
    return "The selected filters are invalid. Please check your selections.";
  }

  if (error?.message === "Network Error" || !error?.response) {
    return "Network connectivity issue. Please check your internet connection.";
  }

  return detail || error?.message || "Unable to load report data. Please try again.";
}
