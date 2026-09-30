import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";
import { colors, radii, spacing, typography } from "../theme/tokens";

export type ButtonVariant = "primary" | "secondary" | "danger" | "text";

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = "primary",
  loading = false,
  disabled,
  style,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isDisabled}
      style={[
        styles.base,
        styles[variant],
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" || variant === "danger" ? "#FFFFFF" : colors.primary}
          size="small"
        />
      ) : (
        <Text style={[styles.textBase, styles[`${variant}Text`]]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    minWidth: 44,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  text: {
    backgroundColor: "transparent",
    paddingHorizontal: spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  textBase: {
    ...typography.subheading,
    textAlign: "center",
  },
  primaryText: {
    color: "#FFFFFF",
  },
  secondaryText: {
    color: colors.textPrimary,
  },
  dangerText: {
    color: "#FFFFFF",
  },
  textText: {
    color: colors.primary,
  },
});
