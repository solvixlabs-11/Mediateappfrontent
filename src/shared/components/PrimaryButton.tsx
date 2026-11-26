import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { colors, radii, spacing, typography } from "../../theme";

export interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: "navy" | "red" | "secondary" | "outline";
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  isLoading = false,
  disabled = false,
  variant = "navy",
  style,
  icon,
}) => {
  const getContainerStyle = () => {
    switch (variant) {
      case "red":
        return styles.btnRed;
      case "secondary":
        return styles.btnSecondary;
      case "outline":
        return styles.btnOutline;
      case "navy":
      default:
        return styles.btnNavy;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case "secondary":
        return styles.textSecondary;
      case "outline":
        return styles.textOutline;
      case "red":
      case "navy":
      default:
        return styles.textWhite;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.buttonBase,
        getContainerStyle(),
        (disabled || isLoading) && styles.btnDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      accessibilityRole="button"
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === "outline" ? colors.navy : colors.surface}
          size="small"
        />
      ) : (
        <>
          {icon ? <>{icon}</> : null}
          <Text style={[getTextStyle(), icon ? { marginLeft: spacing.sm } : null]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    height: 52,
    minHeight: 44,
    borderRadius: radii.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  btnNavy: {
    backgroundColor: colors.navy,
  },
  btnRed: {
    backgroundColor: colors.accentRed,
  },
  btnSecondary: {
    backgroundColor: colors.bluePastel,
  },
  btnOutline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  textWhite: {
    ...typography.button,
    color: colors.surface,
  },
  textSecondary: {
    ...typography.button,
    color: colors.brandBlue,
  },
  textOutline: {
    ...typography.button,
    color: colors.textInk,
  },
});
