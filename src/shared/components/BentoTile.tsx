import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { colors, radii, shadows, spacing, typography } from "../../theme";

export interface BentoTileProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle;
  variant?: "blue" | "teal" | "orange" | "purple" | "surface";
  badge?: string;
  tall?: boolean;
}

export const BentoTile: React.FC<BentoTileProps> = ({
  title,
  subtitle,
  icon,
  onPress,
  style,
  variant = "surface",
  badge,
  tall = false,
}) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case "blue":
        return colors.bluePastel;
      case "teal":
        return colors.tealPastel;
      case "orange":
        return colors.orangePastel;
      case "purple":
        return colors.purplePastel;
      case "surface":
      default:
        return colors.surface;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.tile,
        { backgroundColor: getBackgroundColor() },
        tall && styles.tileTall,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
    >
      <View style={styles.topRow}>
        {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.contentCol}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tile: {
    borderRadius: radii.card,
    padding: spacing.lg,
    justifyContent: "space-between",
    ...shadows.soft,
  },
  tileTall: {
    minHeight: 160,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.brandBlue,
  },
  contentCol: {
    marginTop: spacing.md,
  },
  title: {
    ...typography.subheading,
    color: colors.textInk,
    fontWeight: "700",
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
});
