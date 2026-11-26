import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, radii, spacing, typography } from "../../theme";

export type StepStatus = "done" | "syncing" | "waiting";

export interface StepRowProps {
  title: string;
  status: StepStatus;
}

export const StepRow: React.FC<StepRowProps> = ({ title, status }) => {
  const renderIndicator = () => {
    switch (status) {
      case "done":
        return (
          <View style={styles.iconCircleDone}>
            <Feather name="check" size={16} color={colors.surface} />
          </View>
        );
      case "syncing":
        return (
          <View style={styles.iconCircleSyncing}>
            <ActivityIndicator size="small" color={colors.brandBlue} />
          </View>
        );
      case "waiting":
      default:
        return (
          <View style={styles.iconCircleWaiting} />
        );
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "done":
        return "Done";
      case "syncing":
        return "Syncing...";
      case "waiting":
      default:
        return "Waiting";
    }
  };

  const getStatusTextStyle = () => {
    switch (status) {
      case "done":
        return styles.statusDone;
      case "syncing":
        return styles.statusSyncing;
      case "waiting":
      default:
        return styles.statusWaiting;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        {renderIndicator()}
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={[styles.statusText, getStatusTextStyle()]}>
        {getStatusText()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconCircleDone: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: colors.successGreen,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  iconCircleSyncing: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.brandBlue,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  iconCircleWaiting: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.border,
    marginRight: spacing.md,
  },
  title: {
    ...typography.subheading,
    color: colors.textInk,
    fontWeight: "600",
  },
  statusText: {
    ...typography.caption,
    fontWeight: "600",
  },
  statusDone: {
    color: colors.successGreen,
  },
  statusSyncing: {
    color: colors.brandBlue,
  },
  statusWaiting: {
    color: colors.textFaint,
  },
});
