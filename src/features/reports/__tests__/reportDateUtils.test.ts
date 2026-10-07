import {
  formatDate,
  getPresetDateRange,
  validateDateRange,
} from "../utils/reportDateUtils";

describe("Report Date Utilities (Section 3 of Reports Spec)", () => {
  const fixedNow = new Date("2026-10-15T12:00:00Z");

  test("formatDate formats Date to YYYY-MM-DD", () => {
    const d = new Date(2026, 9, 5); // Oct 5, 2026
    expect(formatDate(d)).toBe("2026-10-05");
  });

  test("Today preset returns current date for both from and to", () => {
    const range = getPresetDateRange("Today", fixedNow);
    expect(range.from_date).toBe("2026-10-15");
    expect(range.to_date).toBe("2026-10-15");
  });

  test("Yesterday preset returns previous day", () => {
    const range = getPresetDateRange("Yesterday", fixedNow);
    expect(range.from_date).toBe("2026-10-14");
    expect(range.to_date).toBe("2026-10-14");
  });

  test("This month preset starts at day 1 of current month", () => {
    const range = getPresetDateRange("This month", fixedNow);
    expect(range.from_date).toBe("2026-10-01");
    expect(range.to_date).toBe("2026-10-15");
  });

  test("Last month preset spans entire previous month", () => {
    const range = getPresetDateRange("Last month", fixedNow);
    expect(range.from_date).toBe("2026-09-01");
    expect(range.to_date).toBe("2026-09-30");
  });

  test("validateDateRange accepts valid 30-day range", () => {
    const res = validateDateRange("2026-10-01", "2026-10-30");
    expect(res.valid).toBe(true);
    expect(res.error).toBeUndefined();
  });

  test("validateDateRange rejects range where from_date > to_date", () => {
    const res = validateDateRange("2026-10-30", "2026-10-01");
    expect(res.valid).toBe(false);
    expect(res.error).toBe("From date cannot be after To date.");
  });

  test("validateDateRange rejects range greater than 92 days", () => {
    const res = validateDateRange("2026-01-01", "2026-05-01");
    expect(res.valid).toBe(false);
    expect(res.error).toContain("exceeds maximum limit of 92 days");
  });

  test("validateDateRange accepts exactly 92 days", () => {
    // 92 days
    const res = validateDateRange("2026-01-01", "2026-04-02");
    expect(res.valid).toBe(true);
  });
});
