import React, { ReactNode } from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { colors, radii, spacing } from "../theme/tokens";

export interface CardProps extends ViewProps {
  children: ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, style, ...rest }) => {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: spacing.md,
  },
});
