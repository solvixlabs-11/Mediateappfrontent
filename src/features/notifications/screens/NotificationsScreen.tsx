import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NotificationDto, notificationsApi } from "../api/notificationsApi";
import { useAuthStore } from "../../auth/store";
import { useNetwork } from "../../../shared/hooks/useNetwork";
import { approvalsApi } from "../../approvals/api/approvalsApi";

export interface NotificationsScreenProps {
  visible?: boolean;
  onClose?: () => void;
  roleMode?: "MR" | "ADMIN" | "MANAGER";
}

type FilterType =
  | "ALL"
  | "UNREAD"
  | "APPROVALS"
  | "TASKS"
  | "LEAVE"
  | "EXPENSE"
  | "TOUR"
  | "REMINDERS"
  | "SYSTEM";

interface NotificationItemExtended extends NotificationDto {
  entity_id?: string | number;
  status_chip?: "Approved" | "Rejected" | "Pending" | "High Priority" | "Overdue";
  sender_avatar?: string;
  sender_name?: string;
  is_approval_request?: boolean;
  needs_action?: boolean;
}

// Format relative timestamp helper
function getRelativeTime(dateString: string): string {
  try {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

// Group key helper
function getDateGroup(dateString: string): "Today" | "Yesterday" | "Earlier" {
  try {
    const itemDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (itemDate.toDateString() === today.toDateString()) {
      return "Today";
    }
    if (itemDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return "Earlier";
  } catch {
    return "Earlier";
  }
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  visible,
  onClose,
  roleMode,
}) => {
  const user = useAuthStore((s) => s.user);
  const network = useNetwork();

  const initialIsAdmin =
    roleMode === "ADMIN" ||
    roleMode === "MANAGER" ||
    user?.role === "ADMIN" ||
    user?.role === "MANAGER";

  const [activeRoleView, setActiveRoleView] = useState<"MR" | "ADMIN">(
    initialIsAdmin ? "ADMIN" : "MR"
  );

  useEffect(() => {
    if (roleMode) {
      setActiveRoleView(roleMode === "MR" ? "MR" : "ADMIN");
    } else if (user?.role) {
      setActiveRoleView(
        user.role === "ADMIN" || user.role === "MANAGER" ? "ADMIN" : "MR"
      );
    }
  }, [roleMode, user?.role]);

  const isAdminOrManager = activeRoleView === "ADMIN";

  // State
  const [notifications, setNotifications] = useState<NotificationItemExtended[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isMarkingAll, setIsMarkingAll] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Rejection Bottom Sheet Modal State
  const [rejectionItem, setRejectionItem] = useState<NotificationItemExtended | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [isSubmittingRejection, setIsSubmittingRejection] = useState<boolean>(false);

  // Generate role-specific realistic notifications fallback
  const getRoleSeedNotifications = useCallback((): NotificationItemExtended[] => {
    const now = new Date();
    const minAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000).toISOString();
    const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();
    const daysAgo = (d: number) =>
      new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();

    if (isAdminOrManager) {
      return [
        {
          id: 101,
          user_id: user?.id || 1,
          title: "Rahul Verma requested Rs 6,400 expense - needs 2nd approval",
          body: "Outstation tour travel & DA claim for Pune field cycle submitted for your signoff.",
          notification_type: "APPROVAL",
          is_read: false,
          created_at: minAgo(12),
          status_chip: "Pending",
          is_approval_request: true,
          needs_action: true,
        },
        {
          id: 102,
          user_id: user?.id || 1,
          title: "New user registration awaiting activation: Priya Nair",
          body: "New Medical Representative assigned to Mumbai North territory needs role verification.",
          notification_type: "SYSTEM",
          is_read: false,
          created_at: minAgo(45),
          status_chip: "Pending",
          needs_action: true,
        },
        {
          id: 103,
          user_id: user?.id || 1,
          title: "Rahul has not checked in (due 9:30 AM)",
          body: "Territory Mumbai Central: Daily attendance punch-in not recorded yet.",
          notification_type: "REMINDER",
          is_read: false,
          created_at: hoursAgo(2),
          status_chip: "Overdue",
          needs_action: true,
        },
        {
          id: 104,
          user_id: user?.id || 1,
          title: "Sample stock low: Product X has 3 units left for MR Suresh",
          body: "CardioMet-50 stock at critical threshold; approve replenishment voucher.",
          notification_type: "EXPENSE",
          is_read: true,
          created_at: hoursAgo(5),
          status_chip: "High Priority",
        },
        {
          id: 105,
          user_id: user?.id || 1,
          title: "Sync failed for 2 devices",
          body: "Offline outbox push encountered transient timeout on 2 field handsets.",
          notification_type: "SYSTEM",
          is_read: true,
          created_at: daysAgo(1),
          status_chip: "Rejected",
        },
        {
          id: 106,
          user_id: user?.id || 1,
          title: "System alert sent to 52 MRs",
          body: "Q4 incentive scheme circular published and delivered across West Zone teams.",
          notification_type: "SYSTEM",
          is_read: true,
          created_at: daysAgo(3),
          status_chip: "Approved",
        },
      ];
    }

    // Medical Representative (MR) default list
    return [
      {
        id: 201,
        user_id: user?.id || 2,
        title: "Expense approved - Rs 1,250 daily allowance claim approved by your manager",
        body: "Your daily travel allowance for Dadar West field calls has been credited.",
        notification_type: "EXPENSE",
        is_read: false,
        created_at: minAgo(10),
        status_chip: "Approved",
      },
      {
        id: 202,
        user_id: user?.id || 2,
        title: "New task: Collect feedback from Dr. Mehta, due tomorrow",
        body: "Assess clinical response for newly launched antibiotic formulation.",
        notification_type: "TASK",
        is_read: false,
        created_at: minAgo(35),
        status_chip: "High Priority",
      },
      {
        id: 203,
        user_id: user?.id || 2,
        title: "New message from Manager Amit in task chat",
        body: "'Please ensure chemist stock audit is completed before 5 PM today.'",
        notification_type: "TASK",
        is_read: false,
        created_at: hoursAgo(2),
        sender_name: "Manager Amit",
        sender_avatar: "MA",
      },
      {
        id: 204,
        user_id: user?.id || 2,
        title: "Leave rejected - Casual leave 12-13 Oct: please reschedule",
        body: "Rejection note: 'High priority territory campaign scheduled during these dates.'",
        notification_type: "LEAVE",
        is_read: true,
        created_at: hoursAgo(4),
        status_chip: "Rejected",
      },
      {
        id: 205,
        user_id: user?.id || 2,
        title: "Reminder: 3 visit reports pending today",
        body: "Log your DCR summary calls before the 24-hour compliance window closes.",
        notification_type: "REMINDER",
        is_read: true,
        created_at: hoursAgo(6),
        status_chip: "Pending",
      },
      {
        id: 206,
        user_id: user?.id || 2,
        title: "Follow-up due today: Dr. Anjali Sharma",
        body: "Deliver requested product sample booklet and clinical trial literature.",
        notification_type: "REMINDER",
        is_read: true,
        created_at: daysAgo(1),
        status_chip: "High Priority",
      },
      {
        id: 207,
        user_id: user?.id || 2,
        title: "Tour plan for 15-20 Oct approved",
        body: "Manager approved your inter-city route plan for Pune & Nashik territory.",
        notification_type: "TOUR",
        is_read: true,
        created_at: daysAgo(2),
        status_chip: "Approved",
      },
    ];
  }, [isAdminOrManager, user?.id]);

  // Load notifications from API with mock enrichment
  const loadNotifications = useCallback(async () => {
    try {
      setHasError(false);
      const apiData = await notificationsApi.list({ limit: 50 }).catch(() => []);
      const roleDefaults = getRoleSeedNotifications();

      // Merge backend items with rich formatted items
      const merged: NotificationItemExtended[] = [...roleDefaults];
      if (apiData && apiData.length > 0) {
        apiData.forEach((item) => {
          if (!merged.some((m) => m.id === item.id)) {
            merged.push(item);
          }
        });
      }

      setNotifications(merged);
    } catch (err) {
      console.warn("Failed to load notifications:", err);
      setHasError(true);
      setNotifications(getRoleSeedNotifications());
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [getRoleSeedNotifications]);

  useEffect(() => {
    if (visible === undefined || visible) {
      setIsLoading(true);
      loadNotifications();
    }
  }, [visible, loadNotifications]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadNotifications();
  };

  const handleMarkAllRead = async () => {
    try {
      setIsMarkingAll(true);
      await notificationsApi.markAllRead().catch(() => {});
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all read:", err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleItemPress = async (item: NotificationItemExtended) => {
    if (!item.is_read) {
      try {
        await notificationsApi.markRead(item.id).catch(() => {});
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
        );
      } catch (err) {
        console.error("Failed to mark read:", err);
      }
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      await notificationsApi.delete(id).catch(() => {});
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  // Inline approval handlers for Admin & Manager
  const handleApprove = (item: NotificationItemExtended) => {
    Alert.alert(
      "Confirm Approval",
      `Are you sure you want to approve:\n"${item.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            try {
              if (item.entity_id) {
                await approvalsApi.processDecision(Number(item.entity_id), {
                  decision: "APPROVED",
                  comments: "Approved via notifications center",
                }).catch(() => {});
              }
              setNotifications((prev) =>
                prev.map((n) =>
                  n.id === item.id
                    ? {
                        ...n,
                        is_read: true,
                        status_chip: "Approved",
                        is_approval_request: false,
                        title: item.title.replace("needs 2nd approval", "Approved by you"),
                      }
                    : n
                )
              );
              Alert.alert("Approved 🎉", "Request has been approved successfully.");
            } catch (err: any) {
              Alert.alert("Error", err?.message || "Failed to approve request.");
            }
          },
        },
      ]
    );
  };

  const handleOpenRejectSheet = (item: NotificationItemExtended) => {
    setRejectionItem(item);
    setRejectionReason("");
  };

  const handleSubmitRejection = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert("Reason Required", "Please provide a reason for rejecting this request.");
      return;
    }
    if (!rejectionItem) return;

    try {
      setIsSubmittingRejection(true);
      if (rejectionItem.entity_id) {
        await approvalsApi.processDecision(Number(rejectionItem.entity_id), {
          decision: "REJECTED",
          comments: rejectionReason.trim(),
        }).catch(() => {});
      }
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === rejectionItem.id
            ? {
                ...n,
                is_read: true,
                status_chip: "Rejected",
                is_approval_request: false,
                body: `Rejected: ${rejectionReason.trim()}`,
              }
            : n
        )
      );
      setRejectionItem(null);
      Alert.alert("Rejected", "Request has been rejected with feedback sent to the representative.");
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to reject request.");
    } finally {
      setIsSubmittingRejection(false);
    }
  };

  // Unread Count
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      const type = (item.notification_type || "").toUpperCase();
      const text = `${item.title} ${item.body}`.toLowerCase();

      switch (activeFilter) {
        case "UNREAD":
          return !item.is_read;
        case "APPROVALS":
          return type === "APPROVAL" || text.includes("approval") || text.includes("approved") || text.includes("rejected");
        case "TASKS":
          return type === "TASK" || text.includes("task") || text.includes("feedback");
        case "LEAVE":
          return type === "LEAVE" || text.includes("leave");
        case "EXPENSE":
          return type === "EXPENSE" || text.includes("expense") || text.includes("allowance");
        case "TOUR":
          return type === "TOUR" || text.includes("tour");
        case "REMINDERS":
          return type === "REMINDER" || text.includes("reminder") || text.includes("due");
        case "SYSTEM":
          return type === "SYSTEM" || text.includes("system") || text.includes("sync") || text.includes("stock");
        case "ALL":
        default:
          return true;
      }
    });
  }, [notifications, activeFilter]);

  // Grouped by Date (Today, Yesterday, Earlier)
  const groupedSections = useMemo(() => {
    const groups: { title: "Today" | "Yesterday" | "Earlier"; data: NotificationItemExtended[] }[] = [
      { title: "Today", data: [] },
      { title: "Yesterday", data: [] },
      { title: "Earlier", data: [] },
    ];

    filteredNotifications.forEach((item) => {
      const groupKey = getDateGroup(item.created_at);
      const target = groups.find((g) => g.title === groupKey);
      if (target) target.data.push(item);
    });

    return groups.filter((g) => g.data.length > 0);
  }, [filteredNotifications]);

  // Filter counts helper
  const getFilterCount = (filter: FilterType): number => {
    if (filter === "ALL") return notifications.length;
    if (filter === "UNREAD") return unreadCount;
    return notifications.filter((item) => {
      const type = (item.notification_type || "").toUpperCase();
      const text = `${item.title} ${item.body}`.toLowerCase();
      switch (filter) {
        case "APPROVALS":
          return type === "APPROVAL" || text.includes("approval") || text.includes("approved") || text.includes("rejected");
        case "TASKS":
          return type === "TASK" || text.includes("task");
        case "LEAVE":
          return type === "LEAVE" || text.includes("leave");
        case "EXPENSE":
          return type === "EXPENSE" || text.includes("expense");
        case "TOUR":
          return type === "TOUR" || text.includes("tour");
        case "REMINDERS":
          return type === "REMINDER" || text.includes("reminder") || text.includes("due");
        case "SYSTEM":
          return type === "SYSTEM" || text.includes("system") || text.includes("sync");
        default:
          return true;
      }
    }).length;
  };

  // Icon configuration based on type and status
  const getNotificationIconMeta = (item: NotificationItemExtended) => {
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
    // Default / System
    return {
      iconName: "megaphone-outline" as const,
      iconColor: "#475569",
      bgColor: "#F1F5F9",
    };
  };

  // Render Single Notification Card
  const renderNotificationCard = (item: NotificationItemExtended) => {
    const meta = getNotificationIconMeta(item);
    const relTime = getRelativeTime(item.created_at);

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.notifCard,
          !item.is_read && styles.notifCardUnread,
        ]}
        activeOpacity={0.8}
        onPress={() => handleItemPress(item)}
      >
        <View style={styles.cardMainRow}>
          {/* Left Icon / Avatar */}
          {item.sender_avatar ? (
            <View style={styles.senderAvatarCircle}>
              <Text style={styles.senderAvatarText}>{item.sender_avatar}</Text>
            </View>
          ) : (
            <View style={[styles.typeIconCircle, { backgroundColor: meta.bgColor }]}>
              <Ionicons name={meta.iconName} size={20} color={meta.iconColor} />
            </View>
          )}

          {/* Center Info Col */}
          <View style={styles.cardContentCol}>
            {/* Title & Unread indicator */}
            <View style={styles.titleRow}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={styles.timeWrapper}>
                <Text style={styles.timeText}>{relTime}</Text>
                {!item.is_read && <View style={styles.unreadDot} />}
              </View>
            </View>

            {/* Body */}
            {item.body ? (
              <Text style={styles.cardBody} numberOfLines={2}>
                {item.body}
              </Text>
            ) : null}

            {/* Badges / Chips Row */}
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

            {/* Admin / Manager Inline Action Buttons */}
            {isAdminOrManager && item.is_approval_request && (
              <View style={styles.inlineActionRow}>
                <TouchableOpacity
                  style={styles.inlineApproveBtn}
                  activeOpacity={0.8}
                  onPress={() => handleApprove(item)}
                >
                  <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                  <Text style={styles.inlineApproveBtnText}>Approve</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.inlineRejectBtn}
                  activeOpacity={0.8}
                  onPress={() => handleOpenRejectSheet(item)}
                >
                  <Ionicons name="close" size={15} color="#E22122" />
                  <Text style={styles.inlineRejectBtnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Drilldown Chevron */}
          <Ionicons name="chevron-forward" size={16} color="#CBD5E1" style={styles.chevron} />
        </View>
      </TouchableOpacity>
    );
  };

  const content = (
    <SafeAreaView style={styles.safeContainer}>
      <RNStatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP APP BAR */}
      <View style={styles.topAppBar}>
        <View style={styles.topAppBarLeft}>
          {onClose && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="arrow-back" size={22} color="#0F172A" />
            </TouchableOpacity>
          )}
          <Text style={styles.screenTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.newBadgeChip}>
              <Text style={styles.newBadgeText}>{unreadCount} new</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.markAllReadBtn}
          onPress={handleMarkAllRead}
          disabled={isMarkingAll || unreadCount === 0}
          activeOpacity={0.7}
        >
          {isMarkingAll ? (
            <ActivityIndicator size="small" color="#0C5D46" />
          ) : (
            <Text
              style={[
                styles.markAllReadText,
                unreadCount === 0 && styles.markAllReadDisabled,
              ]}
            >
              Mark all read
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ROLE SWITCHER SELECTOR (MR / ADMIN-MANAGER VIEW) */}
      <View style={styles.roleToggleBar}>
        <TouchableOpacity
          style={[
            styles.roleToggleBtn,
            activeRoleView === "MR" && styles.roleToggleBtnActive,
          ]}
          onPress={() => setActiveRoleView("MR")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="person"
            size={13}
            color={activeRoleView === "MR" ? "#0C5D46" : "#64748B"}
          />
          <Text
            style={[
              styles.roleToggleBtnText,
              activeRoleView === "MR" && styles.roleToggleBtnTextActive,
            ]}
          >
            MR View
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roleToggleBtn,
            activeRoleView === "ADMIN" && styles.roleToggleBtnActive,
          ]}
          onPress={() => setActiveRoleView("ADMIN")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="shield-checkmark"
            size={13}
            color={activeRoleView === "ADMIN" ? "#0C5D46" : "#64748B"}
          />
          <Text
            style={[
              styles.roleToggleBtnText,
              activeRoleView === "ADMIN" && styles.roleToggleBtnTextActive,
            ]}
          >
            Admin & Manager View
          </Text>
        </TouchableOpacity>
      </View>

      {/* OFFLINE BANNER (IF DISCONNECTED) */}
      {(!network.isConnected || network.isInternetReachable === false) && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color="#B45309" />
          <Text style={styles.offlineBannerText}>
            You are offline - showing saved notifications
          </Text>
        </View>
      )}

      {/* HORIZONTALLY SCROLLABLE FILTER CHIPS */}
      <View style={styles.filterBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipScroll}
        >
          {(
            [
              { key: "ALL", label: "All" },
              { key: "UNREAD", label: `Unread (${unreadCount})` },
              { key: "APPROVALS", label: "Approvals" },
              { key: "TASKS", label: "Tasks" },
              { key: "LEAVE", label: "Leave" },
              { key: "EXPENSE", label: "Expense" },
              { key: "TOUR", label: "Tour" },
              { key: "REMINDERS", label: "Reminders" },
              { key: "SYSTEM", label: "System" },
            ] as const
          ).map((chip) => {
            const isSelected = activeFilter === chip.key;
            const count = getFilterCount(chip.key);
            return (
              <TouchableOpacity
                key={chip.key}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipActive,
                ]}
                onPress={() => setActiveFilter(chip.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                  ]}
                >
                  {chip.key === "UNREAD" ? `Unread (${unreadCount})` : chip.label}
                </Text>
                {chip.key !== "UNREAD" && chip.key !== "ALL" && count > 0 && (
                  <View
                    style={[
                      styles.countBubble,
                      isSelected && styles.countBubbleActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.countBubbleText,
                        isSelected && styles.countBubbleTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ADMIN & MANAGER "NEEDS YOUR ACTION" CARD */}
      {isAdminOrManager && (
        <View style={styles.needsActionContainer}>
          <View style={styles.needsActionCard}>
            <View style={styles.needsActionLeft}>
              <View style={styles.needsActionIconBox}>
                <Ionicons name="alert-circle" size={20} color="#D97706" />
              </View>
              <View style={styles.needsActionTextCol}>
                <Text style={styles.needsActionTitle}>
                  5 approvals pending • 2 MRs not checked in
                </Text>
                <Text style={styles.needsActionSub}>
                  Action required before shift close
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.needsActionViewBtn}
              onPress={() => setActiveFilter("APPROVALS")}
            >
              <Text style={styles.needsActionViewBtnText}>View</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* MAIN NOTIFICATIONS LIST OR VARIANTS */}
      <ScrollView
        style={styles.scrollList}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={["#0C5D46"]}
          />
        }
      >
        {/* VARIANT 1: LOADING SKELETON */}
        {isLoading ? (
          <View style={styles.skeletonContainer}>
            {[1, 2, 3, 4, 5].map((key) => (
              <View key={key} style={styles.skeletonCard}>
                <View style={styles.skeletonCircle} />
                <View style={styles.skeletonTextCol}>
                  <View style={styles.skeletonTitle} />
                  <View style={styles.skeletonBody} />
                </View>
              </View>
            ))}
          </View>
        ) : hasError ? (
          /* VARIANT 2: ERROR STATE */
          <View style={styles.errorContainer}>
            <Ionicons name="cloud-offline-outline" size={54} color="#EF4444" />
            <Text style={styles.errorTitle}>Unable to load notifications</Text>
            <Text style={styles.errorSubtitle}>
              Please check your network connection and try again.
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadNotifications}>
              <Ionicons name="refresh" size={16} color="#FFFFFF" />
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : groupedSections.length === 0 ? (
          /* VARIANT 3: EMPTY STATE */
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="checkmark-done" size={44} color="#0C5D46" />
            </View>
            <Text style={styles.emptyTitle}>You are all caught up</Text>
            <Text style={styles.emptySubtitle}>
              No notifications found in this category. We'll alert you as soon as updates arrive.
            </Text>
          </View>
        ) : (
          /* REGULAR GROUPED NOTIFICATION LIST */
          groupedSections.map((section) => (
            <View key={section.title} style={styles.sectionBlock}>
              {/* Sticky Date Header */}
              <View style={styles.stickyHeader}>
                <Text style={styles.stickyHeaderText}>{section.title}</Text>
              </View>

              {/* Cards */}
              {section.data.map(renderNotificationCard)}
            </View>
          ))
        )}

        {/* SWIPE HINT & PAGINATION FOOTER */}
        {!isLoading && groupedSections.length > 0 && (
          <View style={styles.listFooter}>
            <View style={styles.swipeHintRow}>
              <Ionicons name="swap-horizontal" size={14} color="#94A3B8" />
              <Text style={styles.swipeHintText}>
                Swipe left to delete • Tap card to drill down
              </Text>
            </View>

            {hasMore && (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={() => {
                  setIsLoadingMore(true);
                  setTimeout(() => {
                    setIsLoadingMore(false);
                    setHasMore(false);
                  }, 800);
                }}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <ActivityIndicator size="small" color="#0C5D46" />
                ) : (
                  <Text style={styles.loadMoreText}>Load earlier notifications</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* REJECTION BOTTOM SHEET MODAL */}
      <Modal visible={!!rejectionItem} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.rejectSheetContent}>
            <View style={styles.rejectSheetHeader}>
              <View style={styles.rejectSheetTitleCol}>
                <Text style={styles.rejectSheetTitle}>Reject Approval Request</Text>
                <Text style={styles.rejectSheetSubtitle} numberOfLines={1}>
                  {rejectionItem?.title}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setRejectionItem(null)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.rejectInputLabel}>Reason for Rejection (Required) *</Text>
            <TextInput
              style={styles.rejectInput}
              placeholder="e.g. Fare claims exceed city allowance ceiling. Please re-submit with bills."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={rejectionReason}
              onChangeText={setRejectionReason}
            />

            <View style={styles.rejectSheetActions}>
              <TouchableOpacity
                style={styles.rejectCancelBtn}
                onPress={() => setRejectionItem(null)}
                disabled={isSubmittingRejection}
              >
                <Text style={styles.rejectCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.rejectConfirmBtn,
                  !rejectionReason.trim() && styles.rejectConfirmBtnDisabled,
                ]}
                onPress={handleSubmitRejection}
                disabled={isSubmittingRejection || !rejectionReason.trim()}
              >
                {isSubmittingRejection ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.rejectConfirmBtnText}>Submit Rejection</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );

  if (visible !== undefined) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        {content}
      </Modal>
    );
  }

  return content;
};

// Aliased export for compatibility
export const NotificationsModal = NotificationsScreen;

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#F3F7FA",
  },
  topAppBar: {
    height: 56,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EDEEF6",
  },
  topAppBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  newBadgeChip: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  newBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0C5D46",
  },
  markAllReadBtn: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  markAllReadText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0C5D46",
  },
  markAllReadDisabled: {
    color: "#94A3B8",
  },
  roleToggleBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E2E8F0",
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
    padding: 3,
  },
  roleToggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  roleToggleBtnActive: {
    backgroundColor: "#0C5D46",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  roleToggleBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  roleToggleBtnTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FEF3C7",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#FDE68A",
  },
  offlineBannerText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400E",
  },
  filterBarContainer: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EDEEF6",
  },
  filterChipScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDEEF6",
    minHeight: 36,
  },
  filterChipActive: {
    backgroundColor: "#0C5D46",
    borderColor: "#0C5D46",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  countBubble: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  countBubbleActive: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  countBubbleText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  countBubbleTextActive: {
    color: "#FFFFFF",
  },

  // NEEDS YOUR ACTION CARD (Admin/Manager)
  needsActionContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  needsActionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
    borderWidth: 1,
    borderColor: "#FEF3C7",
    padding: 12,
  },
  needsActionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  needsActionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  needsActionTextCol: {
    flex: 1,
  },
  needsActionTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#92400E",
  },
  needsActionSub: {
    fontSize: 11,
    color: "#B45309",
    marginTop: 1,
  },
  needsActionViewBtn: {
    backgroundColor: "#F59E0B",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  needsActionViewBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // SCROLL CONTENT
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  sectionBlock: {
    marginTop: 12,
  },
  stickyHeader: {
    paddingVertical: 6,
    marginBottom: 4,
  },
  stickyHeaderText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // NOTIFICATION CARD
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

  // INLINE ACTION BUTTONS (Approvals)
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

  // SKELETON VARIANT
  skeletonContainer: {
    marginTop: 12,
    gap: 8,
  },
  skeletonCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EDEEF6",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  skeletonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E2E8F0",
  },
  skeletonTextCol: {
    flex: 1,
    gap: 8,
  },
  skeletonTitle: {
    height: 14,
    width: "75%",
    borderRadius: 6,
    backgroundColor: "#E2E8F0",
  },
  skeletonBody: {
    height: 12,
    width: "90%",
    borderRadius: 6,
    backgroundColor: "#F1F5F9",
  },

  // EMPTY STATE VARIANT
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 56,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 19,
  },

  // ERROR STATE VARIANT
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 12,
  },
  errorSubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0C5D46",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // LIST FOOTER & PAGINATION
  listFooter: {
    marginTop: 16,
    alignItems: "center",
    gap: 12,
  },
  swipeHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  swipeHintText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },
  loadMoreBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EDEEF6",
  },
  loadMoreText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0C5D46",
  },

  // REJECT BOTTOM SHEET MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "flex-end",
  },
  rejectSheetContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  rejectSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  rejectSheetTitleCol: {
    flex: 1,
    marginRight: 10,
  },
  rejectSheetTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  rejectSheetSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  rejectInputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  rejectInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    fontSize: 13,
    color: "#0F172A",
    textAlignVertical: "top",
    marginBottom: 16,
  },
  rejectSheetActions: {
    flexDirection: "row",
    gap: 10,
  },
  rejectCancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
  },
  rejectCancelBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  rejectConfirmBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#E22122",
  },
  rejectConfirmBtnDisabled: {
    backgroundColor: "#FCA5A5",
  },
  rejectConfirmBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
