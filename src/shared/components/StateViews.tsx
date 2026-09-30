import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../theme/tokens";
import { Button } from "./Button";

export interface LoaderProps {
  message?: string;
}

export const Loader: React.FC<LoaderProps> = ({ message = "Loading..." }) => (
  <View style={styles.centerContainer}>
    <ActivityIndicator size="large" color={colors.primary} />
    {message ? <Text style={styles.loaderText}>{message}</Text> : null}
  </View>
);

export interface EmptyStateProps {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No Items Found",
  message,
  actionLabel,
  onAction,
}) => (
  <View style={styles.centerContainer}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
    {actionLabel && onAction ? (
      <Button
        title={actionLabel}
        onPress={onAction}
        style={styles.actionButton}
        variant="secondary"
      />
    ) : null}
  </View>
);

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Unable to load data",
  message = "Please check your network connection and try again.",
  onRetry,
}) => (
  <View style={styles.centerContainer}>
    <Text style={[styles.title, { color: colors.danger }]}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
    {onRetry ? (
      <Button
        title="Retry"
        onPress={onRetry}
        style={styles.actionButton}
        variant="primary"
      />
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  loaderText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  title: {
    ...typography.heading,
    color: colors.navy,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  actionButton: {
    minWidth: 140,
  },
});
