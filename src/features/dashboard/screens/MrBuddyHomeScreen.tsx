import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  PanResponder,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuthStore } from "../../auth/store";
import { attendanceApi, AttendanceDto } from "../../attendance/api/attendanceApi";
import { formatTimeIST } from "../../../shared/utils/date";
import { dcrApi } from "../../dcr/api/dcrApi";
import { ROUTES } from "../../../navigation/routes";
import { RootStackParamList } from "../../../navigation/types";
import { MrBuddyCardType } from "../components/MrBuddyCardIcon";
import { MrBuddyDrawer } from "../components/MrBuddyDrawer";
import { BiometricAttendanceModal } from "../components/BiometricAttendanceModal";
import { ChangeTerritoryModal } from "../components/ChangeTerritoryModal";
import {
  CreditNoteModal,
  DoctorBusinessModal,
  EmployeeLiveTrackerModal,
  InductionModal,
  PrimarySalesModal,
  SampleReceiveModal,
  SecondarySalesModal,
  SMSBroadcastModal,
  WhatsNewModal,
} from "../components/QuickActionModals";
import { NotificationsModal } from "../../notifications/screens/NotificationsScreen";
import { ProductsCatalogScreen } from "../../products/screens/ProductsCatalogScreen";
import { OrdersScreen } from "../../orders/screens/OrdersScreen";
import { colors, radii, shadows, spacing, typography } from "../../../theme";

