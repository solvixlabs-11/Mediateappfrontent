/**
 * Type-safe parameter lists for all registered routes in Mediate MR Mobile App.
 * Follows Rule M-18 and Frontend Spec Section 3.1 & 3.2.
 */

export type RootStackParamList = {
  Auth: undefined;
  AppTabs: undefined;

  // Features converted from Modals to registered stack screens (FND-04)
  TourPlanner: undefined;
  ExpenseList: undefined;
  ExpenseAdd: undefined;
  LeaveList: undefined;
  LeaveApply: undefined;
  DcrForm: {
    initialPlannedVisitId?: number;
    initialCustomerType?: string;
    initialCustomerId?: number;
  } | undefined;
  CustomerDetail: {
    customerType: "DOCTOR" | "CHEMIST" | "HOSPITAL" | "STOCKIST";
    customerId: number;
    customerName?: string;
  };
  CustomerForm: {
    customerType: "DOCTOR" | "CHEMIST" | "HOSPITAL" | "STOCKIST";
    mode?: "create" | "edit";
    customerId?: number;
  };

  // Additional registered stack screens
  AttendanceHistory: undefined;
  Nearby: undefined;
  DcrList: undefined;
  PostCall: { visitId: number };
  FollowUps: undefined;
  MyRequests: undefined;
  TeamAttendance: undefined;
  ApprovalDetail: { requestId: number };
  UserForm: { userId?: number; mode: "create" | "edit" };
  AssignManager: { userId: number; userName: string };
  Territories: undefined;
  ApprovalMatrix: undefined;
  GeofenceSettings: undefined;
  ComingSoon: { featureName: string; phase: string };
};

export type RoleTabParamList = {
  // MR Tabs
  Home: undefined;
  Plan: undefined;
  Customers: undefined;
  Tasks: undefined;
  More: undefined;

  // Manager Tabs
  Team: undefined;
  Approvals: undefined;

  // Admin Tabs
  Users: undefined;
  Masters: undefined;
  Reports: undefined;
};
