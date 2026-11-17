import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../auth/store";
import { AttendanceDto, attendanceApi } from "../../attendance/api/attendanceApi";
import { DcrDailySummaryDto, PlannedVisitDto, dcrApi } from "../../dcr/api/dcrApi";
import { useFocusEffect } from "@react-navigation/native";
import { ROUTES } from "../../../navigation/routes";
import { colors, radii, spacing } from "../../../shared/theme/tokens";
import { getCurrentGeoLocation } from "../../../shared/utils/location";
import { formatDateIST, formatTimeIST } from "../../../shared/utils/date";
import { useHealthCheck } from "../../../shared/hooks/useHealthCheck";
import { NotificationsModal } from "../../notifications/screens/NotificationsScreen";
import { notificationsApi } from "../../notifications/api/notificationsApi";
import { ProductsCatalogScreen } from "../../products/screens/ProductsCatalogScreen";
import { OrdersScreen } from "../../orders/screens/OrdersScreen";
import { MrWelcomeHeroCard } from "../components/MrWelcomeHeroCard";
import { MrAttendancePunchCard } from "../components/MrAttendancePunchCard";
import { MrDailyVisitTargetCard } from "../components/MrDailyVisitTargetCard";
import { MrQuickActionsGrid } from "../components/MrQuickActionsGrid";

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
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);

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

      // 4. Fetch Unread Notifications
      try {
        const notifs = await notificationsApi.getSummary();
        setUnreadNotifs(notifs.unread_count);
      } catch (err) {
        console.warn("Failed to fetch notification summary:", err);
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

  // Handle Punch In / Out with Live GPS Coordinates
  const handlePunchCheckIn = async () => {
    setIsPunchLoading(true);
    try {
      const geo = await getCurrentGeoLocation();
      const record = await attendanceApi.checkIn({
        latitude: geo.latitude,
        longitude: geo.longitude,
        accuracy: geo.accuracy,
        address: geo.address,
        mock_location_flag: geo.mock_location_flag,
        remarks: "Morning field punch",
        client_uuid: `att-in-${Date.now()}`,
      });
      setAttendance(record);
      Alert.alert(
        "GPS Punch-In Recorded 🎉",
        `Time: ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}\nDate: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}\nLocation: ${geo.address}\nGPS: ${geo.latitude.toFixed(5)}, ${geo.longitude.toFixed(5)}\n\nDaily field operations are now unlocked! Admin & Managers have received your verified location.`
      );
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
              const geo = await getCurrentGeoLocation();
              const record = await attendanceApi.checkOut({
                latitude: geo.latitude,
                longitude: geo.longitude,
                accuracy: geo.accuracy,
                address: geo.address,
                mock_location_flag: geo.mock_location_flag,
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

  const isCheckedIn = !!attendance?.check_in_time;
  const isCheckedOut = !!attendance?.check_out_time;

  // Action Guard: Enforces daily punching before any field activity
  const requirePunchIn = (actionCallback: () => void) => {
    if (!isCheckedIn) {
      Alert.alert(
        "Attendance Punch-In Required 🔒",
        "Field operations are locked until daily attendance is recorded.\n\nPlease punch in now to verify your morning GPS location and enable field features for management oversight.",
        [
          { text: "Punch In Now", onPress: handlePunchCheckIn },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }
    actionCallback();
  };

  const { isOnline } = useHealthCheck();

  // Format dynamic dates using standard Asia/Kolkata timezone
  const todayFormatted = formatDateIST(new Date());

  const checkInTimeFormatted = attendance?.check_in_time
    ? formatTimeIST(attendance.check_in_time)
    : null;

  // KPIs
  const totalPlanned = summary?.planned_calls_count ?? 0;
  const totalCompleted = summary?.total_calls ?? 0;
  const totalPending = Math.max(0, totalPlanned - totalCompleted);
  const donePercent = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="dark" />

      {/* Top App Bar Header with Mediate Logo & MR Role Badge */}
      <View style={styles.topAppBar}>
        <View style={styles.brandRow}>
          <Image
            source={require("../../../../assets/logo.png")}
            style={styles.headerBrandLogo}
            resizeMode="contain"
          />
          <View style={styles.roleBadgePill}>
            <Text style={styles.roleBadgePillText}>MR FIELD</Text>
          </View>
        </View>

        <View style={styles.topRightActions}>
          <View style={[styles.onlinePill, !isOnline && { backgroundColor: "#FEE2E2", borderColor: "#FECACA" }]}>
            <View style={[styles.onlineDot, !isOnline && { backgroundColor: "#DC2626" }]} />
            <Text style={[styles.onlinePillText, !isOnline && { color: "#B91C1C" }]}>
              {isOnline ? "Online" : "Offline"}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.bellBtn}
            activeOpacity={0.7}
            onPress={() => setIsNotifsOpen(true)}
          >
            <Ionicons name="notifications-outline" size={20} color="#1E293B" />
            {unreadNotifs > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadNotifs}</Text>
              </View>
            )}
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
        <MrWelcomeHeroCard
          fullName={user?.fullName}
          todayFormatted={todayFormatted}
          onRequirePunchIn={requirePunchIn}
          navigation={navigation}
        />

        {/* 1. Field Work & Attendance Card */}
        <MrAttendancePunchCard
          isCheckedIn={isCheckedIn}
          isCheckedOut={isCheckedOut}
          isPunchLoading={isPunchLoading}
          checkInTimeFormatted={checkInTimeFormatted}
          onPunchCheckIn={handlePunchCheckIn}
          onPunchCheckOut={handlePunchCheckOut}
        />

        {/* 2. Today's Visit Target Card & Next Up */}
        <MrDailyVisitTargetCard
          totalPlanned={totalPlanned}
          totalCompleted={totalCompleted}
          totalPending={totalPending}
          donePercent={donePercent}
          nextVisit={nextVisit}
          onRequirePunchIn={requirePunchIn}
          navigation={navigation}
        />

        {/* 4. Quick Actions Grid */}
        <MrQuickActionsGrid
          isCheckedIn={isCheckedIn}
          onRequirePunchIn={requirePunchIn}
          navigation={navigation}
          onOpenProducts={() => setIsProductsOpen(true)}
          onOpenOrders={() => setIsOrdersOpen(true)}
        />

        {/* Footer Sync Status */}
        <View style={styles.syncFooter}>
          <Ionicons name="cloud-done-outline" size={14} color="#64748B" />
          <Text style={styles.syncFooterText}>Cloud sync verified • DCR v3.8.4 Live</Text>
        </View>

      </ScrollView>

      {/* Modals for Notifications, Products & Detailing, Orders */}
      <NotificationsModal
        visible={isNotifsOpen}
        onClose={() => {
          setIsNotifsOpen(false);
          loadDashboardData();
        }}
      />

      <ProductsCatalogScreen
        visible={isProductsOpen}
        onClose={() => setIsProductsOpen(false)}
        onSelectProductForOrder={() => {
          setIsProductsOpen(false);
          setIsOrdersOpen(true);
        }}
      />

      <OrdersScreen
        visible={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
      />
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
  headerBrandLogo: {
    width: 106,
    height: 28,
  },
  roleBadgePill: {
    backgroundColor: "#EBF3FC",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: "#CFE2F8",
  },
  roleBadgePillText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#1B64DA",
    letterSpacing: 0.5,
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
