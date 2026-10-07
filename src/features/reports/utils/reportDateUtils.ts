/**
 * Date range helpers for Reports conforming to Section 3 of Reports Spec.
 * Formats dates as YYYY-MM-DD in Asia/Kolkata timezone.
 */

export type DatePreset = "Today" | "Yesterday" | "This week" | "This month" | "Last month" | "Custom";

export interface DateRange {
  from_date: string;
  to_date: string;
}

/** Formats a date object to YYYY-MM-DD string */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Resolve date range for a given preset */
export function getPresetDateRange(preset: DatePreset, now = new Date()): DateRange {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "Today": {
      const d = formatDate(today);
      return { from_date: d, to_date: d };
    }
    case "Yesterday": {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const d = formatDate(yesterday);
      return { from_date: d, to_date: d };
    }
    case "This week": {
      // Monday as first day of week
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(today.setDate(diff));
      return {
        from_date: formatDate(monday),
        to_date: formatDate(new Date(now.getFullYear(), now.getMonth(), now.getDate())),
      };
    }
    case "This month": {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        from_date: formatDate(firstDay),
        to_date: formatDate(new Date(now.getFullYear(), now.getMonth(), now.getDate())),
      };
    }
    case "Last month": {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        from_date: formatDate(firstDay),
        to_date: formatDate(lastDay),
      };
    }
    case "Custom":
    default: {
      const d = formatDate(today);
      return { from_date: d, to_date: d };
    }
  }
}

/** Validates that date range does not exceed 92 days */
export function validateDateRange(fromDateStr: string, toDateStr: string): { valid: boolean; error?: string } {
  const from = new Date(fromDateStr);
  const to = new Date(toDateStr);

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return { valid: false, error: "Please enter valid dates." };
  }

  if (from > to) {
    return { valid: false, error: "From date cannot be after To date." };
  }

  const diffTime = Math.abs(to.getTime() - from.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  if (diffDays > 92) {
    return {
      valid: false,
      error: `Date range (${diffDays} days) exceeds maximum limit of 92 days.`,
    };
  }

  return { valid: true };
}
