import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoginScreen } from "../features/auth/screens/LoginScreen";
import { useAuthStore } from "../features/auth/store";
import { RoleTabNavigator } from "./RoleTabNavigator";
import { ROUTES } from "./routes";
import { RootStackParamList } from "./types";

// Features converted from Modals to registered stack screens
import { TourPlannerScreen } from "../features/tours/screens/TourPlannerScreen";
import { ExpenseListScreen } from "../features/expenses/screens/ExpenseListScreen";
import { AddExpenseScreen } from "../features/expenses/screens/AddExpenseScreen";
import { LeaveListScreen } from "../features/leaves/screens/LeaveListScreen";
import { ApplyLeaveScreen } from "../features/leaves/screens/ApplyLeaveScreen";
import { DcrFormScreen } from "../features/dcr/screens/DcrFormScreen";
import { CustomerDetailScreen } from "../features/customers/screens/CustomerDetailScreen";
import { CustomerFormScreen } from "../features/customers/screens/CustomerFormScreen";
import { ComingSoonScreen } from "../features/coming_soon/screens/ComingSoonScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name={ROUTES.AppTabs as any} component={RoleTabNavigator} />
            <Stack.Screen name={ROUTES.TourPlanner as any} component={TourPlannerScreen} />
            <Stack.Screen name={ROUTES.ExpenseList as any} component={ExpenseListScreen} />
            <Stack.Screen name={ROUTES.ExpenseAdd as any} component={AddExpenseScreen} />
            <Stack.Screen name={ROUTES.LeaveList as any} component={LeaveListScreen} />
            <Stack.Screen name={ROUTES.LeaveApply as any} component={ApplyLeaveScreen} />
            <Stack.Screen name={ROUTES.DcrForm as any} component={DcrFormScreen} />
            <Stack.Screen name={ROUTES.CustomerDetail as any} component={CustomerDetailScreen} />
            <Stack.Screen name={ROUTES.CustomerForm as any} component={CustomerFormScreen} />
            <Stack.Screen name={ROUTES.ComingSoon as any} component={ComingSoonScreen} />
          </>
        ) : (
          <Stack.Screen name={ROUTES.Auth as any} component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
