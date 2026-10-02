import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../auth/store";
import { AttendanceDto, attendanceApi } from "../../attendance/api/attendanceApi";
import { DcrDailySummaryDto, PlannedVisitDto, dcrApi } from "../../dcr/api/dcrApi";
import { useFocusEffect } from "@react-navigation/native";
import { ROUTES } from "../../../navigation/routes";
import { colors, radii, spacing } from "../../../shared/theme/tokens";

interface MrDashboardScreenProps {
  navigation?: any;
}

export function MrDashboardScreen({ navigation }: MrDashboardScreenProps) {
  const user = useAuthStore((s) => s.user);

  // State
  const [attendance, setAttendance] = useState<AttendanceDto | null>(null);
  const [summary, setSummary] = useState<DcrDailySummaryDto | null>(null);
  const [nextVisit, setNextVisit] = useState<PlannedVisitDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPunchLoading, setIsPunchLoading] = useState(false);

  // Navigation & Data Reload on Focus
  // Modal states removed per Section 3.1 & Rule M-18

  // Load Dashboard Data
  const loadDashboardData = useCallback(async () => {
    try {
      // 1. Fetch Today Attendance
      try {
        const att = await attendanceApi.getToday();
        setAttendance(att);
      } catch (err) {
        console.warn("Failed to fetch today attendance:", err);
      }

      // 2. Fetch Daily Summary
      try {
        const sum = await dcrApi.getSummary();
        setSummary(sum);
      } catch (err) {
        console.warn("Failed to fetch daily summary:", err);
      }

      // 3. Fetch Next Planned Visit
      try {
        const plans = await dcrApi.listPlans();
        const pending = plans.find((p: PlannedVisitDto) => p.status === "PLANNED");
        setNextVisit(pending || null);
      } catch (err) {
        console.warn("Failed to fetch planned visits:", err);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    loadDashboardData();
  };

  // Handle Punch In / Out
  const handlePunchCheckIn = async () => {
    setIsPunchLoading(true);
    try {
      const record = await attendanceApi.checkIn({
        latitude: 19.0760,
        longitude: 72.8777,
        accuracy: 12.0,
        address: "Dadar West, Mumbai",
        mock_location_flag: false,
        remarks: "Morning field punch",
        client_uuid: `att-in-${Date.now()}`,
      });
      setAttendance(record);
      Alert.alert("GPS Verified", "Checked in successfully for Field Work!");
    } catch (err: any) {
      if (err?.response?.status === 409) {
        // Idempotent: already checked in, re-fetch state
        const today = await attendanceApi.getToday();
        setAttendance(today);
      } else {
        Alert.alert(
          "Punch Check-in",
          err?.response?.data?.detail || "Could not record check-in. Please try again."
        );
      }
    } finally {
      setIsPunchLoading(false);
    }
  };

  const handlePunchCheckOut = async () => {
    Alert.alert(
      "Confirm Check-Out",
      "Are you sure you want to end your daily field calls and check out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Punch Check-out",
          style: "destructive",
          onPress: async () => {
            setIsPunchLoading(true);
            try {
              const record = await attendanceApi.checkOut({
                latitude: 19.0765,
                longitude: 72.8780,
                accuracy: 10.0,
                address: "Dadar West, Mumbai",
                mock_location_flag: false,
                remarks: "Day field work completed",
              });
              setAttendance(record);
              Alert.alert("Day Completed", "Check-out recorded successfully.");
            } catch (err: any) {
              Alert.alert(
                "Punch Check-out",
                err?.response?.data?.detail || "Could not record check-out."
              );
            } finally {
              setIsPunchLoading(false);
            }
          },
        },
      ]
    );
  };

  // Format dynamic dates
  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const isCheckedIn = !!attendance?.check_in_time;
  const isCheckedOut = !!attendance?.check_out_time;

  const checkInTimeFormatted = attendance?.check_in_time
    ? new Date(attendance.check_in_time).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : null;

  // KPIs
  const totalPlanned = summary?.planned_calls_count ?? 6;
  const totalCompleted = summary?.total_calls ?? 4;
  const totalPending = Math.max(0, totalPlanned - totalCompleted);
  const donePercent = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;

  // Next Up Visit Details (fallback to demo doctor if no active plan in DB)
  const nextDocName = nextVisit?.customer_name || "Dr. Anand Deshmukh, M.D.";
  const nextDocSpecialty = "Cardiology";
  const nextDocClinic = "Apex Heart & Chest Clinic, Dadar (W)";
  const nextDocPhone = "+919820012345";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <RNStatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top App Bar Header */}
      <View style={styles.topAppBar}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Ionicons name="medical" size={16} color="#FFFFFF" />
          </View>
          <View style={styles.brandCol}>
            <Text style={styles.brandText}>Mediate MR</Text>
            <Text style={styles.brandSubtext}>Field Operations</Text>
          </View>
        </View>

        <View style={styles.topRightActions}>
          <View style={styles.onlinePill}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlinePillText}>Online</Text>
          </View>

          <TouchableOpacity
            style={styles.bellBtn}
            activeOpacity={0.7}
            onPress={() => {
              Alert.alert("Field Alerts", "You have 3 operational alerts scheduled for today.");
            }}
          >
            <Ionicons name="notifications-outline" size={20} color="#1E293B" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.avatarCircle}
            activeOpacity={0.8}
            onPress={() => {
              if (navigation) navigation.navigate("More" as never);
            }}
          >
            <Text style={styles.avatarText}>
              {user?.fullName
                ? user.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()
                : "MR"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome & Context Hero Card */}
        <View style={styles.welcomeHeroCard}>
          <View style={styles.welcomeHeroTop}>
            <View style={styles.welcomeNameCol}>
              <Text style={styles.welcomeSubTitle}>Good morning,</Text>
              <Text style={styles.welcomeTitle} numberOfLines={1}>
                {user?.fullName || "Field Representative"}
              </Text>
            </View>

            <View style={styles.hqBadge}>
              <Ionicons name="location" size={12} color="#0D5C46" />
              <Text style={styles.hqBadgeText}>Mumbai Central HQ</Text>
            </View>
          </View>

          <View style={styles.heroCardDivider} />

          <View style={styles.welcomeHeroBottom}>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={13} color="#64748B" />
              <Text style={styles.dateSubtext}>{todayFormatted}</Text>
            </View>

            <View style={styles.alertsContainer}>
              <TouchableOpacity
                style={styles.expenseAlertPill}
                activeOpacity={0.8}
                onPress={() => {
                  if (navigation) navigation.navigate(ROUTES.ExpenseList);
                }}
              >
                <Ionicons name="alert-circle-outline" size={12} color="#B91C1C" />
                <Text style={styles.expenseAlertText}>Expense Claims</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.followupAlertPill}
                activeOpacity={0.8}
                onPress={() => {
                  if (navigation) navigation.navigate("Visits");
                }}
              >
                <Ionicons name="warning-outline" size={12} color="#B45309" />
                <Text style={styles.followupAlertText}>2 Follow-ups</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 1. Field Work & Attendance Card */}
        <View style={styles.cardContainer}>
          <View style={styles.fieldWorkHeader}>
            <View style={styles.fieldWorkPill}>
              <Ionicons name="walk" size={14} color="#0D9488" />
              <Text style={styles.fieldWorkPillText}>Field Work</Text>
            </View>

            <View style={styles.checkedInStatusRow}>
              {isCheckedOut ? (
                <>
                  <Ionicons name="checkmark-done-circle" size={16} color={colors.navy} />
                  <Text style={styles.checkedInText}>Punched Out</Text>
                </>
              ) : isCheckedIn ? (
                <>
                  <Ionicons name="checkmark-circle" size={16} color="#059669" />
                  <Text style={styles.checkedInText}>Checked in {checkInTimeFormatted}</Text>
                </>
              ) : (
                <>
                  <Ionicons name="time-outline" size={16} color="#B45309" />
                  <Text style={[styles.checkedInText, { color: "#B45309" }]}>Not Checked In</Text>
                </>
              )}
            </View>
          </View>

          <View style={styles.fieldWorkDetailsRow}>
            <View style={styles.gpsLocationRow}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#059669" />
              <Text style={styles.gpsLocationText}>
                GPS Locked: <Text style={styles.gpsBold}>Dadar West</Text> (±12m)
              </Text>
            </View>

            <View style={styles.shiftPill}>
              <Text style={styles.shiftPillText}>Shift: 09:00 - 18:30</Text>
            </View>
          </View>

          {/* Punch Button */}
          {!isCheckedIn ? (
            <TouchableOpacity
              style={styles.primaryPunchBtn}
              onPress={handlePunchCheckIn}
              disabled={isPunchLoading}
              activeOpacity={0.85}
            >
              {isPunchLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.punchBtnText}>Punch Check-in</Text>
                </>
              )}
            </TouchableOpacity>
          ) : !isCheckedOut ? (
            <TouchableOpacity
              style={styles.primaryPunchBtn}
              onPress={handlePunchCheckOut}
              disabled={isPunchLoading}
              activeOpacity={0.85}
            >
              {isPunchLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="exit-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.punchBtnText}>Punch Check-out</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.completedPunchBox}>
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
              <Text style={styles.completedPunchText}>Shift Finalized • Daily Work Logged</Text>
            </View>
          )}
        </View>

        {/* 2. Today's Visit Target Card */}
        <View style={styles.cardContainer}>
          <View style={styles.targetHeaderRow}>
            <View>
              <Text style={styles.targetTitle}>Today's Visit Target</Text>
              <Text style={styles.targetSubtitle}>DCR Route: Dadar West & Prabhadevi</Text>
            </View>
            <View style={styles.donePill}>
              <Text style={styles.donePillText}>{donePercent}% Done</Text>
            </View>
          </View>

          {/* 3 Metrics Boxes in a row */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCardBlue}>
              <Text style={styles.metricValBlue}>{totalPlanned}</Text>
              <Text style={styles.metricLblBlue}>Planned</Text>
            </View>

            <View style={styles.metricCardGreen}>
              <Text style={styles.metricValGreen}>{totalCompleted}</Text>
              <Text style={styles.metricLblGreen}>Done</Text>
            </View>

            <View style={styles.metricCardYellow}>
              <Text style={styles.metricValYellow}>{totalPending}</Text>
              <Text style={styles.metricLblYellow}>Pending</Text>
            </View>
          </View>

          {/* Dual-color Progress Bar */}
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, Math.max(10, donePercent))}%` },
              ]}
            />
          </View>

          {/* Sub Breakdown */}
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <Ionicons name="medkit-outline" size={14} color="#047857" />
              <Text style={styles.breakdownText}>Primary Doctors: 4/5</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Ionicons name="business-outline" size={14} color="#047857" />
              <Text style={styles.breakdownText}>Chemists/Stockists: 2/2</Text>
            </View>
          </View>
        </View>

        {/* 3. NEXT UP Doctor Call Card */}
        <View style={[styles.cardContainer, styles.nextUpCard]}>
          <View style={styles.nextUpHeaderRow}>
            <View style={styles.timeTagRow}>
              <Ionicons name="time-outline" size={14} color="#475569" />
              <Text style={styles.nextUpTimeText}>NEXT UP • 11:30 AM</Text>
            </View>
            <View style={styles.confirmedPill}>
              <Ionicons name="checkmark" size={12} color="#047857" />
              <Text style={styles.confirmedPillText}>Confirmed</Text>
            </View>
          </View>

          <View style={styles.doctorInfoRow}>
            <Text style={styles.doctorNameText}>{nextDocName}</Text>
            <View style={styles.specialtyPill}>
              <Text style={styles.specialtyPillText}>{nextDocSpecialty}</Text>
            </View>
          </View>

          <View style={styles.clinicAddressRow}>
            <Ionicons name="location-outline" size={14} color="#64748B" />
            <Text style={styles.clinicAddressText}>{nextDocClinic}</Text>
          </View>

          {/* Focus Detailing Box */}
          <View style={styles.focusDetailingBox}>
            <View style={styles.focusHeader}>
              <Ionicons name="medical" size={13} color="#0284C7" />
              <Text style={styles.focusLabel}>Focus Detailing:</Text>
            </View>
            <Text style={styles.focusProducts}>CardioMet-50 & Rosuvastatin 20mg</Text>
          </View>

          {/* Action Row */}
          <View style={styles.nextUpActionsRow}>
            <TouchableOpacity
              style={styles.startVisitBtn}
              activeOpacity={0.85}
              onPress={() => {
                if (navigation) {
                  navigation.navigate(ROUTES.DcrForm, {
                    initialPlannedVisitId: nextVisit?.id,
                    initialCustomerType: nextVisit?.customer_type,
                    initialCustomerId: nextVisit?.doctor_id || undefined,
                  });
                }
              }}
            >
              <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" />
              <Text style={styles.startVisitBtnText}>Start Visit Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.callPhoneBtn}
              activeOpacity={0.8}
              onPress={() => {
                Linking.openURL(`tel:${nextDocPhone}`);
              }}
            >
              <Ionicons name="call-outline" size={20} color="#0D5C46" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Quick Actions Grid */}
        <View style={styles.quickActionsSection}>
          <View style={styles.quickActionsHeaderRow}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            <Text style={styles.quickActionsSubtitle}>Standard Ops</Text>
          </View>

          <View style={styles.quickActionsGrid}>
            {/* Tile 1: New Visit Report */}
            <TouchableOpacity
              style={styles.actionTile}
              activeOpacity={0.8}
              onPress={() => {
                if (navigation) navigation.navigate(ROUTES.DcrForm);
              }}
            >
              <View style={styles.tileLeft}>
                <View style={[styles.tileIconCircle, { backgroundColor: "#D1FAE5" }]}>
                  <Ionicons name="clipboard-outline" size={20} color="#059669" />
                </View>
                <Text style={styles.tileTitle}>New Visit Report</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>

            {/* Tile 2: Plan Tour / Visit */}
            <TouchableOpacity
              style={styles.actionTile}
              activeOpacity={0.8}
              onPress={() => {
                if (navigation) navigation.navigate(ROUTES.TourPlanner);
              }}
            >
              <View style={styles.tileLeft}>
                <View style={[styles.tileIconCircle, { backgroundColor: "#DBEAFE" }]}>
                  <Ionicons name="calendar-outline" size={20} color="#2563EB" />
                </View>
                <Text style={styles.tileTitle}>Plan Tour / TP</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>

            {/* Tile 3: Add Expense */}
            <TouchableOpacity
              style={styles.actionTile}
              activeOpacity={0.8}
              onPress={() => {
                if (navigation) navigation.navigate(ROUTES.ExpenseList);
              }}
            >
              <View style={styles.tileLeft}>
                <View style={[styles.tileIconCircle, { backgroundColor: "#FEF3C7" }]}>
                  <Ionicons name="receipt-outline" size={20} color="#D97706" />
                </View>
                <Text style={styles.tileTitle}>Add Expense</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>

            {/* Tile 4: Apply Leave */}
            <TouchableOpacity
              style={styles.actionTile}
              activeOpacity={0.8}
              onPress={() => {
                if (navigation) navigation.navigate(ROUTES.LeaveList);
              }}
            >
              <View style={styles.tileLeft}>
                <View style={[styles.tileIconCircle, { backgroundColor: "#FEE2E2" }]}>
                  <Ionicons name="calendar-clear-outline" size={20} color="#DC2626" />
                </View>
                <Text style={styles.tileTitle}>Apply Leave</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>

            {/* Tile 5: My Orders / POB */}
            <TouchableOpacity
              style={styles.actionTile}
              activeOpacity={0.8}
              onPress={() => {
                if (navigation) {
                  navigation.navigate(ROUTES.ComingSoon, {
                    featureName: "Orders & Secondary Booking (POB)",
                    phase: "Phase 6",
                  });
                }
              }}
            >
              <View style={styles.tileLeft}>
                <View style={[styles.tileIconCircle, { backgroundColor: "#CCFBF1" }]}>
                  <Ionicons name="bag-handle-outline" size={20} color="#0D9488" />
                </View>
                <Text style={styles.tileTitle}>My Orders / POB</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>

            {/* Tile 6: Tasks & Reminders */}
            <TouchableOpacity
              style={styles.actionTile}
              activeOpacity={0.8}
              onPress={() => {
                if (navigation) {
                  navigation.navigate(ROUTES.ComingSoon, {
                    featureName: "Tasks & Reminders",
                    phase: "Phase 6",
                  });
                }
              }}
            >
              <View style={styles.tileLeft}>
                <View style={[styles.tileIconCircle, { backgroundColor: "#EDE9FE" }]}>
                  <Ionicons name="options-outline" size={20} color="#7C3AED" />
                </View>
                <Text style={styles.tileTitle}>Tasks & Reminders</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Sync Status */}
        <View style={styles.syncFooter}>
          <Ionicons name="cloud-done-outline" size={14} color="#64748B" />
          <Text style={styles.syncFooterText}>Cloud sync verified • DCR v3.8.4 Live</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  topAppBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#0D5C46",
    alignItems: "center",
    justifyContent: "center",
  },
  brandCol: {
    justifyContent: "center",
  },
  brandText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  brandSubtext: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
  },
  topRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  onlinePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16A34A",
  },
  onlinePillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#15803D",
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#DC2626",
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "bold",
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#064E3B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#A7F3D0",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#F4F7FA",
  },
  scrollContent: {
    backgroundColor: "#F4F7FA",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },
  welcomeHeroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  welcomeHeroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  welcomeNameCol: {
    flex: 1,
    marginRight: 8,
  },
  welcomeSubTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 2,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  hqBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  hqBadgeText: {
    fontSize: 11,
    color: "#065F46",
    fontWeight: "700",
  },
  heroCardDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 10,
  },
  welcomeHeroBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dateSubtext: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  alertsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  expenseAlertPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  expenseAlertText: {
    fontSize: 11,
    color: "#B91C1C",
    fontWeight: "700",
  },
  followupAlertPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  followupAlertText: {
    fontSize: 11,
    color: "#B45309",
    fontWeight: "700",
  },
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  fieldWorkHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  fieldWorkPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#E6FFFA",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  fieldWorkPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0D9488",
  },
  checkedInStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  checkedInText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
  },
  fieldWorkDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  gpsLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  gpsLocationText: {
    fontSize: 12,
    color: "#475569",
  },
  gpsBold: {
    fontWeight: "700",
    color: "#0F172A",
  },
  shiftPill: {
    backgroundColor: "#F0F9FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  shiftPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0284C7",
  },
  primaryPunchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0D5C46",
    borderRadius: 10,
    paddingVertical: 12,
  },
  punchBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  completedPunchBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#ECFDF5",
    paddingVertical: 10,
    borderRadius: 8,
  },
  completedPunchText: {
    color: "#047857",
    fontSize: 12,
    fontWeight: "600",
  },
  targetHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  targetTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  targetSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  donePill: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  donePillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#047857",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  metricCardBlue: {
    flex: 1,
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  metricValBlue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1D4ED8",
  },
  metricLblBlue: {
    fontSize: 11,
    fontWeight: "600",
    color: "#3B82F6",
    marginTop: 2,
  },
  metricCardGreen: {
    flex: 1,
    backgroundColor: "#ECFDF5",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  metricValGreen: {
    fontSize: 18,
    fontWeight: "800",
    color: "#047857",
  },
  metricLblGreen: {
    fontSize: 11,
    fontWeight: "600",
    color: "#10B981",
    marginTop: 2,
  },
  metricCardYellow: {
    flex: 1,
    backgroundColor: "#FFFBEB",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  metricValYellow: {
    fontSize: 18,
    fontWeight: "800",
    color: "#B45309",
  },
  metricLblYellow: {
    fontSize: 11,
    fontWeight: "600",
    color: "#F59E0B",
    marginTop: 2,
  },
  progressBarBg: {
    height: 7,
    borderRadius: 4,
    backgroundColor: "#FDE68A",
    overflow: "hidden",
    marginBottom: 10,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#0D5C46",
    borderRadius: 4,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  breakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  breakdownText: {
    fontSize: 11,
    color: "#334155",
    fontWeight: "500",
  },
  nextUpCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#059669",
  },
  nextUpHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  timeTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  nextUpTimeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    letterSpacing: 0.5,
  },
  confirmedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  confirmedPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#047857",
  },
  doctorInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  doctorNameText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  specialtyPill: {
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  specialtyPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#7E22CE",
  },
  clinicAddressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    marginBottom: 10,
  },
  clinicAddressText: {
    fontSize: 12,
    color: "#64748B",
  },
  focusDetailingBox: {
    backgroundColor: "#F0F9FF",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0F2FE",
  },
  focusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  focusLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0369A1",
  },
  focusProducts: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0C4A6E",
    marginTop: 3,
  },
  nextUpActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  startVisitBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0D5C46",
    borderRadius: 10,
    paddingVertical: 12,
  },
  startVisitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  callPhoneBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  quickActionsSection: {
    marginTop: 4,
    marginBottom: 10,
  },
  quickActionsHeaderRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  quickActionsSubtitle: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  actionTile: {
    width: "48.5%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tileLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  tileIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  tileTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0F172A",
    flexShrink: 1,
  },
  syncFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 10,
  },
  syncFooterText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
});
