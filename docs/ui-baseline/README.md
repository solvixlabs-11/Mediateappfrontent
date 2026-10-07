# UI Baseline - Phase 7 Reports & Analytics (View & Export)

Date: 2026-10-05
Resolution: 360 x 640 dp (Mobile Android baseline)
Theme: Frozen design tokens (#0C5D46 primary deep green, #DCFCE7 light green pills, #F5F8FB background, #12355B navy text)

## 1. Registered Stack Screens (No Full-Screen Modals)

1. **`ReportsCatalogScreen` (`ROUTES.ReportsCatalog`)**:
   - Reads `GET /api/v1/reports`.
   - Role-scoped catalog display with dynamic scope chip: `"Showing: Your team (8 MRs)"` / `"Showing: Self"`.
   - Search bar filtering reports by name, code, or description.
   - Categorized into 4 standard report groups:
     - `Activity` (R01 DCR Detailed, R02 Daily Activity Summary, R06 Pending/Late DCR, R07 Geo-Verification, R08 Planned vs Actual)
     - `Customers` (R03 Customer-wise Visits, R04 Coverage, R05 MR Performance, R13 Follow-up)
     - `HR and Expense` (R09 Attendance, R10 Leave, R11 Expense, R12 Tour Plan)
     - `Approvals` (R14 Approval Turnaround)
   - Recent Exports (Last 10): Local SQLite persistence, displays filename, time, format badge, and one-tap re-share through `expo-sharing`.
   - Navigation placement: Under `Reports` tab for Admin; under `More` tab for MR and Manager.

2. **`ReportFiltersScreen` (`ROUTES.ReportFilters`)**:
   - Date range presets: `Today`, `Yesterday`, `This week`, `This month`, `Last month`, `Custom`.
   - Validation ensuring range <= 92 days.
   - MR Picker:
     - **MR role**: No MR picker (forced to self).
     - **MANAGER role**: Own team MR picker only (`usersApi.getMyTeam`).
     - **ADMIN role**: All MRs picker + Manager filter dropdown (`usersApi.getManagers`).
   - Optional filters: Territory picker, Status picker, Customer type picker (Doctor, Chemist, Hospital, Stockist).
   - "Generate Report" action button navigating to `ReportResult`.

3. **`ReportResultScreen` (`ROUTES.ReportResult`)**:
   - Header with back button, report title, scope label, and `Export` action button.
   - Summary strip: Horizontal scroll KPI cards with light green `#DCFCE7` background and bold numbers.
   - Active filter chips: Tapping any chip reopens `ReportFiltersScreen` with current filters pre-filled.
   - Card list (not a wide table) with infinite scroll pagination (`useInfiniteQuery`), pull-to-refresh.
   - Offline handling: Shows cached SQLite result with banner `"Reports need internet. Showing last saved result"`; disables export offline.

4. **`ExportBottomSheet`**:
   - Modal bottom sheet choosing PDF or Excel (.xlsx).
   - Filename preview conforming to Section 7: `<key>_<from>_to_<to>_<scope>.<ext>`.
   - Download button with progress indicator and Cancel button.
   - Downloads via `expo-file-system` to `${FileSystem.cacheDirectory}reports/` and launches system share sheet via `expo-sharing`.
   - Success toast and writes to local Recent Exports.

## 2. Test Verification Summary
- `reportRoleAccess.test.ts`: 4 tests passed (catalog grouping, MR/Manager/Admin picker permissions).
- `reportErrors.test.ts`: 6 tests passed (friendly error mapping for `REPORT_SCOPE_DENIED`, `REPORT_RANGE_TOO_LARGE`, `EXPORT_TOO_LARGE`, `REPORT_NOT_FOUND`).
- `reportDateUtils.test.ts`: 8 tests passed (Presets and 92-day limit enforcement).
- `reportExport.test.ts`: 4 tests passed (filename format, mocked FileSystem download, Sharing sheet, SQLite persistence).
- Total: 22 / 22 unit tests passing; TypeScript strict mode (0 errors); ESLint clean.
