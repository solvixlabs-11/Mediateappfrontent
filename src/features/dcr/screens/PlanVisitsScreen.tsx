import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { AttendanceCard } from "../../attendance/components/AttendanceCard";
import {
  DcrDailySummaryDto,
  DcrVisitDto,
  FollowUpDto,
  PlannedVisitDto,
  dcrApi,
} from "../api/dcrApi";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/types";
import { ROUTES } from "../../../navigation/routes";
import { colors, radii, shadows, spacing, typography } from "../../../theme";
import { ScreenHeader } from "../../../shared/components/ScreenHeader";

type PlanTab = "PLANS" | "CALL_LOG" | "FOLLOW_UPS";

export function PlanVisitsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<PlanTab>("PLANS");
  const [plans, setPlans] = useState<PlannedVisitDto[]>([]);
  const [visits, setVisits] = useState<DcrVisitDto[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpDto[]>([]);
  const [summary, setSummary] = useState<DcrDailySummaryDto | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const [isPunchedIn, setIsPunchedIn] = useState(false);

  const handleLogCallFromPlan = (plan: PlannedVisitDto) => {
    if (!isPunchedIn) {
      Alert.alert(
        "Punch-In Required 🔒",
        "You cannot start or log a customer visit before punching in. Please record your daily attendance check-in above first."
      );
      return;
    }
    navigation.navigate(ROUTES.DcrForm, {
      initialPlannedVisitId: plan.id,
      initialCustomerType: plan.customer_type,
      initialCustomerId:
        plan.doctor_id ||
        plan.chemist_id ||
        plan.hospital_id ||
        plan.stockist_id ||
        undefined,
    });
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
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Top Header */}
      <ScreenHeader
        title="Planning & Visits"
        subtitle="Daily schedule, calls & follow-ups"
        variant="navy"
        onBack={navigation?.canGoBack && navigation.canGoBack() ? () => navigation.goBack() : undefined}
        rightElement={
          <TouchableOpacity
            style={styles.newDcrBtn}
            onPress={() => {
              if (!isPunchedIn) {
                Alert.alert(
                  "Punch-In Required 🔒",
                  "You cannot log visits before punching in. Please complete your morning attendance check-in above first."
                );
                return;
              }
              navigation.navigate(ROUTES.DcrForm);
            }}
            activeOpacity={0.8}
            accessibilityLabel="Log Call"
          >
            <Feather name="plus" size={15} color={colors.surface} />
            <Text style={styles.newDcrBtnText}>Log Call</Text>
          </TouchableOpacity>
        }
      />

      <FlatList
        data={[]}
        renderItem={() => null}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.navy}
          />
        }
        ListHeaderComponent={
          <View style={styles.scrollHeader}>
            {/* Daily Attendance Card */}
            <AttendanceCard onStatusChanged={(att) => setIsPunchedIn(!!att?.check_in_time)} />

            {/* Bento KPI Summary Row */}
            <View style={styles.kpiCard}>
              <View style={styles.kpiCol}>
                <Text style={styles.kpiNumber}>{summary?.total_calls ?? 0}</Text>
                <Text style={styles.kpiLabel}>Calls Done</Text>
              </View>
              <View style={styles.kpiDivider} />
              <View style={styles.kpiCol}>
                <Text style={[styles.kpiNumber, { color: colors.teal }]}>
                  {summary?.geofence_verified_count ?? 0}
                </Text>
                <Text style={styles.kpiLabel}>Geofence OK</Text>
              </View>
              <View style={styles.kpiDivider} />
              <View style={styles.kpiCol}>
                <Text style={[styles.kpiNumber, { color: colors.brandBlue }]}>
                  ₹{Math.round(summary?.total_pob_amount ?? 0).toLocaleString("en-IN")}
                </Text>
                <Text style={styles.kpiLabel}>Total POB</Text>
              </View>
            </View>

            {/* Segmented Pill Tabs Navigation */}
            <View style={styles.tabNav}>
              {(
                [
                  { id: "PLANS" as const, label: "Plan", count: plans.length, icon: "calendar" as const },
                  { id: "CALL_LOG" as const, label: "Calls", count: visits.length, icon: "check-circle" as const },
                  {
                    id: "FOLLOW_UPS" as const,
                    label: "Follow-ups",
                    count: followUps.filter((f) => f.status === "PENDING").length,
                    icon: "clock" as const,
                  },
                ]
              ).map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[styles.tabNavItem, active && styles.tabNavItemActive]}
                    onPress={() => setActiveTab(tab.id)}
                    activeOpacity={0.8}
                  >
                    <Feather
                      name={tab.icon}
                      size={14}
                      color={active ? colors.brandBlue : colors.textMuted}
                    />
                    <Text style={[styles.tabNavText, active && styles.tabNavTextActive]}>
                      {tab.label}
                    </Text>
                    <View style={[styles.tabCountPill, active && styles.tabCountPillActive]}>
                      <Text style={[styles.tabCountText, active && styles.tabCountTextActive]}>
                        {tab.count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Tab Contents */}
            {isLoading && !isRefreshing ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="large" color={colors.navy} />
              </View>
            ) : activeTab === "PLANS" ? (
              /* PLANS LIST */
              <View style={styles.tabContentList}>
                {plans.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <View style={styles.emptyIconCircle}>
                      <Feather name="calendar" size={28} color={colors.teal} />
                    </View>
                    <Text style={styles.emptyTitle}>No planned calls for today</Text>
                    <Text style={styles.emptyDesc}>
                      You can log calls directly using the "+ Log Call" button above.
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
                            <Feather name="phone-call" size={14} color={colors.surface} />
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
                    <View style={styles.emptyIconCircle}>
                      <Feather name="file-text" size={28} color={colors.brandBlue} />
                    </View>
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
                          <Feather
                            name={v.is_geofence_verified ? "check-circle" : "alert-circle"}
                            size={12}
                            color={v.is_geofence_verified ? colors.teal : colors.orange}
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
                            Outcome: {v.post_call_analysis.call_outcome.replace(/_/g, " ")}
                          </Text>
                          {v.post_call_analysis.doctor_feedback ? (
                            <Text style={styles.feedbackText}>
                              &quot;{v.post_call_analysis.doctor_feedback}&quot;
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
                    <View style={styles.emptyIconCircle}>
                      <Feather name="clock" size={28} color={colors.orange} />
                    </View>
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
                            <Feather name="check" size={14} color={colors.surface} />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  newDcrBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
  },
  newDcrBtnText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "700",
  },
  scrollHeader: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  kpiCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  kpiCol: {
    flex: 1,
    alignItems: "center",
  },
  kpiNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textInk,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    marginTop: 2,
  },
  kpiDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  tabNav: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: 6,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
    ...shadows.sm,
  },
  tabNavItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: radii.lg,
    backgroundColor: colors.background,
  },
  tabNavItemActive: {
    backgroundColor: colors.bluePastel,
  },
  tabNavText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  tabNavTextActive: {
    color: colors.brandBlue,
    fontWeight: "700",
  },
  tabCountPill: {
    backgroundColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  tabCountPillActive: {
    backgroundColor: colors.brandBlue,
  },
  tabCountText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
  },
  tabCountTextActive: {
    color: colors.surface,
  },
  tabContentList: {
    marginTop: spacing.xs,
  },
  centerLoading: {
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.xxl,
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
    ...shadows.sm,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.tealPastel,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textInk,
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
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
    fontSize: 15,
    fontWeight: "700",
    color: colors.textInk,
  },
  itemSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "700",
  },
  statusCompleted: {
    backgroundColor: colors.tealPastel,
  },
  statusCompletedText: {
    color: colors.teal,
  },
  statusPlanned: {
    backgroundColor: colors.bluePastel,
  },
  statusPlannedText: {
    color: colors.brandBlue,
  },
  statusPending: {
    backgroundColor: colors.orangePastel,
  },
  statusPendingText: {
    color: colors.orange,
  },
  callActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.navy,
    borderRadius: radii.lg,
    paddingVertical: 10,
    marginTop: spacing.md,
  },
  callActionBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.surface,
  },
  callRemarks: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  postCallSummaryBox: {
    backgroundColor: colors.inputBackground,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  outcomeTag: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.brandBlue,
    textTransform: "capitalize",
  },
  feedbackText: {
    fontSize: 12,
    fontStyle: "italic",
    color: colors.textMuted,
    marginTop: 2,
  },
  pobRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.inputBackground,
  },
  pobLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  pobVal: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.teal,
  },
  completeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.teal,
    borderRadius: radii.lg,
    paddingVertical: 10,
    marginTop: spacing.md,
  },
  completeBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.surface,
  },
});
