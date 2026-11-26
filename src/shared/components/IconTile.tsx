import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { colors, radii, spacing, typography } from "../../theme";

export interface IconTileProps {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  tileBgColor?: string;
  style?: ViewStyle;
}

export const IconTile: React.FC<IconTileProps> = ({
  label,
  icon,
  onPress,
  tileBgColor = colors.navy,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.tileBox, { backgroundColor: tileBgColor }]}>
        {icon}
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: spacing.lg,
    width: "25%",
    paddingHorizontal: 4,
  },
  tileBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs + 2,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  label: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "600",
    color: colors.textInk,
    textAlign: "center",
  },
});
