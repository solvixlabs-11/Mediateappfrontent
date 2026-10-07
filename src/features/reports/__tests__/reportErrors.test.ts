import { getReportErrorMessage } from "../utils/reportErrors";

describe("Report Error Mapping (Section 4 & Section 9)", () => {
  test("handles REPORT_SCOPE_DENIED code", () => {
    const error = {
      response: {
        data: {
          code: "REPORT_SCOPE_DENIED",
          detail: "Cannot view data for other MRs",
        },
      },
    };
    expect(getReportErrorMessage(error)).toBe(
      "You do not have permission to view data for this representative or team."
    );
  });

  test("handles REPORT_RANGE_TOO_LARGE code", () => {
    const error = {
      response: {
        data: {
          code: "REPORT_RANGE_TOO_LARGE",
          detail: "Range exceeds 92 days",
        },
      },
    };
    expect(getReportErrorMessage(error)).toBe(
      "Date range cannot exceed 92 days. Please select a shorter range."
    );
  });

  test("handles EXPORT_TOO_LARGE code", () => {
    const error = {
      response: {
        data: {
          code: "EXPORT_TOO_LARGE",
          detail: "Rows exceed 50000",
        },
      },
    };
    expect(getReportErrorMessage(error)).toBe(
      "Export exceeds 50,000 records. Please refine your date range or filters."
    );
  });

  test("handles REPORT_NOT_FOUND code", () => {
    const error = {
      response: {
        data: {
          code: "REPORT_NOT_FOUND",
        },
      },
    };
    expect(getReportErrorMessage(error)).toBe(
      "The requested report definition was not found on the server."
    );
  });

  test("handles Network Error gracefully", () => {
    const error = {
      message: "Network Error",
    };
    expect(getReportErrorMessage(error)).toBe(
      "Network connectivity issue. Please check your internet connection."
    );
  });

  test("returns default fallback when error is undefined", () => {
    expect(getReportErrorMessage(null)).toBe("An unexpected error occurred.");
  });
});
