/**
 * Single source of truth for all route names across the Mediate MR Mobile App.
 * Follows Rule M-18 and Frontend Spec Section 3.1 & 3.2.
 */
export const ROUTES = {
  // Auth & Session
  Splash: "Splash",
  Auth: "Auth",
  Login: "Login",
  ChangePassword: "ChangePassword",

  // Main Tabs Root
  AppTabs: "AppTabs",

  // MR Role Stacks & Screens
  MrHome: "MrHome",
  CheckIn: "CheckIn",
  AttendanceHistory: "AttendanceHistory",
  TodayPlan: "TodayPlan",
  PlanVisit: "PlanVisit",
  Customers: "Customers",
  CustomerDetail: "CustomerDetail",
  CustomerForm: "CustomerForm",
  Nearby: "Nearby",
  DcrList: "DcrList",
  DcrForm: "DcrForm",
  PostCall: "PostCall",
  FollowUps: "FollowUps",
  TourList: "TourList",
  TourPlanner: "TourPlanner",
  ExpenseList: "ExpenseList",
  ExpenseAdd: "ExpenseAdd",
  LeaveList: "LeaveList",
  LeaveApply: "LeaveApply",
  MyRequests: "MyRequests",

  // Manager Role Stacks & Screens
  ManagerHome: "ManagerHome",
  TeamList: "TeamList",
  TeamAttendance: "TeamAttendance",
  ApprovalsInbox: "ApprovalsInbox",
  ApprovalDetail: "ApprovalDetail",

  // Admin Role Stacks & Screens
  AdminHome: "AdminHome",
  UsersList: "UsersList",
  UserForm: "UserForm",
  AssignManager: "AssignManager",
  Masters: "Masters",
  Territories: "Territories",
  ApprovalMatrix: "ApprovalMatrix",
  GeofenceSettings: "GeofenceSettings",

  // Common / Shared
  Profile: "Profile",
  Notifications: "Notifications",
  More: "More",
  ComingSoon: "ComingSoon",
} as const;

export type RouteName = (typeof ROUTES)[keyof typeof ROUTES];
