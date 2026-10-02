# Audit Summary - Mediate MR Mobile App

Date: 2026-10-02
Project: Mediate MR Mobile App (`Mediateappfrontent`)
Spec Reference: `docs/frontend-spec.md` (Sections 1 to 5)

---

## Top 10 Problems Ranked by Impact

### 1. Full-Screen Features Built as Modals Instead of Stack Routes (FND-04 / Rule M-18)
- **Files**:
  - `src/features/tours/screens/TourPlannerModal.tsx`
  - `src/features/expenses/screens/AddExpenseModal.tsx`
  - `src/features/expenses/screens/ExpenseListModal.tsx`
  - `src/features/leaves/screens/LeaveListModal.tsx`
  - `src/features/leaves/screens/ApplyLeaveModal.tsx`
  - `src/features/dcr/screens/DcrFormModal.tsx`
  - `src/features/customers/screens/DoctorDetailModal.tsx`
  - `src/features/customers/screens/AddDoctorModal.tsx`
- **Impact**: Android system/gesture back button behaves unpredictably; deep-linking from notifications (Phase 6) cannot open screens directly; state inside modals is lost upon closure; status bar insets collide.
- **Fix in R4**: Create `routes.ts` & `types.ts`, and convert all 8 modals to registered native stack screens while preserving 100% of their UI aesthetics.

### 2. Missing Native Module: `expo-location` (FND-02)
- **Files**: `package.json`, `src/features/attendance/components/AttendanceCard.tsx`, `src/features/customers/components/LocationCard.tsx`
- **Impact**: Attendance check-in and DCR location capture cannot read real device GPS coordinates. Currently hardcoded with fallback stubs.
- **Fix in R1**: Run `npx expo install expo-location` and integrate `useLocation` hook with foreground permission handling.

### 3. Missing Peer Dependency: `expo-font`
- **Files**: `package.json`
- **Impact**: Flagged by `npx expo-doctor` with Exit Code 1. Required by `@expo/vector-icons`. App may crash outside Expo Go on physical devices.
- **Fix in R1**: Run `npx expo install expo-font`.

### 4. Development Build Rebuild Required for Physical Device Testing
- **Files**: `package.json`, `memory.md`
- **Impact**: `expo-image-picker` was added after the initial dev build APK was compiled. Running image picker on phone crashes with "Cannot find native module".
- **Fix in R1**: Once `expo-location` and `expo-font` are added, a fresh dev build APK must be generated.

### 5. Contract Mismatch: Hand-Written Types Bypassing Generated Schema (FND-01 / Rule M-04)
- **Files**:
  - `src/features/attendance/api/attendanceApi.ts`
  - `src/features/expenses/api/expensesApi.ts`
  - `src/features/leaves/api/leavesApi.ts`
  - `src/features/tours/api/toursApi.ts`
  - `src/features/customers/api/customersApi.ts`
- **Impact**: Hand-written DTO interfaces can silently drift from backend database models and FastAPI responses.
- **Fix in R2**: Map all feature api payloads and responses directly to `components["schemas"][...]` from `src/api/schema.d.ts`.

### 6. Demo Account Switcher Rendered Unconditionally in Login Screen (FND-03 / Rule M-19)
- **Files**: `src/features/auth/screens/LoginScreen.tsx` (lines 302-348)
- **Impact**: Demo account selector pills are visible to end users in production builds whenever `/auth/config` returns sample accounts.
- **Fix in R3**: Gate the quick-switcher behind `process.env.EXPO_PUBLIC_DEV_LOGIN === "true"`.

### 7. Simulated Expense Receipt Upload (FND-03)
- **Files**: `src/features/expenses/screens/AddExpenseModal.tsx`
- **Impact**: Expense creation does not upload physical receipt images to the backend storage endpoint (`/api/v1/files/upload`), sending dummy file ID `999`.
- **Fix in R5**: Connect `expo-image-picker` result to the real multipart upload service.

### 8. Admin Home "Live Field Activity" Not Implemented (FND-09 / Section 8.2)
- **Files**: `src/navigation/RoleTabNavigator.tsx` (line 159)
- **Impact**: Admins see a placeholder welcome card instead of the mandated MR field activity list/map with status indicators.
- **Fix in R5/R6**: Implement Section 8.2 spec using `/dashboard/admin` or temporary mock adapter.

### 9. Missing Test and Lint Scripts in `package.json` (FND-08)
- **Files**: `package.json`
- **Impact**: `npm test` and `npm run lint` fail immediately because scripts are undefined in `package.json`.
- **Fix in R1**: Add ESLint and Jest scripts.

### 10. Missing Phase 1-5 Screens Marked as "Done" in Previous Docs (FND-05 / FND-06)
- **Files**: See `docs/audit/screens.md`
- **Impact**: AttendanceHistory (S12), Customer Nearby (S18), DCR List (S19), Post-Call Analysis (S21), Follow-ups (S22), My Requests (S29), Team Attendance (S42), User Form (S52), Territories (S55), Approval Matrix (S57), Geofence Settings (S58) do not exist yet.
- **Fix in R6**: Build these screens sequentially according to Frontend Spec Section 4.

---

## What Could NOT Be Verified in this Audit (Device Test Notes)
1. **Physical GPS Accuracy & Geofence Verification**: Cannot test actual Android hardware GPS receiver or mock-location detection in emulator/headless without a physical handset test.
2. **Offline Outbox SQLite Persistence on App Force-Kill**: Needs device test (R7 item 10) to confirm SQLite transactions survive process termination.
3. **Receipt Camera Hardware Capture**: Tested in simulator only; camera lens preview and hardware shutter need real phone test.
