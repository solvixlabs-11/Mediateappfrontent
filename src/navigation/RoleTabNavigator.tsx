import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuthStore } from "../features/auth/store";
import { ComingSoonScreen } from "../features/coming_soon/screens/ComingSoonScreen";
import { Button } from "../shared/components/Button";
import { Card } from "../shared/components/Card";
import { Header } from "../shared/components/Header";
import { ScreenContainer } from "../shared/components/ScreenContainer";
import { colors, spacing, typography } from "../shared/theme/tokens";

const Tab = createBottomTabNavigator();

// Generic HomeScreen demonstrating MR/Manager/Admin header & overview
function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <ScreenContainer>
      <Header
        title={`Welcome, ${user?.fullName || "User"}`}
        subtitle={`Role: ${user?.role || "MR"} | Mediate Healthcare`}
      />
      <View style={styles.homeContent}>
        <Card>
          <Text style={styles.sectionTitle}>Dashboard Preview</Text>
          <Text style={styles.bodyText}>
            You are logged in as {user?.role}. All navigation tabs below correspond to your role per design.md section 4.
          </Text>
          <Button
            title="Log Out"
            variant="secondary"
            onPress={logout}
            style={styles.logoutBtn}
          />
        </Card>
      </View>
    </ScreenContainer>
  );
}

function MoreScreen() {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  return (
    <ScreenContainer>
      <Header title="More" subtitle="Settings & Account" />
      <View style={styles.homeContent}>
        <Card>
          <Text style={styles.sectionTitle}>Profile & App Settings</Text>
          <Text style={styles.bodyText}>Logged in: {user?.email}</Text>
          <Text style={styles.bodyText}>Active Role: {user?.role}</Text>
          <Button
            title="Sign Out"
            variant="danger"
            onPress={logout}
            style={styles.logoutBtn}
          />
        </Card>
      </View>
    </ScreenContainer>
  );
}

export function RoleTabNavigator() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role || "MR";

  // MR: Home | Plan | Customers | Tasks | More
  if (role === "MR") {
    return (
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
        }}
      >
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
        <Tab.Screen name="More" component={MoreScreen} />
      </Tab.Navigator>
    );
  }

  // MANAGER: Home | Team | Approvals | Tasks | More
  if (role === "MANAGER") {
    return (
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen
          name="Team"
          children={() => <ComingSoonScreen featureName="Team Overview" phase="Phase 1" />}
        />
        <Tab.Screen
          name="Approvals"
          children={() => <ComingSoonScreen featureName="Approvals Inbox" phase="Phase 5" />}
        />
        <Tab.Screen
          name="Tasks"
          children={() => <ComingSoonScreen featureName="Team Tasks" phase="Phase 6" />}
        />
        <Tab.Screen name="More" component={MoreScreen} />
      </Tab.Navigator>
    );
  }

  // ADMIN: Home | Users | Masters | Reports | More
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Users"
        children={() => <ComingSoonScreen featureName="User Management" phase="Phase 1" />}
      />
      <Tab.Screen
        name="Masters"
        children={() => <ComingSoonScreen featureName="Masters & Territories" phase="Phase 2" />}
      />
      <Tab.Screen
        name="Reports"
        children={() => <ComingSoonScreen featureName="Reports & Export" phase="Phase 7" />}
      />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  homeContent: {
    flex: 1,
    paddingTop: spacing.md,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.navy,
    marginBottom: spacing.xs,
  },
  bodyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  logoutBtn: {
    marginTop: spacing.md,
  },
});
