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
import { Ionicons } from "@expo/vector-icons";
import {
  ApprovalRequestDto,
  approvalsApi,
} from "../api/approvalsApi";
import { colors, radii, spacing } from "../../../shared/theme/tokens";

export const ApprovalsInboxScreen: React.FC = () => {
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
      Alert.alert("Comment Required", "BR-08 Rule: Please enter a reason/comment for rejecting this request.");
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
        return { name: "receipt-outline" as const, color: "#D97706", bg: "#FEF3C7" };
      case "LEAVE":
        return { name: "calendar-outline" as const, color: "#DC2626", bg: "#FEE2E2" };
      case "TOUR_PROGRAM":
        return { name: "map-outline" as const, color: "#2563EB", bg: "#DBEAFE" };
      default:
        return { name: "document-text-outline" as const, color: "#059669", bg: "#D1FAE5" };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Approvals Inbox</Text>
          <Text style={styles.headerSubtitle}>
            {pendingList.length} pending MR request{pendingList.length === 1 ? "" : "s"}
          </Text>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.7}>
          <Ionicons name="refresh-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "PENDING" && styles.tabButtonActive]}
          onPress={() => setActiveTab("PENDING")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabButtonText, activeTab === "PENDING" && styles.tabButtonTextActive]}>
            Pending ({pendingList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "HISTORY" && styles.tabButtonActive]}
          onPress={() => setActiveTab("HISTORY")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabButtonText, activeTab === "HISTORY" && styles.tabButtonTextActive]}>
            History ({historyList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollList}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {displayedList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-done-circle-outline" size={54} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>
                {activeTab === "PENDING" ? "Inbox All Clear" : "No Past History"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === "PENDING"
                  ? "You have reviewed all pending MR tour, expense, and leave requests."
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
                        <Ionicons name={iconMeta.name} size={16} color={iconMeta.color} />
                      </View>
                      <Text style={styles.entityTypeText}>{item.entity_type.replace("_", " ")}</Text>
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
                    <Text style={styles.cardDetails} numberOfLines={3}>
                      {item.details}
                    </Text>
                  ) : null}

                  <View style={styles.cardFooterRow}>
                    <View style={styles.requesterInfo}>
                      <Ionicons name="person-circle-outline" size={16} color="#64748B" />
                      <Text style={styles.requesterName}>
                        {item.requester_name || `MR #${item.requester_id}`}
                      </Text>
                    </View>
                    <Text style={styles.dateText}>
                      {new Date(item.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
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
                        <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
                        <Text style={styles.rejectBtnText}>Reject</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.approveBtn}
                        activeOpacity={0.8}
                        onPress={() => handleApprove(item)}
                      >
                        <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
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
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtext}>
              Rejecting &quot;{rejectingItem?.title}&quot;. Per company policy, you must provide feedback
              to the field executive.
            </Text>

            <Text style={styles.inputLabel}>Reason / Remarks (Required) *</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="e.g. Please attach missing toll receipt, or dates conflict with review meet..."
              placeholderTextColor="#94A3B8"
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
                  <ActivityIndicator size="small" color="#FFFFFF" />
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
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    borderBottomColor: colors.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  tabButtonTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#64748B",
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
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  entityTypeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  statusPending: {
    backgroundColor: "#FEF3C7",
  },
  statusPendingText: {
    color: "#B45309",
    fontSize: 10,
    fontWeight: "700",
  },
  statusApproved: {
    backgroundColor: "#D1FAE5",
  },
  statusApprovedText: {
    color: "#059669",
    fontSize: 10,
    fontWeight: "700",
  },
  statusRejected: {
    backgroundColor: "#FEE2E2",
  },
  statusRejectedText: {
    color: "#DC2626",
    fontSize: 10,
    fontWeight: "700",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  cardDetails: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 18,
    marginBottom: 10,
  },
  cardFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  requesterInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  requesterName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
  dateText: {
    fontSize: 11,
    color: "#94A3B8",
  },
  actionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
  },
  rejectBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#DC2626",
  },
  approveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  approveBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalSubtext: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: radii.md,
    padding: spacing.sm,
    fontSize: 13,
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
    minHeight: 90,
    marginBottom: spacing.lg,
  },
  modalFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.md,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  confirmRejectBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radii.md,
    backgroundColor: "#DC2626",
  },
  confirmRejectBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
