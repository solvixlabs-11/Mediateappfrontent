import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { radii, spacing } from "../../../shared/theme/tokens";
import { ROUTES } from "../../../navigation/routes";

interface MrWelcomeHeroCardProps {
  fullName?: string | null;
  todayFormatted: string;
  onRequirePunchIn: (action: () => void) => void;
  navigation?: any;
}

export function MrWelcomeHeroCard({
  fullName,
  todayFormatted,
  onRequirePunchIn,
  navigation,
}: MrWelcomeHeroCardProps) {
  return (
    <View style={styles.welcomeHeroCard}>
      <View style={styles.welcomeHeroTop}>
        <View style={styles.welcomeNameCol}>
          <Text style={styles.welcomeSubTitle}>Good morning,</Text>
          <Text style={styles.welcomeTitle} numberOfLines={1}>
            {fullName || "Field Representative"}
          </Text>
        </View>

        <View style={styles.hqBadge}>
          <Ionicons name="location" size={12} color="#0D5C46" />
          <Text style={styles.hqBadgeText}>Mumbai Central HQ</Text>
        </View>
      </View>

      <View style={styles.heroCardDivider} />

      <View style={styles.welcomeHeroBottom}>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={13} color="#64748B" />
          <Text style={styles.dateSubtext}>{todayFormatted}</Text>
        </View>

        <View style={styles.alertsContainer}>
          <TouchableOpacity
            style={styles.expenseAlertPill}
            activeOpacity={0.8}
            onPress={() => {
              onRequirePunchIn(() => {
                if (navigation) navigation.navigate(ROUTES.ExpenseList);
              });
            }}
          >
            <Ionicons name="alert-circle-outline" size={12} color="#B91C1C" />
            <Text style={styles.expenseAlertText}>Expense Claims</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.followupAlertPill}
            activeOpacity={0.8}
            onPress={() => {
              onRequirePunchIn(() => {
                if (navigation) navigation.navigate("Plan");
              });
            }}
          >
            <Ionicons name="warning-outline" size={12} color="#B45309" />
            <Text style={styles.followupAlertText}>2 Follow-ups</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  welcomeHeroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  welcomeHeroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  welcomeNameCol: {
    flex: 1,
    marginRight: 8,
  },
  welcomeSubTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 2,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  hqBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  hqBadgeText: {
    fontSize: 11,
    color: "#065F46",
    fontWeight: "700",
  },
  heroCardDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 10,
  },
  welcomeHeroBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dateSubtext: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  alertsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  expenseAlertPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  expenseAlertText: {
    fontSize: 11,
    color: "#B91C1C",
    fontWeight: "700",
  },
  followupAlertPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  followupAlertText: {
    fontSize: 11,
    color: "#B45309",
    fontWeight: "700",
  },
});

