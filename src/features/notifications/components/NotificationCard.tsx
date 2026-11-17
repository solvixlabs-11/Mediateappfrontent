import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NotificationDto } from "../api/notificationsApi";
import { formatDateIST } from "../../../shared/utils/date";

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
      iconName: "checkmark-circle" as const,
      iconColor: "#0C5D46",
      bgColor: "#DCFCE7",
    };
  }
  if (text.includes("rejected") || item.status_chip === "Rejected") {
    return {
      iconName: "close-circle" as const,
      iconColor: "#E22122",
      bgColor: "#FEE2E2",
    };
  }
  if (type === "TASK" || text.includes("task")) {
    return {
      iconName: "clipboard-outline" as const,
      iconColor: "#2563EB",
      bgColor: "#EFF6FF",
    };
  }
  if (type === "LEAVE" || type === "TOUR" || text.includes("leave") || text.includes("tour")) {
    return {
      iconName: "calendar-outline" as const,
      iconColor: "#7C3AED",
      bgColor: "#F5F3FF",
    };
  }
  if (type === "EXPENSE" || text.includes("expense") || text.includes("allowance")) {
    return {
      iconName: "wallet-outline" as const,
      iconColor: "#D97706",
      bgColor: "#FEF3C7",
    };
  }
  if (type === "REMINDER" || text.includes("reminder") || text.includes("due")) {
    return {
      iconName: "alarm-outline" as const,
      iconColor: "#0284C7",
      bgColor: "#E0F2FE",
    };
  }
  return {
    iconName: "megaphone-outline" as const,
    iconColor: "#475569",
    bgColor: "#F1F5F9",
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
  const meta = getNotificationIconMeta(item);
  const relTime = getRelativeTime(item.created_at);

  return (
    <TouchableOpacity
      style={[styles.notifCard, !item.is_read && styles.notifCardUnread]}
      activeOpacity={0.8}
      onPress={() => onPress(item)}
    >
      <View style={styles.cardMainRow}>
        {item.sender_avatar ? (
          <View style={styles.senderAvatarCircle}>
            <Text style={styles.senderAvatarText}>{item.sender_avatar}</Text>
          </View>
        ) : (
          <View style={[styles.typeIconCircle, { backgroundColor: meta.bgColor }]}>
            <Ionicons name={meta.iconName} size={20} color={meta.iconColor} />
          </View>
        )}

        <View style={styles.cardContentCol}>
          <View style={styles.titleRow}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.timeWrapper}>
              <Text style={styles.timeText}>{relTime}</Text>
              {!item.is_read && <View style={styles.unreadDot} />}
            </View>
          </View>

          {item.body ? (
            <Text style={styles.cardBody} numberOfLines={2}>
              {item.body}
            </Text>
          ) : null}

          <View style={styles.chipsRow}>
            {item.status_chip && (
              <View
                style={[
                  styles.statusChip,
                  item.status_chip === "Approved" && styles.statusChipApproved,
                  item.status_chip === "Rejected" && styles.statusChipRejected,
                  item.status_chip === "Pending" && styles.statusChipPending,
                  (item.status_chip === "High Priority" || item.status_chip === "Overdue") &&
                    styles.statusChipOverdue,
                ]}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    item.status_chip === "Approved" && styles.statusChipTextApproved,
                    item.status_chip === "Rejected" && styles.statusChipTextRejected,
                    item.status_chip === "Pending" && styles.statusChipTextPending,
                    (item.status_chip === "High Priority" || item.status_chip === "Overdue") &&
                      styles.statusChipTextOverdue,
                  ]}
                >
                  {item.status_chip}
                </Text>
              </View>
            )}

            {item.sender_name && (
              <View style={styles.senderChip}>
                <Ionicons name="chatbubble-ellipses-outline" size={11} color="#64748B" />
                <Text style={styles.senderChipText}>{item.sender_name}</Text>
              </View>
            )}
          </View>

          {isAdminOrManager && item.is_approval_request && (
            <View style={styles.inlineActionRow}>
              <TouchableOpacity
                style={styles.inlineApproveBtn}
                activeOpacity={0.8}
                onPress={() => onApprove(item)}
              >
                <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                <Text style={styles.inlineApproveBtnText}>Approve</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.inlineRejectBtn}
                activeOpacity={0.8}
                onPress={() => onReject(item)}
              >
                <Ionicons name="close" size={15} color="#E22122" />
                <Text style={styles.inlineRejectBtnText}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Ionicons name="chevron-forward" size={16} color="#CBD5E1" style={styles.chevron} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  notifCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EDEEF6",
    padding: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  notifCardUnread: {
    backgroundColor: "#F0FDF4",
    borderColor: "#DCFCE7",
  },
  cardMainRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  typeIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  senderAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0C5D46",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  senderAvatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cardContentCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitle: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 18,
    marginRight: 8,
  },
  timeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  timeText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#0C5D46",
  },
  cardBody: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 17,
    marginTop: 4,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusChipApproved: {
    backgroundColor: "#DCFCE7",
  },
  statusChipRejected: {
    backgroundColor: "#FEE2E2",
  },
  statusChipPending: {
    backgroundColor: "#FEF3C7",
  },
  statusChipOverdue: {
    backgroundColor: "#FEE2E2",
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: "700",
  },
  statusChipTextApproved: {
    color: "#0C5D46",
  },
  statusChipTextRejected: {
    color: "#E22122",
  },
  statusChipTextPending: {
    color: "#D97706",
  },
  statusChipTextOverdue: {
    color: "#E22122",
  },
  senderChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  senderChipText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#475569",
  },
  chevron: {
    marginLeft: 6,
    marginTop: 2,
  },
  inlineActionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  inlineApproveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0C5D46",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  inlineApproveBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  inlineRejectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E22122",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  inlineRejectBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#E22122",
  },
});

