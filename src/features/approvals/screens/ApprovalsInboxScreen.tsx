import React, { useCallback, useEffect, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import {
  ApprovalRequestDto,
  approvalsApi,
} from "../api/approvalsApi";
import { colors, radii, shadows, spacing, typography } from "../../../theme";
import { formatDateIST } from "../../../shared/utils/date";
import { ScreenHeader } from "../../../shared/components/ScreenHeader";

export const ApprovalsInboxScreen: React.FC<any> = ({ navigation }) => {
  const [requests, setRequests] = useState<ApprovalRequestDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"PENDING" | "HISTORY">("PENDING");

  // Rejection modal state
  const [rejectingItem, setRejectingItem] = useState<ApprovalRequestDto | null>(null);
  const [rejectionComment, setRejectionComment] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const loadInbox = useCallback(async () => {
    try {
      const data = await approvalsApi.getInbox();
      setRequests(data);
    } catch {
      Alert.alert("Error", "Could not load approvals inbox.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadInbox();
  };

  const handleApprove = (req: ApprovalRequestDto) => {
    Alert.alert(
      "Confirm Approval",
      `Are you sure you want to approve "${req.title}" for ${req.requester_name || "MR"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          style: "default",
          onPress: async () => {
            setIsProcessing(true);
            try {
              await approvalsApi.processDecision(req.id, {
                decision: "APPROVED",
                comments: "Approved by reporting manager",
              });
              Alert.alert("Success", "Request approved successfully.");
              loadInbox();
            } catch (err: any) {
              const msg = err?.response?.data?.detail || "Failed to approve request.";
              Alert.alert("Approval Failed", msg);
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const submitRejection = async () => {
    if (!rejectingItem) return;
    if (!rejectionComment.trim()) {
      Alert.alert("Comment Required", "Please enter a reason/comment for rejecting this request.");
      return;
    }

    setIsProcessing(true);
    try {
      await approvalsApi.processDecision(rejectingItem.id, {
        decision: "REJECTED",
        comments: rejectionComment.trim(),
      });
      Alert.alert("Rejected", "Request rejected with your comments.");
      setRejectingItem(null);
      setRejectionComment("");
      loadInbox();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to reject request.";
      Alert.alert("Rejection Failed", msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingList = requests.filter((r) => r.status === "PENDING");
  const historyList = requests.filter((r) => r.status !== "PENDING");
  const displayedList = activeTab === "PENDING" ? pendingList : historyList;

  const getEntityIcon = (type: string) => {
    switch (type) {
      case "EXPENSE":
        return { name: "credit-card" as const, color: colors.orange, bg: colors.orangePastel };
      case "LEAVE":
        return { name: "calendar" as const, color: colors.accentRed, bg: "#FEE2E2" };
      case "TOUR_PROGRAM":
        return { name: "map-pin" as const, color: colors.brandBlue, bg: colors.bluePastel };
      default:
        return { name: "file-text" as const, color: colors.teal, bg: colors.tealPastel };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Top Header with ScreenHeader */}
      <ScreenHeader
        title="Approvals"
        subtitle={`${pendingList.length} pending request${pendingList.length === 1 ? "" : "s"}`}
        variant="navy"
        onBack={navigation?.canGoBack && navigation.canGoBack() ? () => navigation.goBack() : undefined}
        rightElement={
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.7} accessibilityLabel="Refresh list">
            <Feather name="refresh-cw" size={18} color={colors.surface} />
          </TouchableOpacity>
        }
      />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "PENDING" && styles.tabButtonActive]}
            onPress={() => setActiveTab("PENDING")}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabButtonText, activeTab === "PENDING" && styles.tabButtonTextActive]}>
              Pending
            </Text>
            <View style={[styles.tabBadge, activeTab === "PENDING" && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === "PENDING" && styles.tabBadgeTextActive]}>
                {pendingList.length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === "HISTORY" && styles.tabButtonActive]}
            onPress={() => setActiveTab("HISTORY")}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabButtonText, activeTab === "HISTORY" && styles.tabButtonTextActive]}>
              History
            </Text>
            <View style={[styles.tabBadge, activeTab === "HISTORY" && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === "HISTORY" && styles.tabBadgeTextActive]}>
                {historyList.length}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.navy} />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollList}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.navy} />}
          showsVerticalScrollIndicator={false}
        >
          {displayedList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Feather name="check" size={32} color={colors.teal} />
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === "PENDING" ? "Inbox All Clear" : "No Past History"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === "PENDING"
                  ? "You have reviewed all pending tour, expense, and leave requests."
                  : "Processed approvals will appear here."}
              </Text>
            </View>
          ) : (
            displayedList.map((item) => {
              const iconMeta = getEntityIcon(item.entity_type);
              const isPending = item.status === "PENDING";

              return (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.typeBadgeRow}>
                      <View style={[styles.iconCircle, { backgroundColor: iconMeta.bg }]}>
                        <Feather name={iconMeta.name} size={15} color={iconMeta.color} />
                      </View>
                      <Text style={styles.entityTypeText}>{item.entity_type.replace(/_/g, " ")}</Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        item.status === "APPROVED"
                          ? styles.statusApproved
                          : item.status === "REJECTED"
                          ? styles.statusRejected
                          : styles.statusPending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          item.status === "APPROVED"
                            ? styles.statusApprovedText
                            : item.status === "REJECTED"
                            ? styles.statusRejectedText
                            : styles.statusPendingText,
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardTitle}>{item.title}</Text>

                  {item.details ? (
                    <View style={styles.cardDetailsBox}>
                      <Text style={styles.cardDetails} numberOfLines={3}>
                        {item.details}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.cardFooterRow}>
                    <View style={styles.requesterInfo}>
                      <Feather name="user" size={14} color={colors.textMuted} />
                      <Text style={styles.requesterName}>
                        {item.requester_name || `MR #${item.requester_id}`}
                      </Text>
                    </View>
                    <Text style={styles.dateText}>
                      {formatDateIST(item.created_at)}
                    </Text>
                  </View>

                  {/* Actions for Pending Requests */}
                  {isPending && (
                    <View style={styles.actionButtonsRow}>
                      <TouchableOpacity
                        style={styles.rejectBtn}
                        activeOpacity={0.8}
                        onPress={() => {
                          setRejectingItem(item);
                          setRejectionComment("");
                        }}
                      >
                        <Feather name="x-circle" size={15} color={colors.accentRed} />
                        <Text style={styles.rejectBtnText}>Reject</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.approveBtn}
                        activeOpacity={0.8}
                        onPress={() => handleApprove(item)}
                      >
                        <Feather name="check-circle" size={15} color={colors.surface} />
                        <Text style={styles.approveBtnText}>Approve</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Rejection Modal with Mandatory Comments */}
      <Modal visible={!!rejectingItem} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Request</Text>
              <TouchableOpacity
                onPress={() => setRejectingItem(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtext}>
              Rejecting &quot;{rejectingItem?.title}&quot;. Please provide feedback for the executive.
            </Text>

            <Text style={styles.inputLabel}>REASON / REMARKS (REQUIRED)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="e.g. Please attach missing receipts or clarify date..."
              placeholderTextColor={colors.textFaint}
              value={rejectionComment}
              onChangeText={setRejectionComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setRejectingItem(null)}
                disabled={isProcessing}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmRejectBtn}
                onPress={submitRejection}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Text style={styles.confirmRejectBtnText}>Confirm Rejection</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  tabsContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    padding: 4,
    gap: 6,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 9,
    borderRadius: radii.lg,
  },
  tabButtonActive: {
    backgroundColor: colors.bluePastel,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },
  tabButtonTextActive: {
    color: colors.brandBlue,
    fontWeight: "700",
  },
  tabBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.full,
    backgroundColor: colors.border,
  },
  tabBadgeActive: {
    backgroundColor: colors.brandBlue,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
  },
  tabBadgeTextActive: {
    color: colors.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  scrollList: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: spacing.xl,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.tealPastel,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textInk,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 16,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  typeBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  entityTypeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textInk,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statusPending: {
    backgroundColor: colors.orangePastel,
  },
  statusPendingText: {
    color: colors.orange,
  },
  statusApproved: {
    backgroundColor: "#DDF3EF",
  },
  statusApprovedText: {
    color: colors.teal,
  },
  statusRejected: {
    backgroundColor: "#FEE2E2",
  },
  statusRejectedText: {
    color: colors.accentRed,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textInk,
    marginBottom: 4,
  },
  cardDetailsBox: {
    backgroundColor: colors.inputBackground,
    borderRadius: radii.md,
    padding: 10,
    marginTop: 6,
    marginBottom: 8,
  },
  cardDetails: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
  cardFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  requesterInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  requesterName: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textInk,
  },
  dateText: {
    fontSize: 12,
    color: colors.textFaint,
  },
  actionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.accentRed,
  },
  approveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: radii.lg,
    backgroundColor: colors.navy,
  },
  approveBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.surface,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 21, 56, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalContent: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radii.xxl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textInk,
  },
  modalSubtext: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    fontSize: 14,
    color: colors.textInk,
    backgroundColor: colors.inputBackground,
    minHeight: 100,
    marginBottom: spacing.lg,
  },
  modalFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: radii.lg,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
  confirmRejectBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radii.lg,
    backgroundColor: colors.accentRed,
  },
  confirmRejectBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface,
  },
});
