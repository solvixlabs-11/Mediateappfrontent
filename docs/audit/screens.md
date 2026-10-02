# Screen Matrix Audit

Date: 2026-10-02
Project: Mediate MR Mobile App (`Mediateappfrontent`)

Evidence key: **PASS** = Screen opens and fulfills contract; **FAIL** = Buggy/Broken/Modal-as-screen; **MISSING** = Screen not built yet.

---

### 1. Common Screens (S01 - S09)

| ID | Route | Screen | Route Registered | File Exists | Uses Real API | Uses Mock Data | States (Loading/Empty/Error) | Role Gated | Audit Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| S01 | Splash | Splash | No (conditional) | No | Partial (`/auth/me`) | No | No | Yes | **FAIL** | Embedded inside RootNavigator auth check |
| S02 | Login | Login | Yes (`Auth`) | Yes (`LoginScreen.tsx`) | Yes (`/auth/login`) | Yes (demo switcher) | Yes | Yes | **PASS (Needs Fix)** | Demo switcher needs `EXPO_PUBLIC_DEV_LOGIN` gate |
| S03 | ChangePassword | Change Password | No | No | No | No | No | Yes | **MISSING** | Forced change flow missing |
| S04 | Profile | Profile | Yes (`Profile`) | Yes (`ProfileScreen.tsx`) | Yes (`/profile`, `/auth/logout`) | No | Yes | Yes | **PASS** | Working photo upload and logout |
| S05 | Notifications | Notification Center | No | No | No | No | No | Yes | **MISSING** | Phase 6 |
| S06 | SyncStatus | Sync Status | No | No | No | No | No | Yes | **MISSING** | Phase 9 |
| S07 | ConflictReview | Conflict Review | No | No | No | No | No | Yes | **MISSING** | Phase 9 |
| S08 | NeedsAttention | Needs Attention | No | No | No | No | No | Yes | **MISSING** | Phase 9 |
| S09 | More | More Menu | No | No | No | No | No | Yes | **MISSING** | Tab 5 currently set to Profile directly |

---

### 2. MR Screens (S10 - S39)

| ID | Route | Screen | Route Registered | File Exists | Uses Real API | Uses Mock Data | States | Role Gated | Audit Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| S10 | MrHome | MR Home | Yes (`Planner`) | Yes (`MrDashboardScreen.tsx`) | Yes | Partial | Yes | Yes (MR) | **PASS** | Next-up fallback demo doctor to remove |
| S11 | CheckIn | Check-in Flow | No (embedded) | Yes (`AttendanceCard.tsx`) | Yes | Yes (GPS simulation) | Yes | Yes | **FAIL** | Native `expo-location` missing |
| S12 | AttendanceHistory | Attendance History | No | No | No | No | No | Yes | **MISSING** | Missing screen of Phase 3 |
| S13 | TodayPlan | Today's Plan | Yes (`Visits`) | Yes (`PlanVisitsScreen.tsx`) | Yes | No | Yes | Yes | **PASS** | Day strip and visit cards working |
| S14 | PlanVisit | Plan Visit | No (inline) | Yes (`PlanVisitsScreen.tsx`) | Yes | No | Yes | Yes | **PASS** | Inline modal/form in Visits screen |
| S15 | Customers | Customers (4 tabs) | Yes (`DCR`/`Orders`) | Yes (`CustomersHomeScreen.tsx`) | Yes (Doctors, Chemists, Stockists) | No | Yes | Yes | **PASS** | Missing Hospitals tab |
| S16 | CustomerDetail | Customer Detail | No | Yes (`DoctorDetailModal.tsx`) | Yes | No | Yes | Yes | **FAIL (Modal)** | Built as modal, not stack screen |
| S17 | CustomerForm | Add/Edit Customer | No | Yes (`AddDoctorModal.tsx`) | Yes | Yes (GPS stub) | Yes | Yes | **FAIL (Modal)** | Built as modal, not stack screen |
| S18 | Nearby | Nearby Customers | No | No | No | No | No | Yes | **MISSING** | Missing screen of Phase 2 |
| S19 | DcrList | Visit Report History | No | No | No | No | No | Yes | **MISSING** | Missing screen of Phase 4 |
| S20 | DcrForm | Visit Report (Steps) | No | Yes (`DcrFormModal.tsx`) | Yes | No | Yes | Yes | **FAIL (Modal)** | Multi-step form built as modal |
| S21 | PostCall | Post-Call Analysis | No | No | No | No | No | Yes | **MISSING** | Missing screen of Phase 4 |
| S22 | FollowUps | Follow-Ups | No | No | No | No | No | Yes | **MISSING** | Missing screen of Phase 4 |
| S23 | TourList | Tour Plans | No | Yes (`TourPlannerModal.tsx`) | Yes | No | Yes | Yes | **FAIL (Modal)** | Built inside TourPlannerModal |
| S24 | TourPlanner | Tour Planner | No | Yes (`TourPlannerModal.tsx`) | Yes | No | Yes | Yes | **FAIL (Modal)** | Built as modal, not stack screen |
| S25 | ExpenseList | Expenses List | No | Yes (`ExpenseListModal.tsx`) | Yes | No | Yes | Yes | **FAIL (Modal)** | Built as modal, not stack screen |
| S26 | ExpenseAdd | Add Expense | No | Yes (`AddExpenseModal.tsx`) | Yes | Yes (receipt sim) | Yes | Yes | **FAIL (Modal)** | Built as modal; receipt upload simulated |
| S27 | LeaveList | Leaves List | No | Yes (`LeaveListModal.tsx`) | Yes | No | Yes | Yes | **FAIL (Modal)** | Built as modal, not stack screen |
| S28 | LeaveApply | Apply Leave | No | Yes (`ApplyLeaveModal.tsx`) | Yes | No | Yes | Yes | **FAIL (Modal)** | Built as modal, not stack screen |
| S29 | MyRequests | My Requests View | No | No | No | No | No | Yes | **MISSING** | Missing unified view of Phase 5 |
| S30-S39 | - | P6-P8 MR Screens | No | No | No | No | No | Yes | **MISSING** | Future phases (P6 - P8) |

