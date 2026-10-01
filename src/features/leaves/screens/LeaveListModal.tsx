import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LeaveBalanceDto, LeaveDto, leavesApi } from "../api/leavesApi";
import { ApplyLeaveModal } from "./ApplyLeaveModal";
import { colors, radii, spacing } from "../../../shared/theme/tokens";

interface LeaveListModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LeaveListModal: React.FC<LeaveListModalProps> = ({ visible, onClose }) => {
  const [leaves, setLeaves] = useState<LeaveDto[]>([]);
  const [balance, setBalance] = useState<LeaveBalanceDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      const [listData, balData] = await Promise.all([leavesApi.list(), leavesApi.getBalance()]);
      setLeaves(listData);
      setBalance(balData);
    } catch {
      Alert.alert("Error", "Could not load leave records.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible, loadData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleCancelLeave = (leave: LeaveDto) => {
    Alert.alert(
      "Cancel Leave Request",
      `Are you sure you want to cancel your ${leave.leave_type} leave from ${leave.start_date}?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              await leavesApi.cancel(leave.id);
              Alert.alert("Cancelled", "Leave request has been cancelled.");
              loadData();
            } catch (err: any) {
              const msg = err?.response?.data?.detail || "Failed to cancel leave.";
              Alert.alert("Error", msg);
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return { bg: "#D1FAE5", text: "#059669" };
      case "REJECTED":
        return { bg: "#FEE2E2", text: "#DC2626" };
      case "CANCELLED":
        return { bg: "#F1F5F9", text: "#64748B" };
      default:
        return { bg: "#FEF3C7", text: "#B45309" };
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Leaves & Absence</Text>
              <Text style={styles.subtitle}>Check balances and request leaves</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Leave Balances Grid */}
          {balance && (
            <View style={styles.balanceBar}>
              <View style={styles.balanceTile}>
                <Text style={styles.balanceValue}>{balance.casual_leave_balance}</Text>
                <Text style={styles.balanceLabel}>Casual (CL)</Text>
              </View>
              <View style={styles.balanceTile}>
                <Text style={styles.balanceValue}>{balance.sick_leave_balance}</Text>
                <Text style={styles.balanceLabel}>Sick (SL)</Text>
              </View>
              <View style={styles.balanceTile}>
                <Text style={styles.balanceValue}>{balance.earned_leave_balance}</Text>
                <Text style={styles.balanceLabel}>Earned (EL)</Text>
              </View>
              <View style={[styles.balanceTile, styles.totalTile]}>
                <Text style={[styles.balanceValue, { color: colors.primary }]}>
                  {balance.total_balance}
                </Text>
                <Text style={styles.balanceLabel}>Available</Text>
              </View>
            </View>
          )}

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading leave records...</Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.scrollList}
              refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
              showsVerticalScrollIndicator={false}
            >
              {leaves.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="calendar-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.emptyTitle}>No Leaves Applied</Text>
                  <Text style={styles.emptySubtitle}>
                    All your applied leaves, manager decisions, and deductions will show up here.
                  </Text>
                </View>
              ) : (
                leaves.map((item) => {
                  const badge = getStatusBadge(item.status);
                  const canCancel = item.status === "APPLIED" || item.status === "APPROVED";

                  return (
                    <View key={item.id} style={styles.leaveCard}>
                      <View style={styles.leaveHeader}>
                        <View style={styles.typeRow}>
                          <Text style={styles.leaveType}>{item.leave_type} LEAVE</Text>
                          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                            <Text style={[styles.badgeText, { color: badge.text }]}>
                              {item.status}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.daysText}>{item.days_count} day(s)</Text>
                      </View>

                      <View style={styles.datesRow}>
                        <Ionicons name="time-outline" size={14} color="#64748B" />
                        <Text style={styles.datesText}>
                          {item.start_date === item.end_date
                            ? item.start_date
                            : `${item.start_date} to ${item.end_date}`}
                        </Text>
                      </View>

                      <Text style={styles.reasonText}>&quot;{item.reason}&quot;</Text>

                      {item.rejection_reason ? (
                        <View style={styles.rejectionNotice}>
                          <Ionicons name="alert-circle" size={14} color="#DC2626" />
                          <Text style={styles.rejectionReasonText}>
                            Manager: {item.rejection_reason}
                          </Text>
                        </View>
                      ) : null}

                      {canCancel && (
                        <View style={styles.cancelActionRow}>
                          <TouchableOpacity
                            style={styles.cancelLeaveBtn}
                            onPress={() => handleCancelLeave(item)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="close-circle-outline" size={14} color="#DC2626" />
                            <Text style={styles.cancelLeaveBtnText}>Cancel Leave</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}

          {/* Bottom Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.applyBtn}
              activeOpacity={0.85}
              onPress={() => setIsApplyModalOpen(true)}
            >
              <Ionicons name="calendar" size={18} color="#FFFFFF" />
              <Text style={styles.applyBtnText}>+ Apply New Leave</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ApplyLeaveModal
        visible={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSuccess={loadData}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    height: "90%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  balanceBar: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  balanceTile: {
    flex: 1,
    alignItems: "center",
  },
  totalTile: {
    borderLeftWidth: 1,
    borderLeftColor: "#E2E8F0",
    paddingLeft: spacing.sm,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 2,
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
    padding: spacing.lg,
    paddingBottom: 40,
    gap: 10,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
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
    paddingHorizontal: spacing.xl,
  },
  leaveCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  leaveHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  leaveType: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  daysText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  datesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  datesText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  reasonText: {
    fontSize: 12,
    color: "#64748B",
    fontStyle: "italic",
    marginBottom: 6,
  },
  rejectionNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF2F2",
    padding: 8,
    borderRadius: radii.md,
    marginTop: 4,
    marginBottom: 6,
  },
  rejectionReasonText: {
    fontSize: 11,
    color: "#DC2626",
    fontWeight: "600",
    flexShrink: 1,
  },
  cancelActionRow: {
    alignItems: "flex-end",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  cancelLeaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cancelLeaveBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
  },
  applyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radii.lg,
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
