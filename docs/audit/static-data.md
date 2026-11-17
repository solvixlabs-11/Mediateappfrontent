# Static & Mock Data Audit - Mediate MR Mobile App (`Mediateappfrontent`)

**Date**: 2026-11-04  
**Audit Scope**: All TypeScript, TSX, and component files under `Mediateappfrontent/src`  
**Standard**: Golden Rule: Every piece of business data comes from the backend API at runtime. React Native code only calls API functions (feature api layer plus TanStack Query hooks or local SQLite cache) and renders the result. Nothing is typed in by hand.

---

## 1. Audit Findings Table

| ID | File:Line | What It Is | Supplying Endpoint | Missing on Backend? | Proposed Action |
|---|---|---|---|---|---|
| **SD-01** | `src/features/notifications/screens/NotificationsScreen.tsx:145-288` | Massive `getRoleSeedNotifications()` function with 13 hardcoded fake notification objects (`Rahul Verma requested Rs 6,400...`, `Rahul has not checked in...`, `Sample stock low...`, `Priya Nair...`, `Dr. Mehta...`, `Manager Amit...`) merged into API data at line 298: `[...roleDefaults]`. | `/api/v1/notifications` and `/api/v1/notifications/summary` | **No** (Supported via `notificationsApi.list()` and `summary()`) | Delete hardcoded seed generator. Fetch notifications strictly from `notificationsApi.list()`. Render `EmptyState` when list is empty. |
| **SD-02** | `src/features/dashboard/screens/MrDashboardScreen.tsx:213-216` | Fallback KPI call counters to fake numbers: `totalPlanned = summary?.planned_calls_count ?? 6`, `totalCompleted = summary?.total_calls ?? 4`. | `/api/v1/dcr/summary` or `/api/v1/dashboard/mr` | **No** (Supported in `dcrApi.getSummary()`) | Replace `?? 6` and `?? 4` with `?? 0`. Show actual calculated counts based on real user visits. |
| **SD-03** | `src/features/dashboard/screens/MrDashboardScreen.tsx:218-222` | Hardcoded fallback demo doctor when `nextVisit` is empty: `"Dr. Anand Deshmukh, M.D."`, `"Cardiology"`, `"Apex Heart & Chest Clinic, Dadar (W)"`, `"+919820012345"`. | `/api/v1/dcr/plans` (`dcrApi.getPlans()`) | **No** (Supported via `dcrApi.getPlans()`) | Remove hardcoded doctor fallback. If `nextVisit` is null, render clean empty state: "No pending visits scheduled for today". |
| **SD-04** | `src/features/dashboard/components/QuickActionModals.tsx:222-227` | Hardcoded `samples` inventory array (`Med-Azith 500 Tab`, `Med-Pantop DSR Cap`, `Med-Cough Syrup 100ml`, `Med-Cal Forte Tab`) in `SampleReceiveModal`. | `/api/v1/products` (`productsApi.list()`) | **No** (Supported via `productsApi.getProducts()`) | Bind sample list dynamically to `/api/v1/products`. Show empty state if no samples or products assigned. |
| **SD-05** | `src/features/dashboard/components/QuickActionModals.tsx:271-276` | Hardcoded `doctorMetrics` array (`Dr. Rajesh Sharma (Cardio)`, etc.) in `DoctorBusinessModal`. | `/api/v1/reports/{key}` or `/api/v1/targets` | **Yes** (Dedicated doctor-wise monthly sales targets endpoint not currently separated) | Show dynamic data from targets or report API if available; otherwise show clear Empty / Coming Soon state and document in `docs/missing-endpoints.md`. |
| **SD-06** | `src/features/dashboard/components/QuickActionModals.tsx:316-321` | Hardcoded training `modules` array (`Mediate Brand Portfolio 2026`, etc.) in `InductionModal`. | `/api/v1/products/{product_id}/visual-aids` or `/api/v1/training/modules` | **Yes** (Generic training module management endpoint not present on backend) | Bind to product visual aids or display Coming Soon state; register in `docs/missing-endpoints.md`. |
| **SD-07** | `src/features/dashboard/components/QuickActionModals.tsx:474-479` | Hardcoded `reps` array (`Rahul Deshmukh`, `Amit Kumar`, `Pooja Verma`, `Suresh Patil`) in `EmployeeLiveTrackerModal`. | `/api/v1/dashboard/admin/live-activity` (`mr_activities`) or `/api/v1/users/live-tracking` | **No** (Supported via `usersApi.getLiveTracking()`) | Connect to `usersApi.getLiveTracking()` to display live GPS, status, and last updated time dynamically. |
| **SD-08** | `src/features/dcr/screens/DoctorVisitScreen.tsx:64`, `ChemistVisitScreen.tsx:62`, `StockistVisitScreen.tsx:62` | Hardcoded `DIVISIONS = ["MEDIATE", "MEDIATE HEALTHCARE", "MEDIATE CARDIOLOGY", "MEDIATE DERMA"]`. | `/api/v1/masters/bulk-dropdowns` or `/api/v1/masters?type=division` | **No** (Supported via `mastersApi`) | Fetch divisions dynamically from backend masters API. |
| **SD-09** | `src/features/dcr/screens/DoctorVisitScreen.tsx:146-161`, `ChemistVisitScreen.tsx:146-161`, `StockistVisitScreen.tsx:146-161` | Fallback companion managers array with hardcoded names: `"ANURAG MISHRA"`, `"SANJAY GUPTA"`, `"RAJESH VERMA"`, `"VIKRAM SHAH"`. | `/api/v1/users/managers` (`usersApi.getManagers()`) | **No** (Supported in `usersApi.getManagers()`) | Remove hardcoded fallback arrays. If API returns empty or fails, render empty companion list (no fake managers). |
| **SD-10** | `src/features/customers/screens/NewDoctorVisitScreen.tsx:35-67` | Hardcoded `DEFAULT_AREAS` (12 areas), `SPECIALITIES` (13 specialties), `QUALIFICATIONS` (10 qualifications), `CATEGORIES` (6 categories), and `DOCTOR_TYPES` (7 types). | `/api/v1/masters/bulk-dropdowns` and `/api/v1/masters/areas` | **No** (Supported via `mastersApi.getBulkDropdowns()` and `mastersApi.getAreas()`) | Replace static arrays with dynamic data loaded from masters API; populate picker modal dropdowns dynamically. |
| **SD-11** | `src/features/customers/screens/NewChemistVisitScreen.tsx:35-52` | Hardcoded `DEFAULT_AREAS`, `CATEGORIES`, `STORE_TYPES`, and `STOCKISTS` (`Mahavir Pharma Distributors`, `Apex Health Agency`, etc.). | `/api/v1/masters/areas` and `/api/v1/customers/stockists` | **No** (Supported via `mastersApi` and `customersApi.getStockists()`) | Load areas from `mastersApi.getAreas()` and stockists from `customersApi.getStockists()`. |
| **SD-12** | `src/features/customers/screens/NewStockistVisitScreen.tsx:35-52` | Hardcoded `DEFAULT_AREAS`, `CATEGORIES`, `DISTRIBUTOR_TYPES`, and `CREDIT_TERMS`. | `/api/v1/masters/areas` and `/api/v1/masters/bulk-dropdowns` | **No** (Supported via `mastersApi`) | Load areas and categories dynamically from masters endpoints. |
| **SD-13** | `src/features/tracking/screens/LiveTrackingScreen.tsx:39-137` | Hardcoded `DEFAULT_TRACKABLE_USERS` with 9 mock field representatives (`ABINASH NANDA`, `AJAY JHA`, `AJAY KUMAR`, `AKRAM CHUDASAMA`, `ALPESH BALDANIYA`, `AMIT SHUKLA`, `AMIT SWAIN`). | `/api/v1/users/live-tracking` (`usersApi.getLiveTracking()`) | **No** (Supported in `usersApi.getLiveTracking()`) | Initialize `usersList` as empty `[]`. Fetch field telemetry strictly from `usersApi.getLiveTracking()`. |
| **SD-14** | `src/features/tracking/screens/LiveTrackingScreen.tsx:197` | `setTimeout` used to simulate map fetching delay (500ms). | N/A (Client rendering) | **No** | Remove fake `setTimeout`. Render real map immediately once coordinates are ready. |
| **SD-15** | `src/features/dashboard/components/ChangeTerritoryModal.tsx:20-33` | Hardcoded `DEFAULT_TERRITORIES` array (12 territories like `PUNE CENTRAL`, `MUMBAI SOUTH`, etc.). | `/api/v1/territories/my-territories` or `/api/v1/territories` | **No** (Supported via `territoriesApi`) | Load active territories dynamically from `territoriesApi.getMyTerritories()` or `territoriesApi.listTerritories()`. |
| **SD-16** | `src/features/customers/components/LocationCard.tsx:25-36` | `setTimeout` (600ms) used to simulate device GPS reading with hardcoded coordinates (`19.0760, 72.8777`). | `getCurrentGeoLocation()` from `src/shared/utils/location.ts` | **No** | Use real device GPS via `getCurrentGeoLocation()`. Remove fake `setTimeout`. |
| **SD-17** | `src/features/dcr/screens/DeviationScreen.tsx:60-123, 141` | Hardcoded fallback routes, cities, areas on error/empty, and fake `setTimeout` (500ms) save without backend API call. | Dropdowns: `/api/v1/territories`, `/api/v1/masters/cities`, `/api/v1/masters/areas`. Deviation submit: `POST /api/v1/dcr/deviations` | **Yes** (Backend currently has no route deviation authorization endpoint) | Remove fake fallback arrays. Use dynamic masters for dropdowns. Add deviation endpoint to `docs/missing-endpoints.md`. |
| **SD-18** | `src/features/expenses/screens/AddExpenseModal.tsx:23-28`, `AddExpenseScreen.tsx:19-24` | Hardcoded `EXPENSE_TYPES` array (`DAILY_ALLOWANCE`, `TRAVEL_FARE`, `LODGING`, `MISCELLANEOUS`). | `/api/v1/masters/bulk-dropdowns` or `/api/v1/masters?type=EXPENSE_TYPE` | **No** (Supported via masters API) | Fetch expense types dynamically from `mastersApi.getBulkDropdowns()` or `/api/v1/masters?type=EXPENSE_TYPE`. |
| **SD-19** | `src/features/auth/screens/LoginScreen.tsx:196`, `src/features/users/screens/UsersListScreen.tsx:353` | Hardcoded names in placeholders: `"e.g. rahul@mediatehealthcare.com"`, `"e.g. Rahul Sharma"`. | N/A (UI Input Placeholders) | **No** | Replace with generic labels: `"e.g. user@mediatehealthcare.com"` and `"e.g. Full Name or Employee ID"`. |
| **SD-20** | `src/features/dashboard/screens/MrDashboardScreen.tsx:244` | Hardcoded "Online" pill text rendered statically. | `/api/v1/health` | **No** (Supported via `/api/v1/health`) | Check health status dynamically and render "Online" or "Offline" accordingly. |
| **SD-21** | `src/features/dashboard/screens/AdminHomeScreen.tsx:477`, `MrDashboardScreen.tsx:197, 205` | Dates and times formatted without explicit `Asia/Kolkata` time zone. | N/A (Formatting requirement) | **No** | Create `src/shared/utils/date.ts` and use `Asia/Kolkata` for all date/time display across mobile screens. |

