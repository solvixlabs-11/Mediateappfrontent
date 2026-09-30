import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../features/auth/store";
import { ComingSoonScreen } from "../features/coming_soon/screens/ComingSoonScreen";
import { ProfileScreen } from "../features/profile/screens/ProfileScreen";
import { MyTeamScreen } from "../features/users/screens/MyTeamScreen";
import { UsersListScreen } from "../features/users/screens/UsersListScreen";
import { Card } from "../shared/components/Card";
import { Header } from "../shared/components/Header";
import { ScreenContainer } from "../shared/components/ScreenContainer";
import { StatusChip } from "../shared/components/StatusChip";
import { colors, radii, spacing, typography } from "../shared/theme/tokens";

const Tab = createBottomTabNavigator();

function HomeScreen() {
  const user = useAuthStore((s) => s.user);

  return (
    <ScreenContainer>
      <Header
        title={`Welcome, ${user?.fullName || "Representative"}`}
        subtitle={`Role: ${user?.role || "MR"} | Mediate Healthcare`}
      />
      <View style={styles.homeContent}>
        <Card style={styles.welcomeCard}>
          <View style={styles.badgeRow}>
            <StatusChip
              status={user?.role || "MR"}
              label={`Authenticated as ${user?.role || "MR"}`}
            />
          </View>
          <Text style={styles.welcomeTitle}>Mediate Enterprise Portal</Text>
          <Text style={styles.welcomeSubtitle}>
            Your daily operational dashboard. All data and navigation controls below are scoped
            to your role and verified directly from the backend server.
          </Text>

          <View style={styles.kpiGrid}>
            <View style={styles.kpiTile}>
              <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
              <Text style={styles.kpiTileTitle}>JWT Session</Text>
              <Text style={styles.kpiTileDesc}>Encrypted & Active</Text>
            </View>
            <View style={styles.kpiTile}>
              <Ionicons name="cloud-done" size={24} color={colors.navy} />
              <Text style={styles.kpiTileTitle}>Backend Connected</Text>
              <Text style={styles.kpiTileDesc}>Live SQL Database</Text>
            </View>
          </View>
        </Card>
      </View>
    </ScreenContainer>
  );
}

export function RoleTabNavigator() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role || "MR";

  const screenOptions = ({ route }: { route: { name: string } }) => ({
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.grey,
    tabBarStyle: {
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
      borderTopWidth: 1,
      height: 60,
      paddingBottom: 8,
      paddingTop: 6,
    },
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: "600" as const,
    },
    tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
      let iconName: keyof typeof Ionicons.glyphMap = "ellipse";

      if (route.name === "Home") {
        iconName = focused ? "home" : "home-outline";
      } else if (route.name === "Plan") {
        iconName = focused ? "calendar" : "calendar-outline";
      } else if (route.name === "Customers") {
        iconName = focused ? "medkit" : "medkit-outline";
      } else if (route.name === "Tasks") {
        iconName = focused ? "checkbox" : "checkbox-outline";
      } else if (route.name === "Team") {
        iconName = focused ? "people" : "people-outline";
      } else if (route.name === "Approvals") {
        iconName = focused ? "document-text" : "document-text-outline";
      } else if (route.name === "Users") {
        iconName = focused ? "people" : "people-outline";
      } else if (route.name === "Masters") {
        iconName = focused ? "business" : "business-outline";
      } else if (route.name === "Reports") {
        iconName = focused ? "bar-chart" : "bar-chart-outline";
      } else if (route.name === "Profile") {
        iconName = focused ? "person-circle" : "person-circle-outline";
      }

      return <Ionicons name={iconName} size={size || 22} color={color} />;
    },
  });

  // MR: Home | Plan | Customers | Tasks | Profile
  if (role === "MR") {
    return (
      <Tab.Navigator screenOptions={screenOptions}>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen
          name="Plan"
          children={() => <ComingSoonScreen featureName="Plan Visits" phase="Phase 4" />}
        />
        <Tab.Screen
          name="Customers"
          children={() => <ComingSoonScreen featureName="Customers & Doctors" phase="Phase 2" />}
        />
        <Tab.Screen
          name="Tasks"
          children={() => <ComingSoonScreen featureName="Tasks & Chat" phase="Phase 6" />}
        />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    );
  }

  // MANAGER: Home | Team | Approvals | Tasks | Profile
  if (role === "MANAGER") {
    return (
      <Tab.Navigator screenOptions={screenOptions}>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Team" component={MyTeamScreen} />
        <Tab.Screen
          name="Approvals"
          children={() => <ComingSoonScreen featureName="Approvals Inbox" phase="Phase 5" />}
        />
        <Tab.Screen
          name="Tasks"
          children={() => <ComingSoonScreen featureName="Team Tasks" phase="Phase 6" />}
        />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    );
  }

  // ADMIN: Home | Users | Masters | Reports | Profile
  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Users" component={UsersListScreen} />
      <Tab.Screen
        name="Masters"
        children={() => <ComingSoonScreen featureName="Masters & Territories" phase="Phase 2" />}
      />
      <Tab.Screen
        name="Reports"
        children={() => <ComingSoonScreen featureName="Reports & Export" phase="Phase 7" />}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
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
