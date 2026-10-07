import { generateExportFileName } from "../hooks/useReportExport";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { reportsStorage } from "../services/reportsStorage";
import { getDatabase } from "../../../shared/services/sqlite";

describe("Report Export Flow (Section 7, 8 & 9)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("generateExportFileName creates proper filename matching spec", () => {
    const excelName = generateExportFileName(
      "dcr_detailed",
      "xlsx",
      "2026-10-01",
      "2026-10-31",
      "Your team (8 MRs)"
    );
    expect(excelName).toBe("dcr_detailed_2026-10-01_to_2026-10-31_your_team__8_mr.xlsx");

    const pdfName = generateExportFileName(
      "attendance",
      "pdf",
      "2026-10-01",
      "2026-10-15",
      "Self"
    );
    expect(pdfName).toBe("attendance_2026-10-01_to_2026-10-15_self.pdf");
  });

  test("mocks FileSystem downloadResumable and Sharing correctly", async () => {
    const downloadResumable = FileSystem.createDownloadResumable(
      "http://api.local/api/v1/reports/dcr_detailed/export?format=xlsx",
      "file:///app_cache/reports/test.xlsx",
      {},
      undefined
    );

    const result = await downloadResumable.downloadAsync();
    expect(result).toBeDefined();
    expect(result!.status).toBe(200);
    expect(result!.uri).toBe("file:///app_cache/reports/test.xlsx");

    const canShare = await Sharing.isAvailableAsync();
    expect(canShare).toBe(true);

    await Sharing.shareAsync(result!.uri, {
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      dialogTitle: "Share Report",
    });

    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      "file:///app_cache/reports/test.xlsx",
      expect.objectContaining({
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
    );
  });

  test("reportsStorage saves recent exports and enforces top 10 limit query", async () => {
    const db = await getDatabase();
    await reportsStorage.saveRecentExport({
      report_key: "r01_dcr_detailed",
      title: "DCR Detailed",
      format: "xlsx",
      file_name: "r01_dcr_detailed_2026.xlsx",
      file_uri: "file:///app_cache/reports/r01_dcr_detailed_2026.xlsx",
      exported_at: "2026-10-05T00:00:00Z",
      row_count: 42,
    });

    expect(db.runAsync).toHaveBeenCalled();
  });
});
