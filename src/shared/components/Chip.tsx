import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { colors, radii, spacing, typography } from "../../theme";

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  leadingIcon?: React.ReactNode;
  style?: ViewStyle;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  leadingIcon,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected ? styles.chipSelected : styles.chipUnselected,
        style,
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
    >
      {leadingIcon ? <View style={styles.iconSlot}>{leadingIcon}</View> : null}
      <Text
        style={[
          styles.label,
          selected ? styles.labelSelected : styles.labelUnselected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    height: 44,
    minHeight: 44,
    borderRadius: radii.full,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  chipSelected: {
    backgroundColor: colors.navy,
  },
  chipUnselected: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  iconSlot: {
    marginRight: spacing.xs + 2,
  },
  label: {
    ...typography.subheading,
    fontSize: 14,
  },
  labelSelected: {
    color: colors.surface,
    fontWeight: "700",
  },
  labelUnselected: {
    color: colors.textMuted,
    fontWeight: "600",
  },
});
