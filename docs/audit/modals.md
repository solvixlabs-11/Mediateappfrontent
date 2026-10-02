# Modals Audit (Full Screens Implemented as Modals)

Date: 2026-10-02
Project: Mediate MR Mobile App (`Mediateappfrontent`)

---

## 1. Finding & Impact (FND-04)
Several core features are built as full-screen React Native `<Modal visible={...}>` components rather than registered stack screens with navigation routes.
- **Impact**:
  - Android hardware/gesture back button exits the app or fails to dismiss inner views properly.
  - Deep-linking from push notifications (required in Phase 6) cannot open these features directly.
  - State inside the modal is lost upon closure.
  - Difficult to test in isolation with automated tests.
  - Status bar and notch insets are often covered or clipped inside modals.

---

## 2. Inventory of Full-Screen Modals

| Modal Component | File Location | Invoked From | Nature of Feature | Refactor Target in R4 |
|---|---|---|---|---|
| `TourPlannerModal` | `src/features/tours/screens/TourPlannerModal.tsx` | `MrDashboardScreen.tsx` | Tour planning form with dates & stops | Registered Stack Screen (`ROUTES.TourPlanner`) |
| `ExpenseListModal` | `src/features/expenses/screens/ExpenseListModal.tsx` | `MrDashboardScreen.tsx` | Monthly expense list & summary | Registered Stack Screen (`ROUTES.ExpenseList`) |
| `AddExpenseModal` | `src/features/expenses/screens/AddExpenseModal.tsx` | `ExpenseListModal.tsx` / `MrDashboardScreen.tsx` | Add expense entry with receipt camera | Registered Stack Screen (`ROUTES.ExpenseAdd`) |
| `LeaveListModal` | `src/features/leaves/screens/LeaveListModal.tsx` | `MrDashboardScreen.tsx` | Leave balance and history list | Registered Stack Screen (`ROUTES.LeaveList`) |
| `ApplyLeaveModal` | `src/features/leaves/screens/ApplyLeaveModal.tsx` | `LeaveListModal.tsx` / `MrDashboardScreen.tsx` | Apply leave form | Registered Stack Screen (`ROUTES.LeaveApply`) |
| `DcrFormModal` | `src/features/dcr/screens/DcrFormModal.tsx` | `MrDashboardScreen.tsx` / `PlanVisitsScreen.tsx` | Multi-step Daily Call Report | Registered Stack Screen (`ROUTES.DcrForm`) |
| `DoctorDetailModal` | `src/features/customers/screens/DoctorDetailModal.tsx` | `CustomersHomeScreen.tsx` | Doctor details and visit launch | Registered Stack Screen (`ROUTES.CustomerDetail`) |
| `AddDoctorModal` | `src/features/customers/screens/AddDoctorModal.tsx` | `CustomersHomeScreen.tsx` | Add/Edit Doctor form | Registered Stack Screen (`ROUTES.CustomerForm`) |

---

## 3. Allowed Modals vs Prohibited Modals (Rule M-18)
- **Allowed as Modal**: Confirm dialogs, bottom sheets (filter sheets, item picker sheets, reject comments), image preview zoom.
- **Prohibited as Modal**: Full forms (DCR, Tour, Expense, Leave, Customer Add) and full records lists (Expenses, Leaves). These must become registered stack screens.
