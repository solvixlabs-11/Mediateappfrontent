import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useAuthStore } from "../features/auth/store";
import { ComingSoonScreen } from "../features/coming_soon/screens/ComingSoonScreen";
import { ProfileScreen } from "../features/profile/screens/ProfileScreen";
import { MyTeamScreen } from "../features/users/screens/MyTeamScreen";
import { UsersListScreen } from "../features/users/screens/UsersListScreen";
import { CustomersHomeScreen } from "../features/customers/screens/CustomersHomeScreen";
import { AdminMastersScreen } from "../features/masters/screens/AdminMastersScreen";
import { ApprovalsInboxScreen } from "../features/approvals/screens/ApprovalsInboxScreen";
import { AdminHomeScreen } from "../features/dashboard/screens/AdminHomeScreen";
import { MrDashboardScreen } from "../features/dashboard/screens/MrDashboardScreen";
import { MrBuddyHomeScreen } from "../features/dashboard/screens/MrBuddyHomeScreen";
import { PlanVisitsScreen } from "../features/dcr/screens/PlanVisitsScreen";
import { TasksListScreen } from "../features/tasks/screens/TasksListScreen";
import { ReportsCatalogScreen } from "../features/reports/screens/ReportsCatalogScreen";
import { colors, radii, spacing, typography } from "../theme";

const Tab = createBottomTabNavigator();

export function RoleTabNavigator() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role || "MR";

  const screenOptions = () => ({
    headerShown: false,
    tabBar: () => null,
    tabBarStyle: {
      display: "none" as const,
      height: 0,
      opacity: 0,
    },
  });

  // MR: Home (MR Buddy Grid) | Plan | Customers | Tasks | More
  if (role === "MR") {
    return (
      <Tab.Navigator tabBar={() => null} screenOptions={screenOptions}>
        <Tab.Screen name="Home" component={MrBuddyHomeScreen} />
        <Tab.Screen name="Plan" component={PlanVisitsScreen} />
        <Tab.Screen name="Customers" component={CustomersHomeScreen} />
        <Tab.Screen name="Tasks" component={TasksListScreen} />
        <Tab.Screen name="More" component={ProfileScreen} />
      </Tab.Navigator>
    );
  }

  // MANAGER: Home (MR Buddy Grid) | Team | Approvals | Tasks | More
  if (role === "MANAGER") {
    return (
      <Tab.Navigator tabBar={() => null} screenOptions={screenOptions}>
        <Tab.Screen name="Home" component={MrBuddyHomeScreen} />
        <Tab.Screen name="Team" component={MyTeamScreen} />
        <Tab.Screen name="Approvals" component={ApprovalsInboxScreen} />
        <Tab.Screen name="Tasks" component={TasksListScreen} />
        <Tab.Screen name="More" component={ProfileScreen} />
      </Tab.Navigator>
    );
  }

  // ADMIN: Home (MR Buddy Grid) | Users | Masters | Reports | More
  return (
    <Tab.Navigator tabBar={() => null} screenOptions={screenOptions}>
      <Tab.Screen name="Home" component={MrBuddyHomeScreen} />
      <Tab.Screen name="Users" component={UsersListScreen} />
      <Tab.Screen name="Masters" component={AdminMastersScreen} />
      <Tab.Screen name="Reports" component={ReportsCatalogScreen} />
      <Tab.Screen name="More" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  homeContent: {
    flex: 1,
    paddingTop: spacing.md,
  },
  welcomeCard: {
    padding: spacing.lg,
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
  welcomeTitle: {
    ...typography.title,
    color: colors.navy,
    marginBottom: spacing.xs,
  },
  welcomeSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  kpiGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  kpiTile: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kpiTileTitle: {
    ...typography.subheading,
    color: colors.navy,
    marginTop: spacing.xs,
  },
  kpiTileDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
