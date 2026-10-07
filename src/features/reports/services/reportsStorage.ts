import { getDatabase } from "../../../shared/services/sqlite";
import { components } from "../../../api/schema";

export type ReportResponse = components["schemas"]["ReportResponse"];

export interface RecentExportItem {
  id?: number;
  report_key: string;
  title: string;
  format: "xlsx" | "pdf";
  file_name: string;
  file_uri: string;
  exported_at: string;
  row_count?: number;
}

let isInitialized = false;

async function ensureReportsTables(): Promise<void> {
  if (isInitialized) return;
  try {
    const db = await getDatabase();
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS recent_exports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_key TEXT NOT NULL,
        title TEXT NOT NULL,
        format TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_uri TEXT NOT NULL,
        exported_at TEXT NOT NULL,
        row_count INTEGER
      );
      CREATE TABLE IF NOT EXISTS report_cache (
        report_key TEXT PRIMARY KEY,
        cached_json TEXT NOT NULL,
        cached_at TEXT NOT NULL
      );
    `);
    isInitialized = true;
  } catch (err) {
    console.warn("Error initializing reports tables in SQLite", err);
  }
}

export const reportsStorage = {
  /** Record a completed export, keeping only the latest 10 */
  async saveRecentExport(item: RecentExportItem): Promise<void> {
    try {
      await ensureReportsTables();
      const db = await getDatabase();
      await db.runAsync(
        `INSERT INTO recent_exports (report_key, title, format, file_name, file_uri, exported_at, row_count)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          item.report_key,
          item.title,
          item.format,
          item.file_name,
          item.file_uri,
          item.exported_at,
          item.row_count ?? 0,
        ]
      );

      // Keep only top 10
      await db.runAsync(`
        DELETE FROM recent_exports WHERE id NOT IN (
          SELECT id FROM recent_exports ORDER BY id DESC LIMIT 10
        )
      `);
    } catch (err) {
      console.warn("Failed to save recent export", err);
    }
  },

  /** Get the last 10 exports */
  async getRecentExports(): Promise<RecentExportItem[]> {
    try {
      await ensureReportsTables();
      const db = await getDatabase();
      const rows = await db.getAllAsync<RecentExportItem>(
        "SELECT * FROM recent_exports ORDER BY id DESC LIMIT 10"
      );
      return rows;
    } catch (err) {
      console.warn("Failed to retrieve recent exports", err);
      return [];
    }
  },

  /** Cache report result for offline viewing */
  async cacheReportResult(reportKey: string, result: ReportResponse): Promise<void> {
    try {
      await ensureReportsTables();
      const db = await getDatabase();
      const json = JSON.stringify(result);
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT OR REPLACE INTO report_cache (report_key, cached_json, cached_at)
         VALUES (?, ?, ?)`,
        [reportKey, json, now]
      );
    } catch (err) {
      console.warn("Failed to cache report result", err);
    }
  },

  /** Retrieve cached report result if available */
  async getCachedReportResult(reportKey: string): Promise<{ data: ReportResponse; cached_at: string } | null> {
    try {
      await ensureReportsTables();
      const db = await getDatabase();
      const row = await db.getFirstAsync<{ cached_json: string; cached_at: string }>(
        "SELECT cached_json, cached_at FROM report_cache WHERE report_key = ?",
        [reportKey]
      );
      if (row && row.cached_json) {
        return {
          data: JSON.parse(row.cached_json) as ReportResponse,
          cached_at: row.cached_at,
        };
      }
      return null;
    } catch (err) {
      console.warn("Failed to load cached report result", err);
      return null;
    }
  },
};
