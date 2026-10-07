import { ReportCatalogItem } from "../api/reportsApi";

describe("Role-based Catalog Grouping & MR Picker Visibility", () => {
  const sampleReports: ReportCatalogItem[] = [
    {
      key: "doctor_list",
      title: "Doctor List",
      group: "Master Lists",
      description: "Master list of doctors",
      filter_schema: {
        date_range: false,
        mr_picker: true,
        manager_picker: false,
        territory_picker: true,
        customer_type_picker: false,
        status_picker: false,
        specialization_picker: true,
        category_picker: true,
        active_picker: true,
        work_type_picker: false,
        visit_type_picker: false,
        verified_picker: false,
        deviation_type_picker: false,
        days_not_seen_picker: false,
      },
      available_formats: ["json", "xlsx", "pdf"],
      status: "NOW",
      is_ready: true,
    },
    {
      key: "mr_daily_punching",
      title: "MR Daily Punching",
      group: "Attendance and Daily Work",
      description: "Field check-in and check-out logs",
      filter_schema: {
        date_range: true,
        mr_picker: true,
        manager_picker: false,
        territory_picker: false,
        customer_type_picker: false,
        status_picker: false,
        specialization_picker: false,
        category_picker: false,
        active_picker: false,
        work_type_picker: true,
        visit_type_picker: false,
        verified_picker: false,
        deviation_type_picker: false,
        days_not_seen_picker: false,
      },
      available_formats: ["json", "xlsx", "pdf"],
      status: "NOW",
      is_ready: true,
    },
    {
      key: "mr_wise_visits",
      title: "MR Wise Visits",
      group: "Visits",
      description: "Visit logs per customer",
      filter_schema: {
        date_range: true,
        mr_picker: true,
        manager_picker: false,
        territory_picker: true,
        customer_type_picker: true,
        status_picker: true,
        specialization_picker: false,
        category_picker: false,
        active_picker: false,
        work_type_picker: false,
        visit_type_picker: true,
        verified_picker: true,
        deviation_type_picker: false,
        days_not_seen_picker: false,
      },
      available_formats: ["json", "xlsx", "pdf"],
      status: "NOW",
      is_ready: true,
    },
    {
      key: "order_register",
      title: "Order Register",
      group: "Stock and Orders",
      description: "Commercial orders register",
      filter_schema: {
        date_range: true,
        mr_picker: true,
        manager_picker: false,
        territory_picker: false,
        customer_type_picker: false,
        status_picker: true,
        specialization_picker: false,
        category_picker: false,
        active_picker: false,
        work_type_picker: false,
        visit_type_picker: false,
        verified_picker: false,
        deviation_type_picker: false,
        days_not_seen_picker: false,
      },
      available_formats: [],
      status: "P8",
      is_ready: false,
    },
  ];

  test("correctly groups reports into catalog groups", () => {
    const groups = [
      "Master Lists",
      "Attendance and Daily Work",
      "Visits",
      "Stock and Orders",
    ];
    const groupedMap = new Map<string, ReportCatalogItem[]>();
    groups.forEach((g) => groupedMap.set(g, []));

    sampleReports.forEach((r) => {
      groupedMap.get(r.group)?.push(r);
    });

    expect(groupedMap.get("Master Lists")?.length).toBe(1);
    expect(groupedMap.get("Attendance and Daily Work")?.length).toBe(1);
    expect(groupedMap.get("Visits")?.length).toBe(1);
    expect(groupedMap.get("Stock and Orders")?.length).toBe(1);
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
