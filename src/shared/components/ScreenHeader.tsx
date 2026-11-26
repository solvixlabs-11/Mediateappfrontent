import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, radii, spacing, typography } from "../../theme";

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  variant?: "light" | "navy";
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightElement,
  variant = "light",
}) => {
  const isNavy = variant === "navy";

  return (
    <View style={[styles.container, isNavy && styles.containerNavy]}>
      <View style={styles.leftRow}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={[styles.backButton, isNavy && styles.backButtonNavy]}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Feather
              name="chevron-left"
              size={24}
              color={isNavy ? colors.surface : colors.textInk}
            />
          </TouchableOpacity>
        )}
        <View style={styles.titleCol}>
          <Text
            style={[styles.title, isNavy && styles.titleNavy]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[styles.subtitle, isNavy && styles.subtitleNavy]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {rightElement ? (
        <View style={styles.rightSlot}>{rightElement}</View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  containerNavy: {
    backgroundColor: colors.navy,
    borderBottomWidth: 0,
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.inputBackground,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  backButtonNavy: {
    backgroundColor: colors.translucentWhite,
  },
  titleCol: {
    flex: 1,
  },
  title: {
    ...typography.heading,
    color: colors.textInk,
  },
  titleNavy: {
    color: colors.surface,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  subtitleNavy: {
    color: colors.textFaint,
  },
  rightSlot: {
    marginLeft: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
