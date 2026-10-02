# Contract and Mocks Audit

Date: 2026-10-02
Project: Mediate MR Mobile App (`Mediateappfrontent`)

---

## 1. OpenAPI & Generated Contract Analysis
- **OpenAPI Schema Path**: `openapi.json`
- **Total Endpoints in OpenAPI**: **53 paths** (Full Phase 5 backend API: Auth, Users, Masters, Territories, Customers, Attendance, DCR, Approvals, Tours, Expenses, Leaves).
- **Target Schema Type File**: `src/api/schema.d.ts` (generated via `npm run gen:api` from `openapi-typescript 7.13.0`).
- **Generation Command**: `npm run gen:api` executed cleanly (199ms).

---

## 2. Hand-Written Types Audit
Hand-written interfaces were created across features prior to Phase 5 openapi synchronization:
1. `src/features/attendance/api/attendanceApi.ts`:
   - Hand-written: `interface AttendanceDto`
   - Generated equivalent: `components["schemas"]["AttendanceResponse"]`
2. `src/features/expenses/api/expensesApi.ts`:
   - Hand-written: `interface ExpenseDto`, `interface ExpenseCreatePayload`, `interface ExpenseSummaryDto`
   - Generated equivalent: `components["schemas"]["ExpenseResponse"]`, `components["schemas"]["ExpenseCreate"]`, `components["schemas"]["ExpenseSummaryResponse"]`
3. `src/features/leaves/api/leavesApi.ts`:
   - Hand-written: `interface LeaveDto`, `interface LeaveBalanceDto`, `interface LeaveApplyPayload`
   - Generated equivalent: `components["schemas"]["LeaveResponse"]`, `components["schemas"]["LeaveBalanceResponse"]`, `components["schemas"]["LeaveCreate"]`
4. `src/features/tours/api/toursApi.ts`:
   - Hand-written: `interface TourPlanDto`, `interface TourDayDto`, `interface TourPlanCreatePayload`
   - Generated equivalent: `components["schemas"]["TourPlanResponse"]`, `components["schemas"]["TourPlanCreate"]`
5. `src/features/dcr/api/dcrApi.ts`:
   - Hand-written DCR payload and visit response types.
   - Generated equivalent: `components["schemas"]["DCRVisitResponse"]`, `components["schemas"]["DCRVisitCreate"]`
6. `src/features/customers/api/customersApi.ts`:
   - Hand-written Doctor/Chemist/Stockist list & detail interfaces.
   - Generated equivalent: `components["schemas"]["DoctorResponse"]`, `components["schemas"]["ChemistResponse"]`, `components["schemas"]["StockistResponse"]`
7. `src/features/approvals/api/approvalsApi.ts`:
   - Hand-written approval item interfaces.
   - Generated equivalent: `components["schemas"]["ApprovalRequestResponse"]`

---

## 3. Demo / Mock / Simulated / Fake Code Audit
1. **Login Demo Switcher**:
   - `src/features/auth/screens/LoginScreen.tsx`: Demo account pills rendered unconditionally when `demo_accounts` is returned by `/api/v1/auth/config`.
   - **Violation of FND-03 / Rule M-19**: Must be restricted behind `EXPO_PUBLIC_DEV_LOGIN === "true"`.
2. **Dashboard Fallback Demo Data**:
   - `src/features/dashboard/screens/MrDashboardScreen.tsx` (line 182): Hardcoded fallback to a demo doctor ("Dr. Rajiv Sharma") when no planned visit exists in database.
3. **Location Simulation**:
   - `src/features/customers/components/LocationCard.tsx` (line 25): Simulates GPS coordinate fetching with fixed fallback numbers rather than using `expo-location`.
4. **Expense Receipt Simulation**:
   - `src/features/expenses/screens/AddExpenseModal.tsx`: Simulated file upload ID fallback when camera/file picker upload endpoint is bypassed.
5. **ComingSoon Screens**:
   - `src/navigation/RoleTabNavigator.tsx`: Unbuilt tabs (Tasks P6, Reports P7, Users P1, Masters P2) properly display `<ComingSoonScreen />`.
