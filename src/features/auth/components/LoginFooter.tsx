import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../../../theme";

export const LoginFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <View style={styles.footerContainer}>
      <Text style={styles.copyrightText}>
        © {currentYear} Mediate Healthcare Pvt. Ltd.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  copyrightText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textFaint,
    textAlign: "center",
  },
});
