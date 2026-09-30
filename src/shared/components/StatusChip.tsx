import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "../theme/tokens";

export type StatusType =
  | "Draft"
  | "Planned"
  | "Submitted"
  | "Pending"
  | "Approved"
  | "Completed"
  | "Verified"
  | "Done"
  | "Rejected"
  | "Missed"
  | "Overdue"
  | "Not verified"
  | "Cancelled"
  | "Pending sync";

export interface StatusChipProps {
  status: StatusType | string;
  label?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, label }) => {
  const displayLabel = label || status;
  let bg: string = colors.greyLight;
  let text: string = colors.textSecondary;

  switch (status) {
    case "Approved":
    case "Completed":
    case "Verified":
    case "Done":
      bg = "#E8F5E9";
      text = colors.success;
      break;
    case "Planned":
    case "Submitted":
    case "Pending":
      bg = "#FFF8E1";
      text = colors.warning;
      break;
    case "Rejected":
    case "Missed":
    case "Overdue":
    case "Not verified":
      bg = "#FFEBEE";
      text = colors.danger;
      break;
    case "Pending sync":
      bg = "#E3F2FD";
      text = colors.info;
      break;
    default:
      bg = colors.greyLight;
      text = colors.textSecondary;
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{displayLabel}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    alignSelf: "flex-start",
  },
  text: {
    ...typography.caption,
    fontWeight: "600",
  },
});
