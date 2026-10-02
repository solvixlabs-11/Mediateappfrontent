import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LeaveBalanceDto, LeaveDto, leavesApi } from "../api/leavesApi";
import { RootStackParamList } from "../../../navigation/types";
import { ROUTES } from "../../../navigation/routes";
import { colors, radii, spacing } from "../../../shared/theme/tokens";

export function LeaveListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [leaves, setLeaves] = useState<LeaveDto[]>([]);
  const [balance, setBalance] = useState<LeaveBalanceDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

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
    loadData();
  }, [loadData]);

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
    <SafeAreaView style={styles.screenContainer} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Leaves & Absence</Text>
          <Text style={styles.subtitle}>Check balances and request leaves</Text>
        </View>
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
          onPress={() => navigation.navigate(ROUTES.LeaveApply)}
        >
          <Ionicons name="calendar" size={18} color="#FFFFFF" />
          <Text style={styles.applyBtnText}>+ Apply New Leave</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    gap: 12,
  },
  backButton: {
    padding: 4,
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
    backgroundColor: "#FFFFFF",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    gap: 8,
  },
  balanceTile: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    paddingVertical: 8,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  totalTile: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: "700",
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
    paddingVertical: 60,
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
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  daysText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0D5C46",
  },
  datesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  datesText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
  },
  reasonText: {
    fontSize: 12,
    color: "#64748B",
    fontStyle: "italic",
    lineHeight: 16,
  },
  rejectionNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF2F2",
    padding: 8,
    borderRadius: radii.md,
    marginTop: 8,
  },
  rejectionReasonText: {
    fontSize: 11,
    color: "#DC2626",
    fontWeight: "600",
    flexShrink: 1,
  },
  cancelActionRow: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  cancelLeaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  cancelLeaveBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#DC2626",
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
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
