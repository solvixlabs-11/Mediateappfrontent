import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoginScreen } from "../features/auth/screens/LoginScreen";
import { useAuthStore } from "../features/auth/store";
import { RoleTabNavigator } from "./RoleTabNavigator";
import { ROUTES } from "./routes";
import { RootStackParamList } from "./types";

// Registered stack screens
import { TourPlannerScreen } from "../features/tours/screens/TourPlannerScreen";
import { ExpenseListScreen } from "../features/expenses/screens/ExpenseListScreen";
import { AddExpenseScreen } from "../features/expenses/screens/AddExpenseScreen";
import { LeaveListScreen } from "../features/leaves/screens/LeaveListScreen";
import { ApplyLeaveScreen } from "../features/leaves/screens/ApplyLeaveScreen";
import { DcrFormScreen } from "../features/dcr/screens/DcrFormScreen";
import { DeviationScreen } from "../features/dcr/screens/DeviationScreen";
import { DoctorVisitScreen } from "../features/dcr/screens/DoctorVisitScreen";
import { NewDoctorVisitScreen } from "../features/customers/screens/NewDoctorVisitScreen";
import { ChemistVisitScreen } from "../features/dcr/screens/ChemistVisitScreen";
import { NewChemistVisitScreen } from "../features/customers/screens/NewChemistVisitScreen";
import { StockistVisitScreen } from "../features/dcr/screens/StockistVisitScreen";
import { NewStockistVisitScreen } from "../features/customers/screens/NewStockistVisitScreen";
import { LiveTrackingScreen } from "../features/tracking/screens/LiveTrackingScreen";
import { CustomerDetailScreen } from "../features/customers/screens/CustomerDetailScreen";
import { CustomerFormScreen } from "../features/customers/screens/CustomerFormScreen";
import { ComingSoonScreen } from "../features/coming_soon/screens/ComingSoonScreen";
import { ApprovalsInboxScreen } from "../features/approvals/screens/ApprovalsInboxScreen";
import { ReportsCatalogScreen } from "../features/reports/screens/ReportsCatalogScreen";
import { ReportFiltersScreen } from "../features/reports/screens/ReportFiltersScreen";
import { ReportResultScreen } from "../features/reports/screens/ReportResultScreen";

// Role-level screen aliases to prevent any "action NAVIGATE was not handled" error
import { PlanVisitsScreen } from "../features/dcr/screens/PlanVisitsScreen";
import { TasksListScreen } from "../features/tasks/screens/TasksListScreen";
import { CustomersHomeScreen } from "../features/customers/screens/CustomersHomeScreen";
import { UsersListScreen } from "../features/users/screens/UsersListScreen";
import { MyTeamScreen } from "../features/users/screens/MyTeamScreen";
import { AdminMastersScreen } from "../features/masters/screens/AdminMastersScreen";
import { ProfileScreen } from "../features/profile/screens/ProfileScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            {/* Primary Tab Navigator */}
            <Stack.Screen name={ROUTES.AppTabs as any} component={RoleTabNavigator} />

            {/* Core Feature Modals & Push Screens */}
            <Stack.Screen name={ROUTES.TourPlanner as any} component={TourPlannerScreen} />
            <Stack.Screen name={ROUTES.ExpenseList as any} component={ExpenseListScreen} />
            <Stack.Screen name={ROUTES.ExpenseAdd as any} component={AddExpenseScreen} />
            <Stack.Screen name={ROUTES.LeaveList as any} component={LeaveListScreen} />
            <Stack.Screen name={ROUTES.LeaveApply as any} component={ApplyLeaveScreen} />
            <Stack.Screen name={ROUTES.DcrForm as any} component={DcrFormScreen} />
            <Stack.Screen name={ROUTES.Deviation as any} component={DeviationScreen} />
            <Stack.Screen name={ROUTES.DoctorVisit as any} component={DoctorVisitScreen} />
            <Stack.Screen name={ROUTES.NewDoctorVisit as any} component={NewDoctorVisitScreen} />
            <Stack.Screen name={ROUTES.ChemistVisit as any} component={ChemistVisitScreen} />
            <Stack.Screen name={ROUTES.NewChemistVisit as any} component={NewChemistVisitScreen} />
            <Stack.Screen name={ROUTES.StockistVisit as any} component={StockistVisitScreen} />
            <Stack.Screen name={ROUTES.NewStockistVisit as any} component={NewStockistVisitScreen} />
            <Stack.Screen name={ROUTES.LiveTracking as any} component={LiveTrackingScreen} />
            <Stack.Screen name={ROUTES.CustomerDetail as any} component={CustomerDetailScreen} />
            <Stack.Screen name={ROUTES.CustomerForm as any} component={CustomerFormScreen} />
            <Stack.Screen name={ROUTES.ComingSoon as any} component={ComingSoonScreen} />
            <Stack.Screen name={ROUTES.ApprovalsInbox as any} component={ApprovalsInboxScreen} />
            <Stack.Screen name={ROUTES.ReportsCatalog as any} component={ReportsCatalogScreen} />
            <Stack.Screen name={ROUTES.ReportFilters as any} component={ReportFiltersScreen} />
            <Stack.Screen name={ROUTES.ReportResult as any} component={ReportResultScreen} />

            {/* Infallible Route Aliases (Ensures all buttons in MR, Manager, Admin never fail) */}
            <Stack.Screen name={"Approvals" as any} component={ApprovalsInboxScreen} />
            <Stack.Screen name={"Visits" as any} component={PlanVisitsScreen} />
            <Stack.Screen name={"Plan" as any} component={PlanVisitsScreen} />
            <Stack.Screen name={"Tasks" as any} component={TasksListScreen} />
            <Stack.Screen name={"Customers" as any} component={CustomersHomeScreen} />
            <Stack.Screen name={"Users" as any} component={UsersListScreen} />
            <Stack.Screen name={"Team" as any} component={MyTeamScreen} />
            <Stack.Screen name={"Masters" as any} component={AdminMastersScreen} />
            <Stack.Screen name={"Reports" as any} component={ReportsCatalogScreen} />
            <Stack.Screen name={"More" as any} component={ProfileScreen} />
            <Stack.Screen name={"Profile" as any} component={ProfileScreen} />
          </>
        ) : (
          <Stack.Screen name={ROUTES.Auth as any} component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
