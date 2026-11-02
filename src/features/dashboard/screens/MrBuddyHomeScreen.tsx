import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
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
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuthStore } from "../../auth/store";
import { attendanceApi, AttendanceDto } from "../../attendance/api/attendanceApi";
import { ROUTES } from "../../../navigation/routes";
import { RootStackParamList } from "../../../navigation/types";
import { MrBuddyCardIcon, MrBuddyCardType } from "../components/MrBuddyCardIcon";
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

interface GridItemDef {
  id: string;
  type: MrBuddyCardType;
  label: string;
}

const GRID_ITEMS: GridItemDef[] = [
  { id: "1", type: "deviation", label: "Deviation" },
  { id: "2", type: "doctor_visit", label: "Doctor Visit" },
  { id: "3", type: "new_doctor_visit", label: "New Doctor Visit" },
  { id: "4", type: "chemist_visit", label: "Chemist Visit" },
  { id: "5", type: "new_chemist_visit", label: "New Chemist Visit" },
  { id: "6", type: "stockist_visit", label: "Stockist Visit" },
  { id: "7", type: "new_stockist_visit", label: "New Stockist Visit" },
  { id: "8", type: "new_order", label: "New Order" },
  { id: "9", type: "manage_leave", label: "Manage Leave" },
  { id: "10", type: "employee_live_tracker", label: "Employee Live Tracker" },
  { id: "11", type: "route_map", label: "Route Map" },
  { id: "12", type: "tour_plan", label: "Tour Plan" },
  { id: "13", type: "primary_sales", label: "Primary Sales" },
  { id: "14", type: "credit_note", label: "Credit Note" },
  { id: "15", type: "secondary_sales", label: "Secondary Sales\n(Chemist)" },
  { id: "16", type: "meeting", label: "Meeting" },
  { id: "17", type: "standard_route_chart", label: "Standard Route Chart" },
  { id: "18", type: "sms", label: "SMS" },
  { id: "19", type: "product_comparison", label: "Product Comparison" },
  { id: "20", type: "credit_note_new", label: "Credit Note New" },
  { id: "21", type: "primary_sales_new", label: "Primary Sales New" },
  { id: "22", type: "dashboard", label: "Dashboard" },
  { id: "23", type: "induction", label: "Induction" },
];

export function MrBuddyHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAuthStore((s) => s.user);

  // States
  const [activeTerritory, setActiveTerritory] = useState("ALL INDIA P");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isTerritoryModalOpen, setIsTerritoryModalOpen] = useState(false);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Attendance Status & Floating Toast
  const [attendance, setAttendance] = useState<AttendanceDto | null>(null);
  const [showPunchInToast, setShowPunchInToast] = useState(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadAttendanceStatus = async () => {
    try {
      const res = await attendanceApi.getToday();
      setAttendance(res);
    } catch {
      setAttendance(null);
    }
  };

  useEffect(() => {
    loadAttendanceStatus();
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
    loadAttendanceStatus();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  }, []);

  // WhatsApp Button Action
  const handleWhatsApp = () => {
    const phone = "918238848764";
    const url = `whatsapp://send?phone=${phone}&text=Hello%20Mediate%20Healthcare%20Support`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(`https://wa.me/${phone}`);
        }
      })
      .catch(() => {
        Alert.alert("WhatsApp Support", `Direct helpline: +${phone}`);
      });
  };

  // Card Tap Handler (Strictly requires Punch In first for fieldwork actions)
  const handleCardPress = (type: MrBuddyCardType) => {
    const isCheckedIn = !!attendance?.check_in_time && !attendance?.check_out_time;

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

  // Drawer Action Handler
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

  const windowWidth = Dimensions.get("window").width;
  const cardWidth = (windowWidth - 36) / 2;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <RNStatusBar barStyle="light-content" backgroundColor="#DC2626" />

      {/* Top Red Header Bar */}
      <View style={styles.headerBar}>
        {/* Left Hamburger Menu */}
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => setIsDrawerOpen(true)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Ionicons name="menu" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Center Territory Title */}
        <TouchableOpacity
          style={styles.headerTitleContainer}
          onPress={() => setIsTerritoryModalOpen(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.headerTitle} numberOfLines={1}>
            {activeTerritory}
          </Text>
        </TouchableOpacity>

        {/* Right Action Icons */}
        <View style={styles.headerRightRow}>
          {/* WhatsApp Button */}
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={handleWhatsApp}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-whatsapp" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Biometric Attendance Punch Button */}
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => setIsAttendanceModalOpen(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="finger-print" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Notification Counter Badge */}
          <TouchableOpacity
            style={styles.headerBadgeButton}
            onPress={() => setIsNotifsOpen(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.headerBadgeText}>1133</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2-Column Card Grid Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={["#DC2626"]}
            tintColor="#DC2626"
          />
        }
      >
        <View style={styles.grid}>
          {GRID_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, { width: cardWidth }]}
              onPress={() => handleCardPress(item.type)}
              activeOpacity={0.75}
            >
              <View style={styles.cardIconWrapper}>
                <MrBuddyCardIcon type={item.type} size={58} />
              </View>
              <Text style={styles.cardLabel} numberOfLines={2}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Slide-Out Drawer Menu */}
      <MrBuddyDrawer
        visible={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSelectAction={handleDrawerAction}
        activeTerritory={activeTerritory}
      />

      {/* Biometric Attendance Quick Punch Modal */}
      <BiometricAttendanceModal
        visible={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        onAttendanceUpdated={loadAttendanceStatus}
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

      {/* Floating "Please PunchIn to Proceed" Toast Banner (Matches MR Buddy screenshot) */}
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
    backgroundColor: "#DC2626",
  },
  headerBar: {
    height: 56,
    backgroundColor: "#DC2626",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  headerIconButton: {
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  headerRightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerBadgeButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 28,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 140,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  cardIconWrapper: {
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
    height: 60,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
    textAlign: "center",
    lineHeight: 18,
  },
  floatingToastOverlay: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    elevation: 10,
  },
  floatingToastPill: {
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  floatingToastText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
