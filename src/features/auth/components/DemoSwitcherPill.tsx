import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { DemoAccount } from "../api/authApi";
import { colors, radii, spacing } from "../../../shared/theme/tokens";

interface DemoSwitcherPillProps {
  demoAccounts: DemoAccount[];
  selectedRoleCode: string;
  onSelectDemo: (demo: DemoAccount) => void;
}

export const DemoSwitcherPill: React.FC<DemoSwitcherPillProps> = ({
  demoAccounts,
  selectedRoleCode,
  onSelectDemo,
}) => {
  const [showDevPanel, setShowDevPanel] = useState(false);

  if (demoAccounts.length === 0) {
    return null;
  }

  return (
    <View style={styles.devContainer}>
      <TouchableOpacity
        onPress={() => setShowDevPanel((v) => !v)}
        style={styles.devHeaderToggle}
        activeOpacity={0.7}
      >
        <Text style={styles.devHeaderToggleText}>
          {showDevPanel ? "✕ Close Quick Switcher" : "⚡ Switch Demo Profile"}
        </Text>
      </TouchableOpacity>

      {showDevPanel ? (
        <View style={styles.devCard}>
          <Text style={styles.devHelpNote}>
            Select role to auto-fill credentials for testing:
          </Text>
          <View style={styles.demoPillsRow}>
            {demoAccounts.map((acc) => {
              const isSelected = selectedRoleCode === acc.role;
              return (
                <TouchableOpacity
                  key={acc.role}
                  onPress={() => onSelectDemo(acc)}
                  style={[
                    styles.demoRolePill,
                    isSelected && styles.demoRolePillActive,
                  ]}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.demoRolePillText,
                      isSelected && styles.demoRolePillTextActive,
                    ]}
                  >
                    {acc.role}
                  </Text>
                  <Text
                    style={[
                      styles.demoRolePillSub,
                      isSelected && styles.demoRolePillSubActive,
                    ]}
                  >
                    {acc.label ? acc.label.split(" ")[0] : acc.role}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  devContainer: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    alignItems: "center",
  },
  devHeaderToggle: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    backgroundColor: "rgba(14, 140, 127, 0.08)",
  },
  devHeaderToggleText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primary,
  },
  devCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: spacing.md,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  devHelpNote: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: "500",
  },
  demoPillsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  demoRolePill: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  demoRolePillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  demoRolePillText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.navy,
  },
  demoRolePillTextActive: {
    color: "#FFFFFF",
  },
  demoRolePillSub: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 2,
  },
  demoRolePillSubActive: {
    color: "rgba(255, 255, 255, 0.8)",
  },
});

