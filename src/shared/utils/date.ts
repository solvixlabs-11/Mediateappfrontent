/**
 * Standard date & time formatting utilities for Mediate MR Mobile.
 * All incoming dates from backend arrive in UTC and are formatted for Asia/Kolkata (IST).
 */

const IST_TIMEZONE = "Asia/Kolkata";

/**
 * Parse a backend timestamp string or Date as UTC when no timezone offset is present.
 * FastAPI/SQLAlchemy often serializes naive UTC ISO strings like "2026-11-26T05:42:00".
 */
export function parseUtcDate(dateInput: string | Date | null | undefined): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;

  const trimmed = dateInput.trim();
  if (!trimmed) return null;

  const hasTime = trimmed.includes("T") || /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(trimmed);
  const hasTz = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(trimmed);
  const normalized = hasTime && !hasTz ? `${trimmed.replace(" ", "T")}Z` : trimmed;

  const date = new Date(normalized);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Format an ISO UTC timestamp into a human-readable date and time in Asia/Kolkata.
 * Example: "04 Nov 2026, 05:30 PM"
 */
export function formatDateTimeIST(
  dateInput: string | Date | null | undefined,
  fallback = "—"
): string {
  const date = parseUtcDate(dateInput);
  if (!date) return fallback;

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
  const date = parseUtcDate(dateInput);
  if (!date) return fallback;

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
  const date = parseUtcDate(dateInput);
  if (!date) return fallback;

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}
