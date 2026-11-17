/**
 * Standard date & time formatting utilities for Mediate MR Mobile.
 * All incoming dates from backend arrive in UTC and are formatted for Asia/Kolkata (IST).
 */

const IST_TIMEZONE = "Asia/Kolkata";

/**
 * Format an ISO UTC timestamp into a human-readable date and time in Asia/Kolkata.
 * Example: "04 Nov 2026, 05:30 PM"
 */
export function formatDateTimeIST(
  dateInput: string | Date | null | undefined,
  fallback = "—"
): string {
  if (!dateInput) return fallback;
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * Format an ISO UTC timestamp into a date in Asia/Kolkata.
 * Example: "04 Nov 2026"
 */
export function formatDateIST(
  dateInput: string | Date | null | undefined,
  fallback = "—"
): string {
  if (!dateInput) return fallback;
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Format an ISO UTC timestamp into a time in Asia/Kolkata.
 * Example: "05:30 PM"
 */
export function formatTimeIST(
  dateInput: string | Date | null | undefined,
  fallback = "—"
): string {
  if (!dateInput) return fallback;
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

