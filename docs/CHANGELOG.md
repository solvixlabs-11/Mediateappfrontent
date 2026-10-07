# Changelog - Mediate Healthcare MR Mobile App

## [Phase 7] - Reports Engine with View, Filters, & Download (2026-10-05)

### Added
- **Reports Catalog (`src/features/reports/screens/ReportsCatalogScreen.tsx`)**:
  - Registered as standard stack screen `ROUTES.ReportsCatalog` (no full-screen modals).
  - Categorized reports into 4 groups: Activity, Customers, HR and Expense, Approvals.
  - Search box filtering by title, key, or description.
  - Dynamic scope chip: "Showing: Your team (8 MRs)" / "Showing: Self".
  - Embedded "Recent exports" list (last 10) persisted locally in SQLite with one-tap system sharing.
  - Role-based placement: under `Reports` tab for Admin, and under `More` tab for MR and Manager.
- **Report Filters (`src/features/reports/screens/ReportFiltersScreen.tsx`)**:
  - Registered as `ROUTES.ReportFilters`.
  - Date presets: Today, Yesterday, This week, This month, Last month, Custom. Enforces 92-day max range limit.
  - Strict role-based MR picker: MR role has NO MR picker; Manager has team picker; Admin has all MRs + Manager dropdown.
  - Territory picker, Status picker, and Customer type picker.
- **Report Result (`src/features/reports/screens/ReportResultScreen.tsx`)**:
  - Registered as `ROUTES.ReportResult`.
  - KPI summary strip at top in light green `#DCFCE7` cards.
  - Active filter chips that reopen `ReportFiltersScreen` with state pre-filled.
  - Infinite scroll card list using TanStack `useInfiniteQuery` and pull-to-refresh.
  - Offline mode: detects offline state, displays `"Reports need internet. Showing last saved result"` from SQLite cache, and disables export.
- **Export Bottom Sheet (`src/features/reports/components/ExportBottomSheet.tsx`)**:
  - Chooses PDF or Excel (.xlsx).
  - Formats filename conforming to spec: `<key>_<from>_to_<to>_<scope>.<ext>`.
  - Resumable download with progress tracking and Cancel button using `expo-file-system`.
  - Launches system share sheet with `expo-sharing` (correct MIME types: `application/pdf`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`).
  - Records into Recent Exports and displays success toast.
- **Data & Storage Layer (`src/features/reports/api/`, `hooks/`, `services/`)**:
  - Generated types from OpenAPI schema (`openapi.json`).
  - Friendly error mappings for `REPORT_SCOPE_DENIED`, `REPORT_RANGE_TOO_LARGE`, `EXPORT_TOO_LARGE`, `REPORT_NOT_FOUND`.
  - SQLite persistence (`reportsStorage.ts`) for recent exports and offline report caching.
- **Tests**:
  - 4 test suites passing (22/22 tests green): `reportRoleAccess.test.ts`, `reportErrors.test.ts`, `reportDateUtils.test.ts`, `reportExport.test.ts`.
  - Strict TypeScript compilation (`tsc --noEmit` clean: 0 errors).


### Added
- **Manager Approvals Inbox (`src/features/approvals/screens/ApprovalsInboxScreen.tsx`)**:
  - Direct integration into Manager Bottom Navigation tab (`Approvals`).
  - Segregated "Pending Requests" and "History" views with real-time pending badge counter.
  - Interactive request cards for Tour Programs, Expense Claims, and Leave Applications.
  - One-tap "Approve" with confirmation dialog and "Reject" modal strictly enforcing rule **BR-08** (mandatory feedback comment).
- **Tour Program Planning (`src/features/tours/screens/TourPlannerModal.tsx`)**:
  - Modal launched from MR Dashboard Quick Actions to plan fortnightly and monthly beat itineraries.
  - Validates route details, target doctors, objectives, and verifies non-overlapping dates per **BR-09**.
- **Expense Claims (`src/features/expenses/screens/ExpenseListModal.tsx` & `AddExpenseModal.tsx`)**:
  - Real-time monthly metrics: Total Claimed, Approved, and Pending.
  - Expense categories: Daily Allowance (DA), Travel Fare (TA), Hotel/Lodging, and Misc.
  - Receipt attachment simulation and display of manager rejection feedback.
- **Leave Application (`src/features/leaves/screens/LeaveListModal.tsx` & `ApplyLeaveModal.tsx`)**:
  - Live balance meters for Casual Leave (CL), Sick Leave (SL), and Earned Leave (EL).
  - Half-day (0.5 day) toggle with automated end-date sync.
  - Leave cancellation action for pending or approved leaves (reversing balance deductions per **BR-10**).
- **Dashboard Quick Actions Integration**:
  - Wired MR Dashboard tiles ("Plan Tour / TP", "Add Expense", "Apply Leave", and "Expense Alert Pill") to Phase 5 modals.

---

## [Phase 4] - MR Operations Dashboard & Daily Call Report (DCR) (2026-10-01)

### Added
- **MR Field Operations Dashboard (`src/features/dashboard/screens/MrDashboardScreen.tsx`)**:
  - Professional, modern UI matching field rep workflows.
  - Live greeting banner with online status pill and actionable alert badges.
  - One-tap Field Work GPS Attendance punch-in/out with location accuracy, duration timer, and graceful 409 idempotency handling.
  - Today's Targets & Metrics (Calls Completed vs Target, Chemist Orders, POB Booking).
  - "Next Up" doctor visit card with direct Call Detailing launcher and direct phone dialer.
  - 6 Standard Ops quick-action tiles and cloud sync status footer.
- **DCR Logging (`src/features/dcr/screens/DcrFormModal.tsx` & `PlanVisitsScreen.tsx`)**:
  - Multi-step customer visit logging with GPS geo-tagging.
  - Follow-up action reminders.

---

## [Phase 3] - Field Attendance & GPS Tracking (2026-10-01)

### Added
- **Attendance Card & Screen (`src/features/attendance/components/AttendanceCard.tsx`)**:
  - Real-time GPS location fetch with mock-location flag detection.
  - Work duration calculation in minutes.
  - Offline-safe caching and today's status restore.

---

## [Phase 2] - Customer Profiles & Master Catalogs (2026-10-01)

### Added
- **Customers & Masters**:
  - `CustomersHomeScreen.tsx`: tabbed directory for Doctors, Chemists, and Stockists with specialty filters.
  - `DoctorDetailModal.tsx` and `LocationCard.tsx` with GPS coordinates.
  - `AdminMastersScreen.tsx` for state, city, area master configurations.

---

## [Phase 1] - Authentication, Secure Storage & Roles (2026-09-30)

### Added
- **Auth & Session**:
  - `LoginScreen.tsx` with role quick-selector for Admin, Manager, and MR demo logins.
  - SecureStore token persistence (`useAuthStore`).
  - Automatic token refresh interceptor in Axios `apiClient`.
  - Profile screen with role badge, contact details, and logout flow.
- **Role Navigation (`RoleTabNavigator.tsx`)**:
  - Customized bottom navigation tabs per role (MR, Manager, Admin).
