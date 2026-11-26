import { formatDateIST, formatDateTimeIST, formatTimeIST, parseUtcDate } from "../date";

describe("IST Date & Time Utilities", () => {
  it("normalizes naive UTC ISO strings from backend to Asia/Kolkata (+05:30)", () => {
    const naive = parseUtcDate("2026-11-26T05:42:00");
    const withZ = parseUtcDate("2026-11-26T05:42:00Z");

    expect(naive).not.toBeNull();
    expect(withZ).not.toBeNull();
    expect(naive?.getTime()).toBe(withZ?.getTime());

    expect(formatTimeIST("2026-11-26T05:42:00")).toBe(formatTimeIST("2026-11-26T05:42:00Z"));
    expect(formatTimeIST("2026-11-26T05:42:00").toLowerCase()).toContain("11:12");
    expect(formatDateIST("2026-11-26T20:00:00")).toContain("27 Nov 2026");
    expect(formatDateTimeIST("2026-11-26T05:42:00").toLowerCase()).toContain("26 nov 2026");
  });

  it("returns fallback for null/invalid inputs", () => {
    expect(formatTimeIST(null, "--:--")).toBe("--:--");
    expect(formatDateIST("invalid-date", "N/A")).toBe("N/A");
  });
});
