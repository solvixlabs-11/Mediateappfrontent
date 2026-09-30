import React, { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../theme/tokens";

export interface HeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  rightAction,
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightAction ? <View style={styles.rightAction}>{rightAction}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.heading,
    color: colors.navy,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rightAction: {
    marginLeft: spacing.md,
  },
});
