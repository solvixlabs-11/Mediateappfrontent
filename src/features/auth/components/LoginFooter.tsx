import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "../../../shared/theme/tokens";

export const LoginFooter: React.FC = () => {
  return (
    <View style={styles.footerContainer}>
      <View style={styles.securityBadge}>
        <Text style={styles.lockIcon}>🛡️</Text>
        <Text style={styles.securityText}>256-Bit SSL Encrypted Enterprise Gateway</Text>
      </View>
      <Text style={styles.copyrightText}>
        © 2026 Mediate Healthcare Pvt. Ltd. • All Rights Reserved
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    alignItems: "center",
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.full,
    marginBottom: spacing.xs,
  },
  lockIcon: {
    fontSize: 11,
    marginRight: 6,
  },
  securityText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  copyrightText: {
    fontSize: 10,
    color: "#94A3B8",
    textAlign: "center",
  },
});