---

### 3. Manager Screens (S40 - S49)

| ID | Route | Screen | Route Registered | File Exists | Uses Real API | Uses Mock Data | States | Role Gated | Audit Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| S40 | ManagerHome | Manager Home | Yes (`Home`) | Yes (`HomeScreen` stub) | No | No | No | Yes (Manager) | **FAIL** | Generic placeholder card |
| S41 | TeamList | Team (My MRs) | Yes (`Team`) | Yes (`MyTeamScreen.tsx`) | Yes | No | Yes | Yes | **PASS** | Cards with MR details working |
| S42 | TeamAttendance | Team Attendance | No | No | No | No | No | Yes | **MISSING** | Missing screen of Phase 3 |
| S43 | TeamMap | Team Map | No | No | No | No | No | Yes | **MISSING** | Phase 7 |
| S44 | MrDetail | MR Detail | No | No | No | No | No | Yes | **MISSING** | Phase 6 |
| S45 | ApprovalsInbox | Approvals Inbox | Yes (`Approvals`) | Yes (`ApprovalsInboxScreen.tsx`) | Yes | No | Yes | Yes | **PASS** | Grouped by type, filter working |
| S46 | ApprovalDetail | Approval Detail | No (inline) | Yes (`ApprovalsInboxScreen.tsx`) | Yes | No | Yes | Yes | **PASS** | Inline expanded card/dialog |
| S47-S49 | - | P6-P7 Manager Screens | No | No | No | No | No | Yes | **MISSING** | Future phases (P6 - P7) |

---

### 4. Admin Screens (S50 - S63)

| ID | Route | Screen | Route Registered | File Exists | Uses Real API | Uses Mock Data | States | Role Gated | Audit Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| S50 | AdminHome | Admin Home (Live Activity) | Yes (`Home`) | Yes (`HomeScreen` stub) | No | No | No | Yes (Admin) | **FAIL** | Needs Section 8.2 Live Field Activity |
| S51 | UsersList | Users List | Yes (`Users`) | Yes (`UsersListScreen.tsx`) | Yes | No | Yes | Yes | **PASS** | Search, filter, active toggle working |
| S52 | UserForm | User Form | No | No | No | No | No | Yes | **MISSING** | Create/Edit user screen missing |
| S53 | AssignManager | Assign Manager | No | No | No | No | No | Yes | **MISSING** | Manager assignment screen missing |
| S54 | Masters | Masters (Dropdowns) | Yes (`Masters`) | Yes (`AdminMastersScreen.tsx`) | Yes | No | Yes | Yes | **PASS** | State/City/Area working |
| S55 | Territories | Territories | No | No | No | No | No | Yes | **MISSING** | Missing screen of Phase 2 |
| S56 | CustomersAdmin | Customers Admin / Excel | No | No | No | No | No | Yes | **MISSING** | Phase 2 Excel import |
| S57 | ApprovalMatrix | Approval Matrix | No | No | No | No | No | Yes | **MISSING** | Missing screen of Phase 5 |
| S58 | GeofenceSettings | Geofence Settings | No | No | No | No | No | Yes | **MISSING** | Missing screen of Phase 3 |
| S59-S63 | - | P6-P8 Admin Screens | No | No | No | No | No | Yes | **MISSING** | Future phases (P6 - P8) |
