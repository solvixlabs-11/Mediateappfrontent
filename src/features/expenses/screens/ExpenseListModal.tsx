import React, { useEffect, useState, useCallback } from "react";
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
import { ExpenseDto, ExpenseSummaryDto, expensesApi } from "../api/expensesApi";
import { AddExpenseModal } from "./AddExpenseModal";
import { colors, radii, spacing } from "../../../shared/theme/tokens";

interface ExpenseListModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ExpenseListModal: React.FC<ExpenseListModalProps> = ({ visible, onClose }) => {
  const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
  const [summary, setSummary] = useState<ExpenseSummaryDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      const [listData, sumData] = await Promise.all([
        expensesApi.list(),
        expensesApi.getSummary(),
      ]);
      setExpenses(listData);
      setSummary(sumData);
    } catch {
      Alert.alert("Error", "Could not load expense records.");
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

  const getBadgeStyle = (status: string) => {
    if (status === "APPROVED") {
      return { bg: "#D1FAE5", text: "#059669" };
    }
    if (status === "REJECTED") {
      return { bg: "#FEE2E2", text: "#DC2626" };
    }
    return { bg: "#FEF3C7", text: "#B45309" };
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Expense Claims</Text>
              <Text style={styles.subtitle}>Track DA, TA, and reimbursements</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Monthly Summary Cards */}
          {summary && (
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total Claimed</Text>
                <Text style={styles.summaryValue}>₹{summary.total_claimed.toFixed(0)}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={[styles.summaryLabel, { color: "#059669" }]}>Approved</Text>
                <Text style={[styles.summaryValue, { color: "#059669" }]}>
                  ₹{summary.total_approved.toFixed(0)}
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={[styles.summaryLabel, { color: "#B45309" }]}>Pending</Text>
                <Text style={[styles.summaryValue, { color: "#B45309" }]}>
                  ₹{summary.total_pending.toFixed(0)}
                </Text>
              </View>
            </View>
          )}

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading claims...</Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.scrollList}
              refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
              showsVerticalScrollIndicator={false}
            >
              {expenses.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="receipt-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.emptyTitle}>No Expenses Logged</Text>
                  <Text style={styles.emptySubtitle}>
                    Tap &quot;+ New Claim&quot; below to record today&apos;s daily allowance or travel expenses.
                  </Text>
                </View>
              ) : (
                expenses.map((item) => {
                  const badge = getBadgeStyle(item.status);
                  return (
                    <View key={item.id} style={styles.expenseCard}>
                      <View style={styles.expenseHeader}>
                        <View style={styles.typeRow}>
                          <Text style={styles.expenseType}>
                            {item.expense_type.replace("_", " ")}
                          </Text>
                          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                            <Text style={[styles.badgeText, { color: badge.text }]}>
                              {item.status}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.amountText}>₹{item.amount.toFixed(2)}</Text>
                      </View>

                      {item.description ? (
                        <Text style={styles.descriptionText}>{item.description}</Text>
                      ) : null}

                      {item.rejection_reason ? (
                        <View style={styles.rejectionNotice}>
                          <Ionicons name="alert-circle" size={14} color="#DC2626" />
                          <Text style={styles.rejectionReasonText}>
                            Manager Note: {item.rejection_reason}
                          </Text>
                        </View>
                      ) : null}

                      <View style={styles.dateRow}>
                        <Ionicons name="calendar-outline" size={12} color="#94A3B8" />
                        <Text style={styles.dateText}>{item.expense_date}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}

          {/* Bottom Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.newClaimBtn}
              activeOpacity={0.85}
              onPress={() => setIsAddModalOpen(true)}
            >
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text style={styles.newClaimBtnText}>+ New Expense Claim</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <AddExpenseModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
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
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: "#F8FAFC",
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
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
  expenseCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  expenseHeader: {
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
  expenseType: {
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
  amountText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  descriptionText: {
    fontSize: 12,
    color: "#475569",
    marginBottom: 8,
  },
  rejectionNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF2F2",
    padding: 8,
    borderRadius: radii.md,
    marginBottom: 8,
  },
  rejectionReasonText: {
    fontSize: 11,
    color: "#DC2626",
    fontWeight: "600",
    flexShrink: 1,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: "#94A3B8",
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
  },
  newClaimBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radii.lg,
  },
  newClaimBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
