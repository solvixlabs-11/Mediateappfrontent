import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { NotificationDto } from "../api/notificationsApi";
import { formatDateIST } from "../../../shared/utils/date";
import { colors, radii, shadows, spacing, typography } from "../../../theme";

export interface NotificationItemExtended extends NotificationDto {
  entity_id?: string | number;
  status_chip?: "Approved" | "Rejected" | "Pending" | "High Priority" | "Overdue";
  sender_avatar?: string;
  sender_name?: string;
  is_approval_request?: boolean;
  needs_action?: boolean;
}

export function getRelativeTime(dateString: string): string {
  try {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDateIST(date);
  } catch {
    return "Recently";
  }
}

export function getNotificationIconMeta(item: NotificationItemExtended) {
  const type = (item.notification_type || "").toUpperCase();
  const text = `${item.title} ${item.body}`.toLowerCase();

  if (text.includes("approved") || item.status_chip === "Approved") {
    return {
      iconName: "check-circle" as const,
      iconColor: colors.successGreen,
      bgColor: colors.successGreenPastel,
    };
  }
  if (text.includes("rejected") || item.status_chip === "Rejected") {
    return {
      iconName: "alert-circle" as const,
      iconColor: colors.accentRed,
      bgColor: colors.accentRedPastel,
    };
  }
  if (type === "TASK" || text.includes("task")) {
    return {
      iconName: "clipboard" as const,
      iconColor: colors.brandBlue,
      bgColor: colors.bluePastel,
    };
  }
  if (type === "LEAVE" || type === "TOUR" || text.includes("leave") || text.includes("tour")) {
    return {
      iconName: "calendar" as const,
      iconColor: colors.purple,
      bgColor: colors.purplePastel,
    };
  }
  if (type === "EXPENSE" || text.includes("expense") || text.includes("allowance")) {
    return {
      iconName: "file-text" as const,
      iconColor: colors.orange,
      bgColor: colors.orangePastel,
    };
  }
  return {
    iconName: "bell" as const,
    iconColor: colors.navy,
    bgColor: colors.bluePastel,
  };
}

interface NotificationCardProps {
  item: NotificationItemExtended;
  isAdminOrManager: boolean;
  onPress: (item: NotificationItemExtended) => void;
  onApprove: (item: NotificationItemExtended) => void;
  onReject: (item: NotificationItemExtended) => void;
}

export function NotificationCard({
  item,
  isAdminOrManager,
  onPress,
  onApprove,
  onReject,
}: NotificationCardProps) {
  const iconMeta = getNotificationIconMeta(item);
  const relativeTime = getRelativeTime(item.created_at);

  return (
    <TouchableOpacity
      style={[styles.notifCard, !item.is_read && styles.notifCardUnread]}
      onPress={() => onPress(item)}
      activeOpacity={0.75}
      accessibilityRole="button"
    >
      <View style={styles.cardMainRow}>
        <View style={[styles.typeIconCircle, { backgroundColor: iconMeta.bgColor }]}>
          <Feather name={iconMeta.iconName as any} size={18} color={iconMeta.iconColor} />
        </View>

        <View style={styles.cardContentCol}>
          <View style={styles.titleRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.timeWrapper}>
              {!item.is_read ? <View style={styles.unreadDot} /> : null}
              <Text style={styles.timeText}>{relativeTime}</Text>
            </View>
          </View>

          {item.body ? (
            <Text style={styles.cardBody} numberOfLines={2}>
              {item.body}
            </Text>
          ) : null}

          {item.status_chip ? (
            <View style={styles.chipsRow}>
              <View
                style={[
                  styles.statusChip,
                  item.status_chip === "Approved"
                    ? styles.statusChipApproved
                    : item.status_chip === "Rejected"
                    ? styles.statusChipRejected
                    : styles.statusChipPending,
                ]}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    item.status_chip === "Approved"
                      ? styles.statusChipTextApproved
                      : item.status_chip === "Rejected"
                      ? styles.statusChipTextRejected
                      : styles.statusChipTextPending,
                  ]}
                >
                  {item.status_chip}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Action Row for Pending Approvals */}
          {isAdminOrManager && item.is_approval_request && !item.is_read ? (
            <View style={styles.inlineActionRow}>
              <TouchableOpacity
                style={styles.inlineApproveBtn}
                onPress={() => onApprove(item)}
                activeOpacity={0.8}
              >
                <Feather name="check" size={14} color={colors.surface} />
                <Text style={styles.inlineApproveBtnText}>Approve</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.inlineRejectBtn}
                onPress={() => onReject(item)}
                activeOpacity={0.8}
              >
                <Feather name="x" size={14} color={colors.accentRed} />
                <Text style={styles.inlineRejectBtnText}>Reject</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  notifCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md + 2,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  notifCardUnread: {
    borderLeftWidth: 3.5,
    borderLeftColor: colors.brandBlue,
  },
  cardMainRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  typeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  cardContentCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  cardTitle: {
    ...typography.subheading,
    fontSize: 14,
    fontWeight: "700",
    color: colors.textInk,
    flex: 1,
    marginRight: spacing.sm,
  },
  timeWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textFaint,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: radii.full,
    backgroundColor: colors.accentRed,
    marginRight: 5,
  },
  cardBody: {
    ...typography.body,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginTop: 2,
  },
  chipsRow: {
    flexDirection: "row",
    marginTop: spacing.sm,
  },
  statusChip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  statusChipApproved: {
    backgroundColor: colors.successGreenPastel,
  },
  statusChipRejected: {
    backgroundColor: colors.accentRedPastel,
  },
  statusChipPending: {
    backgroundColor: colors.orangePastel,
  },
  statusChipText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: "700",
  },
  statusChipTextApproved: {
    color: colors.successGreen,
  },
  statusChipTextRejected: {
    color: colors.accentRed,
  },
  statusChipTextPending: {
    color: colors.orange,
  },
  inlineActionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  inlineApproveBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radii.md,
  },
  inlineApproveBtnText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: "700",
    color: colors.surface,
    marginLeft: 4,
  },
  inlineRejectBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accentRed,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.md,
  },
  inlineRejectBtnText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: "700",
    color: colors.accentRed,
    marginLeft: 4,
  },
});