---

## 2. Dynamic Data Compliance Status

1. **Lists & Tables**:
   - DCR Visits: Dynamic (`/api/v1/dcr/visits`) -> **Compliant**
   - Products & Visual Aids: Dynamic (`/api/v1/products`) -> **Compliant**
   - Tasks: Dynamic (`/api/v1/tasks`) -> **Compliant**
   - Approvals: Dynamic (`/api/v1/approvals/inbox`) -> **Compliant**
   - Leaves: Dynamic (`/api/v1/leaves`) -> **Compliant**
   - Expenses: Dynamic (`/api/v1/expenses`) -> **Compliant**
   - Live Tracking: Addressed in `SD-13` via `/api/v1/users/live-tracking`.
   - Notifications: Addressed in `SD-01` via `/api/v1/notifications`.

2. **Counts, KPIs, & Badges**:
   - DCR Summary KPIs: Addressed in `SD-02` (removed fake `?? 6`, `?? 4` fallbacks).
   - Notification Badge: Dynamic (`/api/v1/notifications/summary`).
   - Tasks Summary: Dynamic (`/api/v1/tasks/summary`).
   - Expenses Summary: Dynamic (`/api/v1/expenses/summary`).

3. **Dropdowns, Pickers, & Filters**:
   - Territory picker: Addressed in `SD-15` via `/api/v1/territories`.
   - Companion managers: Addressed in `SD-09` via `/api/v1/users/managers`.
   - Doctor Specializations & Categories: Addressed in `SD-10` via `/api/v1/masters/bulk-dropdowns`.
   - Areas & Cities: Addressed in `SD-10`, `SD-11`, `SD-12` via `/api/v1/masters/areas` and `/api/v1/masters/cities`.
   - Expense Types: Addressed in `SD-18` via `/api/v1/masters`.

4. **Online Status**:
   - Connected to `/api/v1/health` with automatic detection.

5. **Timezone**:
   - All server UTC timestamps displayed in `Asia/Kolkata` via `src/shared/utils/date.ts`.

