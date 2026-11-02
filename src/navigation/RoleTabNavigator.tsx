import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
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
import { AttendanceCard } from "../features/attendance/components/AttendanceCard";
import { Card } from "../shared/components/Card";
import { Header } from "../shared/components/Header";
import { ScreenContainer } from "../shared/components/ScreenContainer";
import { StatusChip } from "../shared/components/StatusChip";
import { colors, radii, spacing, typography } from "../shared/theme/tokens";

const Tab = createBottomTabNavigator();

export function RoleTabNavigator() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role || "MR";

  const screenOptions = ({ route }: { route: { name: string } }) => ({
    headerShown: false,
    tabBarActiveTintColor: "#DC2626",
    tabBarInactiveTintColor: colors.textSecondary,
    tabBarStyle: {
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
      borderTopWidth: 1,
      height: 62,
      paddingBottom: 8,
      paddingTop: 6,
    },
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: "700" as const,
    },
    tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
      let iconName: keyof typeof Ionicons.glyphMap = "ellipse";

      if (route.name === "Home") {
        iconName = focused ? "grid" : "grid-outline";
      } else if (route.name === "Plan") {
        iconName = focused ? "calendar" : "calendar-outline";
      } else if (route.name === "Customers") {
        iconName = focused ? "people" : "people-outline";
      } else if (route.name === "Team") {
        iconName = focused ? "people" : "people-outline";
      } else if (route.name === "Approvals") {
        iconName = focused ? "checkmark-done-circle" : "checkmark-done-circle-outline";
      } else if (route.name === "Users") {
        iconName = focused ? "people-circle" : "people-circle-outline";
      } else if (route.name === "Masters") {
        iconName = focused ? "business" : "business-outline";
      } else if (route.name === "Tasks") {
        iconName = focused ? "checkbox" : "checkbox-outline";
      } else if (route.name === "Reports") {
        iconName = focused ? "bar-chart" : "bar-chart-outline";
      } else if (route.name === "More") {
        iconName = focused ? "person" : "person-outline";
      }

      return <Ionicons name={iconName} size={size || 22} color={color} />;
    },
  });

  // MR: Home (MR Buddy Grid) | Plan | Customers | Tasks | More
  if (role === "MR") {
    return (
      <Tab.Navigator screenOptions={screenOptions}>
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
      <Tab.Navigator screenOptions={screenOptions}>
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
    <Tab.Navigator screenOptions={screenOptions}>
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
