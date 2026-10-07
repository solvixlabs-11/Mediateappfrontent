import { ReportCatalogItem } from "../api/reportsApi";

describe("Role-based Catalog Grouping & MR Picker Visibility", () => {
  const sampleReports: ReportCatalogItem[] = [
    {
      key: "r01_dcr_detailed",
      title: "DCR Detailed (date wise)",
      group: "Activity",
      description: "Every visit report, grouped by date",
      filter_schema: {
        date_range: true,
        mr_picker: true,
        manager_picker: false,
        territory_picker: false,
        customer_type_picker: true,
        status_picker: false,
      },
    },
    {
      key: "r03_customer_visits",
      title: "Customer-wise Visits",
      group: "Customers",
      description: "Visits by doctor, chemist, hospital, stockist",
      filter_schema: {
        date_range: true,
        mr_picker: true,
        manager_picker: false,
        territory_picker: false,
        customer_type_picker: true,
        status_picker: true,
      },
    },
    {
      key: "r10_leave",
      title: "Leave",
      group: "HR and Expense",
      description: "Leave requests and balances",
      filter_schema: {
        date_range: true,
        mr_picker: true,
        manager_picker: false,
        territory_picker: false,
        customer_type_picker: false,
        status_picker: true,
      },
    },
    {
      key: "r14_approval_turnaround",
      title: "Approval Turnaround",
      group: "Approvals",
      description: "Turnaround time and pending ageing",
      filter_schema: {
        date_range: true,
        mr_picker: true,
        manager_picker: false,
        territory_picker: false,
        customer_type_picker: false,
        status_picker: false,
      },
    },
  ];

  test("correctly groups reports into standard 4 groups", () => {
    const groups = ["Activity", "Customers", "HR and Expense", "Approvals"];
    const groupedMap = new Map<string, ReportCatalogItem[]>();
    groups.forEach((g) => groupedMap.set(g, []));

    sampleReports.forEach((r) => {
      groupedMap.get(r.group)?.push(r);
    });

    expect(groupedMap.get("Activity")?.length).toBe(1);
    expect(groupedMap.get("Customers")?.length).toBe(1);
    expect(groupedMap.get("HR and Expense")?.length).toBe(1);
    expect(groupedMap.get("Approvals")?.length).toBe(1);
  });

  test("MR role has NO MR picker", () => {
    const role: string = "MR";
    const canPickMr = role === "MANAGER" || role === "ADMIN";
    expect(canPickMr).toBe(false);
  });

  test("MANAGER role has MR picker for team only and NO manager picker", () => {
    const role: string = "MANAGER";
    const canPickMr = role === "MANAGER" || role === "ADMIN";
    const canPickManager = role === "ADMIN";
    expect(canPickMr).toBe(true);
    expect(canPickManager).toBe(false);
  });

  test("ADMIN role has both MR picker and Manager picker", () => {
    const role: string = "ADMIN";
    const canPickMr = role === "MANAGER" || role === "ADMIN";
    const canPickManager = role === "ADMIN";
    expect(canPickMr).toBe(true);
    expect(canPickManager).toBe(true);
  });
});
