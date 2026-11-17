import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NotificationDto, notificationsApi } from "../api/notificationsApi";
import { useAuthStore } from "../../auth/store";
import { useNetwork } from "../../../shared/hooks/useNetwork";
import { approvalsApi } from "../../approvals/api/approvalsApi";
import { formatDateIST } from "../../../shared/utils/date";
import {
  NotificationCard,
  NotificationItemExtended,
  getNotificationIconMeta,
  getRelativeTime,
} from "../components/NotificationCard";
import { NotificationFilterTabs, FilterType } from "../components/NotificationFilterTabs";
import { NotificationRejectionModal } from "../components/NotificationRejectionModal";

export interface NotificationsScreenProps {
  visible?: boolean;
  onClose?: () => void;
  roleMode?: "MR" | "ADMIN" | "MANAGER";
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

  // Load notifications from API
  const loadNotifications = useCallback(async () => {
    try {
      setHasError(false);
      const apiData = await notificationsApi.list({ limit: 50 });
      setNotifications(apiData || []);
      if (!apiData || apiData.length < 50) {
        setHasMore(false);
      }
    } catch (err) {
      console.warn("Failed to load notifications:", err);
      setHasError(true);
      setNotifications([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

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

  const content = (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar style="dark" />

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
      <NotificationFilterTabs
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
        unreadCount={unreadCount}
        getFilterCount={getFilterCount}
      />

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
              {section.data.map((item) => (
                <NotificationCard
                  key={item.id}
                  item={item}
                  isAdminOrManager={isAdminOrManager}
                  onPress={handleItemPress}
                  onApprove={handleApprove}
                  onReject={handleOpenRejectSheet}
                />
              ))}
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
                onPress={async () => {
                  setIsLoadingMore(true);
                  try {
                    const more = await notificationsApi.list({ skip: notifications.length, limit: 50 });
                    if (more && more.length > 0) {
                      setNotifications((prev) => [...prev, ...more]);
                      if (more.length < 50) setHasMore(false);
                    } else {
                      setHasMore(false);
                    }
                  } catch {
                    setHasMore(false);
                  } finally {
                    setIsLoadingMore(false);
                  }
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
      <NotificationRejectionModal
        visible={!!rejectionItem}
        item={rejectionItem}
        reason={rejectionReason}
        onChangeReason={setRejectionReason}
        onClose={() => setRejectionItem(null)}
        onSubmit={handleSubmitRejection}
        isSubmitting={isSubmittingRejection}
      />
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
});
