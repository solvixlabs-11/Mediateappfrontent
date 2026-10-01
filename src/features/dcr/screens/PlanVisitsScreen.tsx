import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AttendanceCard } from "../../attendance/components/AttendanceCard";
import {
  DcrDailySummaryDto,
  DcrVisitDto,
  FollowUpDto,
  PlannedVisitDto,
  dcrApi,
} from "../api/dcrApi";
import { DcrFormModal } from "./DcrFormModal";
import { colors, radii, spacing, typography } from "../../../shared/theme/tokens";

type PlanTab = "PLANS" | "CALL_LOG" | "FOLLOW_UPS";

export function PlanVisitsScreen() {
  const [activeTab, setActiveTab] = useState<PlanTab>("PLANS");
  const [plans, setPlans] = useState<PlannedVisitDto[]>([]);
  const [visits, setVisits] = useState<DcrVisitDto[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpDto[]>([]);
  const [summary, setSummary] = useState<DcrDailySummaryDto | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // DCR Modal
  const [dcrModalVisible, setDcrModalVisible] = useState(false);
  const [selectedPlanForDcr, setSelectedPlanForDcr] = useState<PlannedVisitDto | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [plansData, visitsData, followUpsData, summaryData] = await Promise.all([
        dcrApi.listPlans({ plan_date: todayStr }).catch(() => [] as PlannedVisitDto[]),
        dcrApi.listVisits({ dcr_date: todayStr }).catch(() => [] as DcrVisitDto[]),
        dcrApi.listFollowUps().catch(() => [] as FollowUpDto[]),
        dcrApi.getSummary(todayStr).catch(() => null),
      ]);

      setPlans(plansData);
      setVisits(visitsData);
      setFollowUps(followUpsData);
      setSummary(summaryData);
    } catch (err) {
      console.error("Failed to load DCR / Planning data:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [todayStr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleLogCallFromPlan = (plan: PlannedVisitDto) => {
    setSelectedPlanForDcr(plan);
    setDcrModalVisible(true);
  };

  const handleCompleteFollowUp = async (id: number) => {
    try {
      await dcrApi.completeFollowUp(id);
      setFollowUps((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: "COMPLETED" } : f))
      );
    } catch (err) {
      console.error("Failed to complete follow up:", err);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Daily Planning & DCR</Text>
          <Text style={styles.subtitle}>Field execution, calls & follow-ups</Text>
        </View>

        <TouchableOpacity
          style={styles.newDcrBtn}
          onPress={() => {
            setSelectedPlanForDcr(null);
            setDcrModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.newDcrBtnText}>Log Call</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={[]}
        renderItem={null}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.scrollHeader}>
            {/* Daily Attendance Card */}
            <AttendanceCard />

            {/* KPI Summary Tiles */}
            {summary && (
              <View style={styles.kpiRow}>
                <View style={styles.kpiTile}>
                  <Text style={styles.kpiNumber}>{summary.total_calls}</Text>
                  <Text style={styles.kpiLabel}>Calls Done</Text>
                </View>
                <View style={styles.kpiTile}>
                  <Text style={[styles.kpiNumber, { color: colors.success }]}>
                    {summary.geofence_verified_count}
                  </Text>
                  <Text style={styles.kpiLabel}>Geofence OK</Text>
                </View>
                <View style={styles.kpiTile}>
                  <Text style={[styles.kpiNumber, { color: colors.primary }]}>
                    ₹{Math.round(summary.total_pob_amount).toLocaleString("en-IN")}
                  </Text>
                  <Text style={styles.kpiLabel}>Total POB</Text>
                </View>
              </View>
            )}

            {/* Tab Navigation */}
            <View style={styles.tabNav}>
              {(
                [
                  { id: "PLANS", label: `Plan (${plans.length})`, icon: "calendar" },
                  { id: "CALL_LOG", label: `Calls (${visits.length})`, icon: "checkmark-done" },
                  {
                    id: "FOLLOW_UPS",
                    label: `Follow-ups (${followUps.filter((f) => f.status === "PENDING").length})`,
                    icon: "alarm",
                  },
                ] as const
              ).map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[styles.tabNavItem, active && styles.tabNavItemActive]}
                    onPress={() => setActiveTab(tab.id)}
                  >
                    <Ionicons
                      name={tab.icon as any}
                      size={14}
                      color={active ? colors.primary : colors.textSecondary}
                    />
                    <Text style={[styles.tabNavText, active && styles.tabNavTextActive]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Tab Contents */}
            {isLoading && !isRefreshing ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : activeTab === "PLANS" ? (
              /* PLANS LIST */
              <View style={styles.tabContentList}>
                {plans.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Ionicons name="calendar-outline" size={40} color={colors.grey} />
                    <Text style={styles.emptyTitle}>No planned calls for today</Text>
                    <Text style={styles.emptyDesc}>
                      You can log calls directly using the "Log Call" button above.
                    </Text>
                  </View>
                ) : (
                  plans.map((p) => {
                    const isCompleted = p.status === "COMPLETED";
                    return (
                      <View key={p.id} style={styles.itemCard}>
                        <View style={styles.itemHeader}>
                          <View style={styles.itemTitleBlock}>
                            <Text style={styles.itemName}>
                              {p.customer_name || `${p.customer_type} #${p.id}`}
                            </Text>
                            <Text style={styles.itemSub}>
                              {p.visit_purpose || "Regular Medical Visit"} • Priority {p.priority}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.statusPill,
                              isCompleted ? styles.statusCompleted : styles.statusPlanned,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusPillText,
                                isCompleted
                                  ? styles.statusCompletedText
                                  : styles.statusPlannedText,
                              ]}
                            >
                              {p.status}
                            </Text>
                          </View>
                        </View>

                        {!isCompleted && (
                          <TouchableOpacity
                            style={styles.callActionBtn}
                            onPress={() => handleLogCallFromPlan(p)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="call" size={14} color="#fff" />
                            <Text style={styles.callActionBtnText}>Record DCR Call</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            ) : activeTab === "CALL_LOG" ? (
              /* COMPLETED CALL LOG */
              <View style={styles.tabContentList}>
                {visits.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Ionicons name="document-text-outline" size={40} color={colors.grey} />
                    <Text style={styles.emptyTitle}>No calls submitted today</Text>
                    <Text style={styles.emptyDesc}>
                      Submit your first field call to see it recorded here.
                    </Text>
                  </View>
                ) : (
                  visits.map((v) => (
                    <View key={v.id} style={styles.itemCard}>
                      <View style={styles.itemHeader}>
                        <View style={styles.itemTitleBlock}>
                          <Text style={styles.itemName}>
                            {v.customer_name || `${v.customer_type} #${v.id}`}
                          </Text>
                          <Text style={styles.itemSub}>
                            {v.customer_type} • Duration: {v.call_duration_minutes}m • {v.visit_type}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.statusPill,
                            v.is_geofence_verified ? styles.statusCompleted : styles.statusPending,
                          ]}
                        >
                          <Ionicons
                            name={v.is_geofence_verified ? "shield-checkmark" : "alert-circle"}
                            size={12}
                            color={v.is_geofence_verified ? colors.success : colors.warning}
                          />
                          <Text
                            style={[
                              styles.statusPillText,
                              v.is_geofence_verified
                                ? styles.statusCompletedText
                                : styles.statusPendingText,
                            ]}
                          >
                            {v.is_geofence_verified ? "Verified GPS" : "Out of Range"}
                          </Text>
                        </View>
                      </View>

                      {v.remarks ? (
                        <Text style={styles.callRemarks}>{v.remarks}</Text>
                      ) : null}

                      {/* Post call summary */}
                      {v.post_call_analysis ? (
                        <View style={styles.postCallSummaryBox}>
                          <Text style={styles.outcomeTag}>
                            Outcome: {v.post_call_analysis.call_outcome.replace("_", " ")}
                          </Text>
                          {v.post_call_analysis.doctor_feedback ? (
                            <Text style={styles.feedbackText}>
                              "{v.post_call_analysis.doctor_feedback}"
                            </Text>
                          ) : null}
                        </View>
                      ) : null}

                      {v.pob_amount > 0 ? (
                        <View style={styles.pobRow}>
                          <Text style={styles.pobLabel}>POB Order:</Text>
                          <Text style={styles.pobVal}>₹{v.pob_amount.toLocaleString("en-IN")}</Text>
                        </View>
                      ) : null}
                    </View>
                  ))
                )}
              </View>
            ) : (
              /* FOLLOW-UPS */
              <View style={styles.tabContentList}>
                {followUps.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Ionicons name="alarm-outline" size={40} color={colors.grey} />
                    <Text style={styles.emptyTitle}>No pending follow-ups</Text>
                    <Text style={styles.emptyDesc}>
                      Follow-ups created during DCR calls will appear here.
                    </Text>
                  </View>
                ) : (
                  followUps.map((f) => {
                    const isDone = f.status === "COMPLETED";
                    return (
                      <View key={f.id} style={styles.itemCard}>
                        <View style={styles.itemHeader}>
                          <View style={styles.itemTitleBlock}>
                            <Text style={styles.itemName}>{f.title}</Text>
                            <Text style={styles.itemSub}>
                              Due: {f.due_date} • {f.customer_type}
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.statusPill,
                              isDone ? styles.statusCompleted : styles.statusPending,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusPillText,
                                isDone ? styles.statusCompletedText : styles.statusPendingText,
                              ]}
                            >
                              {f.status}
                            </Text>
                          </View>
                        </View>

                        {f.notes ? <Text style={styles.callRemarks}>{f.notes}</Text> : null}

                        {!isDone && (
                          <TouchableOpacity
                            style={styles.completeBtn}
                            onPress={() => handleCompleteFollowUp(f.id)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                            <Text style={styles.completeBtnText}>Mark as Done</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </View>
        }
      />

      {/* DCR Form Modal */}
      <DcrFormModal
        visible={dcrModalVisible}
        onClose={() => setDcrModalVisible(false)}
        initialPlannedVisitId={selectedPlanForDcr?.id}
        initialCustomerType={selectedPlanForDcr?.customer_type}
        initialCustomerId={
          selectedPlanForDcr?.doctor_id ||
          selectedPlanForDcr?.chemist_id ||
          selectedPlanForDcr?.hospital_id ||
          selectedPlanForDcr?.stockist_id ||
          undefined
        }
        onSubmitted={() => {
          loadData();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  title: {
    ...typography.title,
    fontSize: 20,
    color: colors.navy,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  newDcrBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  newDcrBtnText: {
    ...typography.button,
    color: "#fff",
    fontSize: 12,
  },
  scrollHeader: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  kpiRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  kpiTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  kpiNumber: {
    ...typography.title,
    fontSize: 18,
    color: colors.navy,
  },
  kpiLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tabNav: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xs,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabNavItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  tabNavItemActive: {
    backgroundColor: colors.lightPrimary,
  },
  tabNavText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  tabNavTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  tabContentList: {
    marginTop: spacing.xs,
  },
  centerLoading: {
    padding: spacing.xl * 2,
    alignItems: "center",
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl * 2,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    ...typography.title,
    fontSize: 15,
    color: colors.navy,
    marginTop: spacing.md,
  },
  emptyDesc: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  itemTitleBlock: {
    flex: 1,
    marginRight: spacing.sm,
  },
  itemName: {
    ...typography.subheading,
    fontSize: 14,
    color: colors.navy,
  },
  itemSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  statusPillText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: "600",
  },
  statusCompleted: {
    backgroundColor: "#DEF7EC",
  },
  statusCompletedText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: "600",
    color: colors.success,
  },
  statusPlanned: {
    backgroundColor: colors.lightPrimary,
  },
  statusPlannedText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: "600",
    color: colors.primary,
  },
  statusPending: {
    backgroundColor: "#FEF3C7",
  },
  statusPendingText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: "600",
    color: "#B45309",
  },
  callActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.xs + 2,
    marginTop: spacing.sm,
  },
  callActionBtnText: {
    ...typography.button,
    color: "#fff",
    fontSize: 12,
  },
  callRemarks: {
    ...typography.body,
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  postCallSummaryBox: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  outcomeTag: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.navy,
  },
  feedbackText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: "italic",
    marginTop: 2,
  },
  pobRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  pobLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  pobVal: {
    ...typography.subheading,
    fontSize: 13,
    color: colors.navy,
  },
  completeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  completeBtnText: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.primary,
  },
});
