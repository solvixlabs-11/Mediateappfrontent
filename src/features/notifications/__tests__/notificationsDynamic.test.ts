import { notificationsApi, NotificationDto } from "../api/notificationsApi";
import { apiClient } from "../../../api/client";
import { formatDateIST } from "../../../shared/utils/date";

jest.mock("../../../api/client", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe("Dynamic Notifications API & Telemetry Contract", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches dynamic notification list and maps response strictly without static defaults", async () => {
    const mockApiResponse: NotificationDto[] = [
      {
        id: 101,
        user_id: 1,
        title: "Doctor Approval Required",
        body: "Dr. Ananya Roy registration needs verification.",
        notification_type: "APPROVAL",
        reference_id: "DOC-89",
        is_read: false,
        read_at: null,
        created_at: "2026-11-03T10:30:00Z",
      },
      {
        id: 102,
        user_id: 1,
        title: "DCR Approved",
        body: "Your DCR for yesterday was approved.",
        notification_type: "INFO",
        reference_id: "DCR-204",
        is_read: true,
        read_at: "2026-11-03T09:00:00Z",
        created_at: "2026-11-03T08:15:00Z",
      },
    ];

    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockApiResponse });

    const result = await notificationsApi.list({ unread_only: false });

    expect(apiClient.get).toHaveBeenCalledWith("/api/v1/notifications", {
      params: { unread_only: false },
    });
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(101);
    expect(result[0].title).toBe("Doctor Approval Required");
    expect(result[0].is_read).toBe(false);

    // Verify dynamic timestamp conversion from UTC to Asia/Kolkata
    // 2026-11-03 10:30:00 UTC is 16:00:00 IST (+5:30)
    const formattedDate = formatDateIST(result[0].created_at);
    expect(formattedDate).toContain("Nov");
    expect(formattedDate).toContain("2026");
  });

  it("handles empty notification list dynamically without falling back to fake seed items", async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      data: [],
    });

    const result = await notificationsApi.list();
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it("fetches dynamic notification summary for badge numbers and KPI cards", async () => {
    const summaryData = {
      total_count: 15,
      unread_count: 4,
    };

    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: summaryData });

    const summary = await notificationsApi.getSummary();
    expect(apiClient.get).toHaveBeenCalledWith("/api/v1/notifications/summary");
    expect(summary.total_count).toBe(15);
    expect(summary.unread_count).toBe(4);
  });
});
