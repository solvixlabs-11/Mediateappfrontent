# Changelog - Mediate Healthcare MR Mobile App

## [Phase 5] - Manager Approvals & MR Tour, Expenses, Leaves (2026-10-02)

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