export function MrBuddyHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAuthStore((s) => s.user);

  // States
  const [activeTerritory, setActiveTerritory] = useState("AHMEDABAD");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isTerritoryModalOpen, setIsTerritoryModalOpen] = useState(false);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAllModules, setShowAllModules] = useState(false);

  // Attendance Status & Floating Toast
  const [attendance, setAttendance] = useState<AttendanceDto | null>(null);
  const [showPunchInToast, setShowPunchInToast] = useState(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // DCR Calls and Targets state
  const [callsDone, setCallsDone] = useState(0);
  const [callsTarget, setCallsTarget] = useState(8);

  // Slider animation state for slide-to-punch
  const [sliderWidth, setSliderWidth] = useState(240);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const isDraggingRef = useRef(false);

  const loadAttendanceAndStats = async () => {
    try {
      const res = await attendanceApi.getToday();
      setAttendance(res);
    } catch {
      setAttendance(null);
    }

    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const [plans, visits] = await Promise.all([
        dcrApi.listPlans({ plan_date: todayStr }).catch(() => []),
        dcrApi.listVisits({ dcr_date: todayStr }).catch(() => []),
      ]);
      const done = visits ? visits.length : 0;
      const target = plans && plans.length > 0 ? plans.length : 8;
      setCallsDone(done);
      setCallsTarget(target);
    } catch {
      // keep default fallback
    }
  };

  useEffect(() => {
    loadAttendanceAndStats();
  }, []);

  const triggerPunchInRequiredToast = () => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setShowPunchInToast(true);
    toastTimeoutRef.current = setTimeout(() => {
      setShowPunchInToast(false);
    }, 2800);
  };

  // Quick Action Sub-Modals
  const [isCreditNoteOpen, setIsCreditNoteOpen] = useState(false);
  const [isPrimarySalesOpen, setIsPrimarySalesOpen] = useState(false);
  const [isSecondarySalesOpen, setIsSecondarySalesOpen] = useState(false);
  const [isSampleReceiveOpen, setIsSampleReceiveOpen] = useState(false);
  const [isDoctorBusinessOpen, setIsDoctorBusinessOpen] = useState(false);
  const [isInductionOpen, setIsInductionOpen] = useState(false);
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);
  const [isSMSOpen, setIsSMSOpen] = useState(false);
  const [isLiveTrackerOpen, setIsLiveTrackerOpen] = useState(false);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadAttendanceAndStats();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  }, []);

  const handleCardPress = (type: MrBuddyCardType) => {
    const isCheckedIn = !!attendance?.check_in_time && !attendance?.check_out_time;
    const isCheckedOut = !!attendance?.check_out_time;

    const punchRequiredCards: MrBuddyCardType[] = [
      "deviation",
      "doctor_visit",
      "new_doctor_visit",
      "chemist_visit",
      "new_chemist_visit",
      "stockist_visit",
      "new_stockist_visit",
      "new_order",
      "primary_sales",
      "credit_note",
      "secondary_sales",
      "meeting",
      "primary_sales_new",
      "credit_note_new",
      "induction",
    ];

    if (isCheckedOut && punchRequiredCards.includes(type)) {
      Alert.alert("Shift Completed", "You have already punched out for today.");
      return;
    }

    if (!isCheckedIn && punchRequiredCards.includes(type)) {
      triggerPunchInRequiredToast();
      return;
    }

    switch (type) {
      case "deviation":
        navigation.navigate(ROUTES.Deviation as any);
        break;
      case "doctor_visit":
        navigation.navigate(ROUTES.DoctorVisit as any);
        break;
      case "new_doctor_visit":
        navigation.navigate(ROUTES.NewDoctorVisit as any);
        break;
      case "chemist_visit":
        navigation.navigate(ROUTES.ChemistVisit as any);
        break;
      case "new_chemist_visit":
        navigation.navigate(ROUTES.NewChemistVisit as any);
        break;
      case "stockist_visit":
        navigation.navigate(ROUTES.StockistVisit as any);
        break;
      case "new_stockist_visit":
        navigation.navigate(ROUTES.NewStockistVisit as any);
        break;
      case "new_order":
        setIsOrdersOpen(true);
        break;
      case "manage_leave":
        navigation.navigate(ROUTES.LeaveList as any);
        break;
      case "employee_live_tracker":
        navigation.navigate(ROUTES.LiveTracking as any);
        break;
      case "route_map":
        navigation.navigate(ROUTES.ReportsCatalog as any);
        break;
      case "tour_plan":
        navigation.navigate(ROUTES.TourPlanner as any);
        break;
      case "primary_sales":
        setIsPrimarySalesOpen(true);
        break;
      case "credit_note":
        setIsCreditNoteOpen(true);
        break;
      case "secondary_sales":
        setIsSecondarySalesOpen(true);
        break;
      case "meeting":
        navigation.navigate(ROUTES.DcrForm as any, { isMeeting: true });
        break;
      case "standard_route_chart":
        navigation.navigate(ROUTES.ReportFilters as any, {
          reportKey: "mr_wise_route_master",
          reportTitle: "MR Wise Route Master",
        });
        break;
      case "sms":
        setIsSMSOpen(true);
        break;
      case "product_comparison":
        setIsProductsOpen(true);
        break;
      case "credit_note_new":
        setIsCreditNoteOpen(true);
        break;
      case "primary_sales_new":
        setIsPrimarySalesOpen(true);
        break;
      case "dashboard":
        navigation.navigate(ROUTES.ReportsCatalog as any);
        break;
      case "induction":
        setIsInductionOpen(true);
        break;
      default:
        break;
    }
  };

  const handleDrawerAction = (action: string) => {
    switch (action) {
      case "change_territory":
        setIsTerritoryModalOpen(true);
        break;
      case "my_visits":
        navigation.navigate("Visits" as any);
        break;
      case "reports":
        navigation.navigate(ROUTES.ReportsCatalog as any);
        break;
      case "sample_receive":
        setIsSampleReceiveOpen(true);
        break;
      case "reimbursement":
        navigation.navigate(ROUTES.ExpenseList as any);
        break;
      case "dr_monthly_business":
        setIsDoctorBusinessOpen(true);
        break;
      case "near_by_me":
        navigation.navigate(ROUTES.ReportsCatalog as any);
        break;
      case "settings":
        setIsWhatsNewOpen(true);
        break;
      case "employee_route":
        setIsLiveTrackerOpen(true);
        break;
      case "whats_new":
        setIsWhatsNewOpen(true);
        break;
      default:
        break;
    }
  };

  // Date and user details
  const todayDate = new Date();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const formattedTodayHeader = `${dayNames[todayDate.getDay()]}, ${todayDate.getDate()} ${monthNames[todayDate.getMonth()]}`;

  const userName = user?.fullName || "Representative";
  const firstName = userName.split(" ")[0];
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "MR";

  const isCheckedIn = !!attendance?.check_in_time && !attendance?.check_out_time;
  const isCheckedOut = !!attendance?.check_out_time;
  const punchTimeFormatted = attendance?.check_in_time
    ? formatTimeIST(attendance.check_in_time)
    : null;
  const punchOutTimeFormatted = attendance?.check_out_time
    ? formatTimeIST(attendance.check_out_time)
    : null;

  const callsPercentage = callsTarget > 0 ? Math.round((callsDone / callsTarget) * 100) : 0;

  // Swipe-to-punch PanResponder with gesture claiming and drag limits
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 3,
        onPanResponderGrant: () => {
          isDraggingRef.current = false;
        },
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dx > 4) {
            isDraggingRef.current = true;
          }
          const clampedX = Math.max(0, Math.min(sliderWidth, gestureState.dx));
          slideAnim.setValue(clampedX);
        },
        onPanResponderRelease: (_, gestureState) => {
          // If tap without significant drag, open attendance modal directly
          if (!isDraggingRef.current || Math.abs(gestureState.dx) < 8) {
            slideAnim.setValue(0);
            setIsAttendanceModalOpen(true);
            return;
          }

          // If slid more than 35% of the travel distance
          if (gestureState.dx > sliderWidth * 0.35) {
            Animated.timing(slideAnim, {
              toValue: sliderWidth,
              duration: 150,
              useNativeDriver: true,
            }).start(() => {
              setIsAttendanceModalOpen(true);
              setTimeout(() => {
                slideAnim.setValue(0);
              }, 400);
            });
          } else {
            Animated.spring(slideAnim, {
              toValue: 0,
              friction: 6,
              tension: 60,
              useNativeDriver: true,
            }).start();
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [sliderWidth, slideAnim]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />

      {/* Header Matching Page 5 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => setIsDrawerOpen(true)}
            activeOpacity={0.8}
            accessibilityLabel="Open side profile menu"
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </TouchableOpacity>

          <View style={styles.userCol}>
            <Text style={styles.greetingDate}>{formattedTodayHeader}</Text>
            <Text style={styles.userNameText} numberOfLines={1}>
              Hi, {firstName}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.bellButton}
          onPress={() => setIsNotifsOpen(true)}
          activeOpacity={0.7}
          accessibilityLabel="Notifications"
        >
          <Feather name="bell" size={20} color={colors.textInk} />
          <View style={styles.unreadDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.navy]}
            tintColor={colors.navy}
          />
        }
      >
        {/* Navy Hero Card (Rounded 28) */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroLeftCol}>
              <Text style={styles.heroTerritoryLabel}>
                TODAY · {activeTerritory.toUpperCase()}
              </Text>
              <View style={styles.callsRow}>
                <Text style={styles.callsBigNumber}>{callsDone}</Text>
                <Text style={styles.callsTotalTarget}> / {callsTarget} calls</Text>
              </View>

              {/* Progress Line */}
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(100, Math.max(8, callsPercentage))}%` },
                  ]}
                />
              </View>
            </View>

            {/* Circular Progress Ring */}
            <View style={styles.progressRingOuter}>
              <View style={styles.progressRingInner}>
                <Text style={styles.progressRingPercent}>{callsPercentage}%</Text>
              </View>
            </View>
          </View>

          {/* Slide To Punch Slider Capsule (replaced by clean summary strip once punched out) */}
          {isCheckedOut ? (
            <View style={styles.shiftDoneCapsule}>
              <View style={styles.shiftDoneLeft}>
                <View style={styles.shiftDoneBadge}>
                  <Feather name="check" size={14} color="#064E3B" />
                </View>
                <Text style={styles.shiftDoneTitle}>Day Done</Text>
              </View>

              <View style={styles.shiftDoneTimes}>
                <View style={styles.shiftTimeItem}>
                  <Text style={styles.shiftTimeLabel}>IN</Text>
                  <Text style={styles.shiftTimeValue}>{punchTimeFormatted || "--:--"}</Text>
                </View>
                <View style={styles.shiftTimeDivider} />
                <View style={styles.shiftTimeItem}>
                  <Text style={styles.shiftTimeLabel}>OUT</Text>
                  <Text style={styles.shiftTimeValue}>{punchOutTimeFormatted || "--:--"}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View
              style={styles.sliderCapsule}
              onLayout={(e) => {
                const capsuleW = e.nativeEvent.layout.width;
                if (capsuleW > 0) {
                  setSliderWidth(Math.max(120, capsuleW - 54));
                }
              }}
            >
              <Animated.View
                style={[
                  styles.sliderKnob,
                  { transform: [{ translateX: slideAnim }] },
                ]}
                {...panResponder.panHandlers}
              >
                <View style={styles.knobInner} pointerEvents="none">
                  <Feather name="chevron-right" size={22} color={colors.surface} />
                </View>
              </Animated.View>

              <TouchableOpacity
                style={styles.sliderTextTouch}
                onPress={() => setIsAttendanceModalOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.sliderText} numberOfLines={1}>
                  {isCheckedIn
                    ? `${punchTimeFormatted ? `In at ${punchTimeFormatted}` : "Shift active"} · Slide to Punch Out`
                    : "Slide to punch in"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick Add Chips (Horizontal Scroll) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <TouchableOpacity
            style={styles.chipPill}
            onPress={() => handleCardPress("new_doctor_visit")}
            activeOpacity={0.7}
          >
            <Feather name="plus" size={15} color={colors.accentRed} />
            <Text style={styles.chipText}>New Doctor</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.chipPill}
            onPress={() => handleCardPress("new_chemist_visit")}
            activeOpacity={0.7}
          >
            <Feather name="plus" size={15} color={colors.accentRed} />
            <Text style={styles.chipText}>New Chemist</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.chipPill}
            onPress={() => handleCardPress("new_stockist_visit")}
            activeOpacity={0.7}
          >
            <Feather name="plus" size={15} color={colors.accentRed} />
            <Text style={styles.chipText}>New Stockist</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.chipPill}
            onPress={() => handleCardPress("new_order")}
            activeOpacity={0.7}
          >
            <Feather name="plus" size={15} color={colors.accentRed} />
            <Text style={styles.chipText}>New Order</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Section: Start a visit (Bento Style) */}
        <Text style={styles.bentoSectionTitle}>Start a visit</Text>
        <View style={styles.bentoRow}>
          {/* Large Tall Pale Blue Card: Doctor Visit */}
          <TouchableOpacity
            style={styles.tallDoctorCard}
            onPress={() => handleCardPress("doctor_visit")}
            activeOpacity={0.8}
          >
            <View style={styles.doctorIconBox}>
              <Feather name="user" size={24} color={colors.surface} />
            </View>
            <Text style={styles.tallCardTitle}>Doctor{"\n"}Visit</Text>
          </TouchableOpacity>

          {/* Right Stacked Column: Chemist & Stockist */}
          <View style={styles.stackedColumn}>
            {/* Chemist Visit Tile */}
            <TouchableOpacity
              style={styles.chemistCard}
              onPress={() => handleCardPress("chemist_visit")}
              activeOpacity={0.8}
            >
              <View style={styles.chemistIconBox}>
                <Feather name="shopping-bag" size={18} color={colors.surface} />
              </View>
              <Text style={styles.stackedCardTitle} numberOfLines={2}>
                Chemist Visit
              </Text>
            </TouchableOpacity>

            {/* Stockist Visit Tile */}
            <TouchableOpacity
              style={styles.stockistCard}
              onPress={() => handleCardPress("stockist_visit")}
              activeOpacity={0.8}
            >
              <View style={styles.stockistIconBox}>
                <Feather name="box" size={18} color={colors.surface} />
              </View>
              <Text style={styles.stackedCardTitle} numberOfLines={2}>
                Stockist Visit
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section: Workspace Hub (Approvals, Team/Customers, Tasks, Plan, Reports, Profile) */}
        <Text style={styles.sectionHeaderTitle}>Workspace Hub</Text>
        <View style={styles.workspaceRow}>
          <TouchableOpacity
            style={styles.workspaceCard}
            onPress={() => navigation.navigate("Approvals" as any)}
            activeOpacity={0.8}
            accessibilityLabel="Open Approvals"
          >
            <View style={[styles.workspaceIconBox, { backgroundColor: colors.bluePastel }]}>
              <Feather name="check-circle" size={22} color={colors.brandBlue} />
            </View>
            <Text style={styles.workspaceCardTitle}>Approvals</Text>
            <Text style={styles.workspaceCardSubtitle}>Pending requests</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.workspaceCard}
            onPress={() =>
              navigation.navigate(user?.role === "MR" ? ("Customers" as any) : ("Team" as any))
            }
            activeOpacity={0.8}
            accessibilityLabel={user?.role === "MR" ? "Open Customers Directory" : "Open My Team"}
          >
            <View style={[styles.workspaceIconBox, { backgroundColor: colors.tealPastel }]}>
              <Feather
                name={user?.role === "MR" ? "users" : "user-check"}
                size={22}
                color={colors.teal}
              />
            </View>
            <Text style={styles.workspaceCardTitle}>
              {user?.role === "MR" ? "Customers" : "My Team"}
            </Text>
            <Text style={styles.workspaceCardSubtitle}>
              {user?.role === "MR" ? "Doctors & chemists" : "Roster & staff"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.workspaceRow}>
          <TouchableOpacity
            style={styles.workspaceCard}
            onPress={() => navigation.navigate("Tasks" as any)}
            activeOpacity={0.8}
            accessibilityLabel="Open Daily Tasks"
          >
            <View style={[styles.workspaceIconBox, { backgroundColor: colors.orangePastel }]}>
              <Feather name="check-square" size={22} color={colors.orange} />
            </View>
            <Text style={styles.workspaceCardTitle}>Tasks</Text>
            <Text style={styles.workspaceCardSubtitle}>Daily assignments</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.workspaceCard}
            onPress={() => navigation.navigate("Plan" as any)}
            activeOpacity={0.8}
            accessibilityLabel="Open Plan and Visits"
          >
            <View style={[styles.workspaceIconBox, { backgroundColor: colors.purplePastel }]}>
              <Feather name="calendar" size={22} color={colors.purple} />
            </View>
            <Text style={styles.workspaceCardTitle}>Visits & Plan</Text>
            <Text style={styles.workspaceCardSubtitle}>Daily schedule</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.workspaceRow}>
          <TouchableOpacity
            style={styles.workspaceCard}
            onPress={() => navigation.navigate(ROUTES.ReportsCatalog as any)}
            activeOpacity={0.8}
            accessibilityLabel="Open Reports"
          >
            <View style={[styles.workspaceIconBox, { backgroundColor: colors.tealPastel }]}>
              <Feather name="bar-chart-2" size={22} color={colors.teal} />
            </View>
            <Text style={styles.workspaceCardTitle}>Reports</Text>
            <Text style={styles.workspaceCardSubtitle}>Analytics & stats</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.workspaceCard}
            onPress={() => navigation.navigate("Profile" as any)}
            activeOpacity={0.8}
            accessibilityLabel="Open Profile and Settings"
          >
            <View style={[styles.workspaceIconBox, { backgroundColor: colors.bluePastel }]}>
              <Feather name="user" size={22} color={colors.brandBlue} />
            </View>
            <Text style={styles.workspaceCardTitle}>Profile</Text>
            <Text style={styles.workspaceCardSubtitle}>Account & settings</Text>
          </TouchableOpacity>
        </View>

        {/* Section: More */}
        <View style={styles.moreHeaderRow}>
          <Text style={styles.moreSectionTitle}>More</Text>
          <TouchableOpacity
            onPress={() => setShowAllModules((prev) => !prev)}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllText}>
              {showAllModules ? "Show less" : "See all"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4-Column Grid with Circular/Rounded Line Icon Tiles */}
        <View style={styles.moreGrid}>
          <TouchableOpacity
            style={styles.iconTileItem}
            onPress={() => handleCardPress("deviation")}
            activeOpacity={0.75}
          >
            <View style={styles.roundIconPlate}>
              <Feather name="alert-triangle" size={22} color={colors.accentRed} />
            </View>
            <Text style={styles.iconTileLabel}>Deviation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconTileItem}
            onPress={() => handleCardPress("meeting")}
            activeOpacity={0.75}
          >
            <View style={styles.roundIconPlate}>
              <Feather name="users" size={22} color={colors.purple} />
            </View>
            <Text style={styles.iconTileLabel}>Meeting</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconTileItem}
            onPress={() => handleCardPress("tour_plan")}
            activeOpacity={0.75}
          >
            <View style={styles.roundIconPlate}>
              <Feather name="calendar" size={22} color={colors.brandBlue} />
            </View>
            <Text style={styles.iconTileLabel}>Tour Plan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconTileItem}
            onPress={() => handleCardPress("manage_leave")}
            activeOpacity={0.75}
          >
            <View style={styles.roundIconPlate}>
              <Feather name="calendar" size={22} color={colors.accentRed} />
            </View>
            <Text style={styles.iconTileLabel}>Leave</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconTileItem}
            onPress={() => handleCardPress("route_map")}
            activeOpacity={0.75}
          >
            <View style={styles.roundIconPlate}>
              <Feather name="map" size={22} color={colors.teal} />
            </View>
            <Text style={styles.iconTileLabel}>Route Map</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconTileItem}
            onPress={() => handleCardPress("primary_sales")}
            activeOpacity={0.75}
          >
            <View style={styles.roundIconPlate}>
              <Feather name="bar-chart-2" size={22} color={colors.navy} />
            </View>
            <Text style={styles.iconTileLabel}>Sales</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconTileItem}
            onPress={() => handleCardPress("credit_note")}
            activeOpacity={0.75}
          >
            <View style={styles.roundIconPlate}>
              <Feather name="file-text" size={22} color={colors.orange} />
            </View>
            <Text style={styles.iconTileLabel}>Credit Note</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconTileItem}
            onPress={() => handleCardPress("standard_route_chart")}
            activeOpacity={0.75}
          >
            <View style={styles.roundIconPlate}>
              <Feather name="share-2" size={22} color={colors.purple} />
            </View>
            <Text style={styles.iconTileLabel}>Std Route</Text>
          </TouchableOpacity>
        </View>

        {/* Collapsible Additional Modules */}
        {showAllModules && (
          <View style={styles.moreGrid}>
            <TouchableOpacity
              style={styles.iconTileItem}
              onPress={() => handleCardPress("employee_live_tracker")}
              activeOpacity={0.75}
            >
              <View style={styles.roundIconPlate}>
                <Feather name="navigation" size={22} color={colors.teal} />
              </View>
              <Text style={styles.iconTileLabel}>Tracker</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconTileItem}
              onPress={() => handleCardPress("sms")}
              activeOpacity={0.75}
            >
              <View style={styles.roundIconPlate}>
                <Feather name="message-square" size={22} color={colors.navy} />
              </View>
              <Text style={styles.iconTileLabel}>SMS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconTileItem}
              onPress={() => handleCardPress("product_comparison")}
              activeOpacity={0.75}
            >
              <View style={styles.roundIconPlate}>
                <Feather name="layers" size={22} color={colors.purple} />
              </View>
              <Text style={styles.iconTileLabel}>Compare</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconTileItem}
              onPress={() => handleCardPress("induction")}
              activeOpacity={0.75}
            >
              <View style={styles.roundIconPlate}>
                <Feather name="award" size={22} color={colors.orange} />
              </View>
              <Text style={styles.iconTileLabel}>Induction</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Slide-Out Drawer Menu */}
      <MrBuddyDrawer
        visible={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSelectAction={handleDrawerAction}
        activeTerritory={activeTerritory}
      />

      {/* Punch In / Attendance Modal */}
      <BiometricAttendanceModal
        visible={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        onAttendanceUpdated={loadAttendanceAndStats}
        onPunchOutSuccess={() => navigation.navigate(ROUTES.ExpenseAdd as any)}
      />

      {/* Change Territory Modal */}
      <ChangeTerritoryModal
        visible={isTerritoryModalOpen}
        onClose={() => setIsTerritoryModalOpen(false)}
        currentTerritory={activeTerritory}
        onSelectTerritory={(terr) => setActiveTerritory(terr)}
      />

      {/* Quick Action Sub-Modals */}
      <CreditNoteModal visible={isCreditNoteOpen} onClose={() => setIsCreditNoteOpen(false)} />
      <PrimarySalesModal visible={isPrimarySalesOpen} onClose={() => setIsPrimarySalesOpen(false)} />
      <SecondarySalesModal visible={isSecondarySalesOpen} onClose={() => setIsSecondarySalesOpen(false)} />
      <SampleReceiveModal visible={isSampleReceiveOpen} onClose={() => setIsSampleReceiveOpen(false)} />
      <DoctorBusinessModal visible={isDoctorBusinessOpen} onClose={() => setIsDoctorBusinessOpen(false)} />
      <InductionModal visible={isInductionOpen} onClose={() => setIsInductionOpen(false)} />
      <WhatsNewModal visible={isWhatsNewOpen} onClose={() => setIsWhatsNewOpen(false)} />
      <SMSBroadcastModal visible={isSMSOpen} onClose={() => setIsSMSOpen(false)} />
      <EmployeeLiveTrackerModal visible={isLiveTrackerOpen} onClose={() => setIsLiveTrackerOpen(false)} />

      {/* Products Catalog Modal */}
      <ProductsCatalogScreen visible={isProductsOpen} onClose={() => setIsProductsOpen(false)} />

      {/* Orders Screen Modal */}
      <OrdersScreen visible={isOrdersOpen} onClose={() => setIsOrdersOpen(false)} />

      {/* Notifications Modal */}
      <NotificationsModal visible={isNotifsOpen} onClose={() => setIsNotifsOpen(false)} />

      {/* Floating "Please PunchIn to Proceed" Toast Banner */}
      {showPunchInToast && (
        <View style={styles.floatingToastOverlay} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.floatingToastPill}
            activeOpacity={0.85}
            onPress={() => {
              setShowPunchInToast(false);
              setIsAttendanceModalOpen(true);
            }}
          >
            <Text style={styles.floatingToastText}>Please PunchIn to Proceed</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    ...typography.heading,
    fontSize: 16,
    fontWeight: "800",
    color: colors.surface,
  },
  userCol: {
    justifyContent: "center",
  },
  greetingDate: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "500",
  },
  userNameText: {
    ...typography.heading,
    fontSize: 18,
    fontWeight: "800",
    color: colors.textInk,
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
    position: "relative",
    ...shadows.soft,
  },
  unreadDot: {
    position: "absolute",
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentRed,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: colors.navy,
    borderRadius: 28,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  heroLeftCol: {
    flex: 1,
  },
  heroTerritoryLabel: {
    ...typography.label,
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  callsRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: spacing.sm,
  },
  callsBigNumber: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "800",
    color: colors.surface,
  },
  callsTotalTarget: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.8)",
  },
  progressTrack: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: radii.full,
    width: "80%",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.surface,
    borderRadius: radii.full,
  },
  progressRingOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 6,
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderTopColor: colors.surface,
    borderRightColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  progressRingInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  progressRingPercent: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.surface,
  },
  sliderCapsule: {
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    position: "relative",
  },
  shiftDoneCapsule: {
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(16, 185, 129, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(74, 222, 128, 0.32)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  shiftDoneLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  shiftDoneBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#4ADE80",
    alignItems: "center",
    justifyContent: "center",
  },
  shiftDoneTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ECFDF5",
  },
  shiftDoneTimes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  shiftTimeItem: {
    alignItems: "flex-end",
  },
  shiftTimeLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "#86EFAC",
  },
  shiftTimeValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  shiftTimeDivider: {
    width: 1,
    height: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  sliderKnob: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentRed,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    ...shadows.soft,
  },
  knobInner: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  sliderTextTouch: {
    position: "absolute",
    left: 54,
    right: 14,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  sliderText: {
    ...typography.button,
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface,
  },
  chipsRow: {
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  chipPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.soft,
  },
  chipText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: "700",
    color: colors.textInk,
    marginLeft: 6,
  },
  bentoSectionTitle: {
    ...typography.heading,
    fontSize: 18,
    fontWeight: "800",
    color: colors.textInk,
    marginBottom: spacing.md,
  },
  bentoRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  tallDoctorCard: {
    flex: 1,
    backgroundColor: colors.bluePastel,
    borderRadius: 24,
    padding: spacing.lg,
    minHeight: 180,
    justifyContent: "space-between",
  },
  doctorIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  tallCardTitle: {
    ...typography.heading,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "800",
    color: colors.textInk,
  },
  stackedColumn: {
    flex: 1,
    gap: spacing.md,
  },
  chemistCard: {
    flex: 1,
    backgroundColor: colors.tealPastel,
    borderRadius: 22,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  chemistIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm + 2,
    flexShrink: 0,
  },
  stockistCard: {
    flex: 1,
    backgroundColor: colors.orangePastel,
    borderRadius: 22,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  stockistIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.orange,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm + 2,
    flexShrink: 0,
  },
  stackedCardTitle: {
    flex: 1,
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    color: colors.textInk,
  },
  sectionHeaderTitle: {
    ...typography.heading,
    fontSize: 18,
    fontWeight: "800",
    color: colors.textInk,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  workspaceRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  workspaceCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md + 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.soft,
  },
  workspaceIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  workspaceCardTitle: {
    ...typography.subheading,
    fontSize: 15,
    fontWeight: "700",
    color: colors.textInk,
  },
  workspaceCardSubtitle: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  moreHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  moreSectionTitle: {
    ...typography.heading,
    fontSize: 18,
    fontWeight: "800",
    color: colors.textInk,
  },
  seeAllText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: "700",
    color: colors.brandBlue,
  },
  moreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginHorizontal: -6,
  },
  iconTileItem: {
    width: "25%",
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: spacing.lg,
  },
  roundIconPlate: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    ...shadows.soft,
  },
  iconTileLabel: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: "600",
    color: colors.textInk,
    textAlign: "center",
  },
  floatingToastOverlay: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingToastPill: {
    backgroundColor: colors.accentRed,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.full,
    ...shadows.sheet,
  },
  floatingToastText: {
    ...typography.button,
    fontSize: 13,
    color: colors.surface,
    fontWeight: "700",
  },
});
