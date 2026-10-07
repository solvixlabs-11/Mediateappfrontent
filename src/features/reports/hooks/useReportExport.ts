import { useState, useRef } from "react";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { secureStorage } from "../../../shared/services/secureStore";
import { useToastStore } from "../../../shared/components/Toast";
import { reportsApi, ReportQueryParams } from "../api/reportsApi";
import { reportsStorage } from "../services/reportsStorage";
import { getReportErrorMessage } from "../utils/reportErrors";

export interface ExportOptions {
  reportKey: string;
  reportTitle: string;
  format: "xlsx" | "pdf";
  params?: ReportQueryParams;
  scopeLabel?: string;
  totalRecords?: number;
}

export function generateExportFileName(
  reportKey: string,
  format: "xlsx" | "pdf",
  fromDate?: string,
  toDate?: string,
  scope = "report"
): string {
  const safeScope = (scope || "report").toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 15);
  const from = fromDate || "start";
  const to = toDate || "end";
  const ext = format === "pdf" ? "pdf" : "xlsx";
  return `${reportKey}_${from}_to_${to}_${safeScope}.${ext}`;
}

export function useReportExport() {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentFileName, setCurrentFileName] = useState<string>("");
  const downloadResumableRef = useRef<FileSystem.DownloadResumable | null>(null);
  const showToast = useToastStore((s) => s.showToast);

  const cancelExport = async () => {
    if (downloadResumableRef.current) {
      try {
        await downloadResumableRef.current.cancelAsync();
      } catch (err) {
        console.warn("Failed to cancel download", err);
      }
    }
    setIsExporting(false);
    setProgress(0);
    showToast("Export cancelled", "info");
  };

  const downloadAndShare = async (options: ExportOptions): Promise<boolean> => {
    const { reportKey, reportTitle, format, params, scopeLabel, totalRecords } = options;

    const fileName = generateExportFileName(
      reportKey,
      format,
      params?.from_date || params?.start_date,
      params?.to_date || params?.end_date,
      scopeLabel || "export"
    );

    setCurrentFileName(fileName);
    setIsExporting(true);
    setProgress(0.05);

    try {
      const token = await secureStorage.getAccessToken();
      const exportUrl = reportsApi.getExportUrl(reportKey, format, params);

      // Ensure directory exists in cache
      const reportsDir = `${FileSystem.cacheDirectory}reports/`;
      const dirInfo = await FileSystem.getInfoAsync(reportsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(reportsDir, { intermediates: true });
      }

      const targetFileUri = `${reportsDir}${fileName}`;

      // Set up resumable download to show progress
      const downloadResumable = FileSystem.createDownloadResumable(
        exportUrl,
        targetFileUri,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
        (downloadProgress) => {
          if (downloadProgress.totalBytesExpectedToWrite > 0) {
            const p =
              downloadProgress.totalBytesWritten /
              downloadProgress.totalBytesExpectedToWrite;
            setProgress(Math.max(0.1, Math.min(0.99, p)));
          } else {
            setProgress((prev) => Math.min(0.9, prev + 0.1));
          }
        }
      );

      downloadResumableRef.current = downloadResumable;
      const downloadResult = await downloadResumable.downloadAsync();

      if (!downloadResult || downloadResult.status >= 400) {
        // If HTTP error code was returned in body
        let serverErrorMsg = "Failed to download report";
        try {
          if (downloadResult?.uri) {
            const content = await FileSystem.readAsStringAsync(downloadResult.uri);
            const parsed = JSON.parse(content);
            serverErrorMsg = getReportErrorMessage(parsed);
          }
        } catch {
          // ignore parsing error
        }
        throw new Error(serverErrorMsg);
      }

      setProgress(1.0);

      // Save to recent exports
      await reportsStorage.saveRecentExport({
        report_key: reportKey,
        title: reportTitle,
        format,
        file_name: fileName,
        file_uri: downloadResult.uri,
        exported_at: new Date().toISOString(),
        row_count: totalRecords,
      });

      showToast(`Exported ${fileName} successfully`, "success");

      // Share via system share sheet
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        const mimeType =
          format === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

        await Sharing.shareAsync(downloadResult.uri, {
          mimeType,
          dialogTitle: `Share ${reportTitle} (${format.toUpperCase()})`,
          UTI:
            format === "pdf"
              ? "com.adobe.pdf"
              : "org.openxmlformats.spreadsheetml.sheet",
        });
      }

      setIsExporting(false);
      setProgress(0);
      return true;
    } catch (err: any) {
      setIsExporting(false);
      setProgress(0);
      const friendlyMsg = getReportErrorMessage(err);
      showToast(friendlyMsg, "error");
      return false;
    } finally {
      downloadResumableRef.current = null;
    }
  };

  return {
    isExporting,
    progress,
    currentFileName,
    downloadAndShare,
    cancelExport,
  };
}
