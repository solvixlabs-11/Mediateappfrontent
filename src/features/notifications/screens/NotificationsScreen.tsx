import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import { Feather, Ionicons } from "@expo/vector-icons";
import { NotificationDto, notificationsApi } from "../api/notificationsApi";
import { useAuthStore } from "../../auth/store";
import { useNetwork } from "../../../shared/hooks/useNetwork";
import { approvalsApi } from "../../approvals/api/approvalsApi";
import {
  NotificationCard,
  NotificationItemExtended,
} from "../components/NotificationCard";
import { NotificationRejectionModal } from "../components/NotificationRejectionModal";
import { colors, radii, shadows, spacing, typography } from "../../../theme";
import { Chip } from "../../../shared/components/Chip";

export interface NotificationsScreenProps {
  visible?: boolean;
  onClose?: () => void;
  roleMode?: "MR" | "ADMIN" | "MANAGER";
}

type MainTabType = "Approval" | "Reimbursement" | "SMS";
type StatusChipType = "Received" | "Applied" | "Resolved";

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  visible,
  onClose,
  roleMode,
}) => {
  const user = useAuthStore((s) => s.user);
  const network = useNetwork();

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<MainTabType>("Approval");
  const [activeStatusChip, setActiveStatusChip] = useState<StatusChipType>("Received");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItemExtended[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  // Rejection Bottom Sheet Modal State
  const [rejectionItem, setRejectionItem] = useState<NotificationItemExtended | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [isSubmittingRejection, setIsSubmittingRejection] = useState<boolean>(false);

  const loadNotifications = useCallback(async () => {
    try {
      setHasError(false);
      const apiData = await notificationsApi.list({ limit: 50 });
      setNotifications(apiData || []);
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

  // Filtered Notifications based on Tab, Status, and Search Query
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      const type = (item.notification_type || "").toUpperCase();
      const text = `${item.title} ${item.body}`.toLowerCase();

      // Tab filtering
      if (activeTab === "Approval") {
        if (!type.includes("APPROVAL") && !text.includes("approval") && !text.includes("request") && !text.includes("leave")) {
          // Allow general notifications if not strictly SMS/Expense
          if (type.includes("SMS") || type.includes("EXPENSE")) return false;
        }
      } else if (activeTab === "Reimbursement") {
        if (!type.includes("EXPENSE") && !text.includes("expense") && !text.includes("reimbursement")) {
          return false;
        }
      } else if (activeTab === "SMS") {
        if (!type.includes("SMS") && !text.includes("sms") && !text.includes("message")) {
          return false;
        }
      }

      // Status chip filtering
      if (activeStatusChip === "Resolved") {
        if (!item.is_read && item.status_chip !== "Approved" && item.status_chip !== "Rejected") {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        if (!text.includes(query)) return false;
      }

      return true;
    });
  }, [notifications, activeTab, activeStatusChip, searchQuery]);

  const mainTabs: MainTabType[] = ["Approval", "Reimbursement", "SMS"];
  const statusChips: StatusChipType[] = ["Received", "Applied", "Resolved"];

  const content = (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Navy Rounded Header */}
      <View style={styles.navyHeader}>
        <SafeAreaView edges={["top"]} style={styles.headerSafe}>
          <View style={styles.headerTopRow}>
            {onClose ? (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onClose}
                activeOpacity={0.7}
                accessibilityLabel="Go back"
              >
                <Feather name="chevron-left" size={24} color={colors.surface} />
              </TouchableOpacity>
            ) : (
              <View style={styles.backPlaceholder} />
            )}

            <Text style={styles.headerTitle}>Notifications</Text>
            <View style={styles.backPlaceholder} />
          </View>

          {/* Top Tabs: Approval / Reimbursement / SMS */}
          <View style={styles.tabsRow}>
            {mainTabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={styles.tabItem}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                    {tab}
                  </Text>
                  {isActive ? <View style={styles.tabUnderline} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      </View>

      {/* Body Content */}
      <View style={styles.body}>
        {/* Status Filter Chips Row */}
        <View style={styles.chipsRow}>
          {statusChips.map((chip) => {
            const isSelected = activeStatusChip === chip;
            return (
              <TouchableOpacity
                key={chip}
                style={[styles.statusChip, isSelected && styles.statusChipSelected]}
                onPress={() => setActiveStatusChip(chip)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    isSelected && styles.statusChipTextSelected,
                  ]}
                >
                  {chip}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Search Field */}
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color={colors.textFaint} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor={colors.textFaint}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")} activeOpacity={0.7}>
              <Feather name="x" size={16} color={colors.textFaint} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Scrollable Notifications List or Empty State */}
        <ScrollView
          style={styles.listScrollView}
          contentContainerStyle={styles.listScrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.navy]}
              tintColor={colors.navy}
            />
          }
        >
          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.navy} />
            </View>
          ) : hasError ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Feather name="alert-circle" size={32} color={colors.accentRed} />
              </View>
              <Text style={styles.emptyTitle}>Unable to load</Text>
              <Text style={styles.emptySubtitle}>
                Please check your network connection and try again.
              </Text>
            </View>
          ) : filteredNotifications.length === 0 ? (
            /* Empty State Matching Screenshot 8 exactly */
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Feather name="bell" size={34} color={colors.navy} />
              </View>
              <Text style={styles.emptyTitle}>You are all caught up</Text>
              <Text style={styles.emptySubtitle}>
                No approvals waiting for you right now.
              </Text>
            </View>
          ) : (
            filteredNotifications.map((item) => (
              <NotificationCard
                key={item.id}
                item={item}
                isAdminOrManager={false}
                onPress={handleItemPress}
                onApprove={handleApprove}
                onReject={handleOpenRejectSheet}
              />
            ))
          )}
        </ScrollView>
      </View>

      {/* Rejection Sheet */}
      <NotificationRejectionModal
        visible={!!rejectionItem}
        item={rejectionItem}
        onClose={() => setRejectionItem(null)}
        reason={rejectionReason}
        onChangeReason={setRejectionReason}
        onSubmit={handleSubmitRejection}
        isSubmitting={isSubmittingRejection}
      />
    </View>
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

export const NotificationsModal = NotificationsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  navyHeader: {
    backgroundColor: colors.navy,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  headerSafe: {
    paddingTop: spacing.xs,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 52,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.translucentWhite,
    alignItems: "center",
    justifyContent: "center",
  },
  backPlaceholder: {
    width: 44,
  },
  headerTitle: {
    ...typography.heading,
    fontSize: 22,
    fontWeight: "800",
    color: colors.surface,
  },
  tabsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  tabItem: {
    paddingVertical: spacing.sm,
    position: "relative",
    alignItems: "center",
  },
  tabLabel: {
    ...typography.subheading,
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
  },
  tabLabelActive: {
    color: colors.surface,
    fontWeight: "800",
  },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.surface,
    borderRadius: radii.full,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  chipsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statusChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  statusChipSelected: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  statusChipText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },
  statusChipTextSelected: {
    color: colors.surface,
    fontWeight: "700",
  },
  searchBox: {
    height: 48,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.soft,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    ...typography.bodyMedium,
    color: colors.textInk,
  },
  listScrollView: {
    flex: 1,
  },
  listScrollContent: {
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },
  loadingBox: {
    paddingVertical: spacing.xxxl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl * 1.5,
    paddingHorizontal: spacing.xl,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.bluePastel,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    ...typography.heading,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    color: colors.textInk,
    textAlign: "center",
    marginBottom: 6,
  },
  emptySubtitle: {
    ...typography.body,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
  },
});
