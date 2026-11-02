import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons } from "@expo/vector-icons";

export type MrBuddyCardType =
  | "deviation"
  | "doctor_visit"
  | "new_doctor_visit"
  | "chemist_visit"
  | "new_chemist_visit"
  | "stockist_visit"
  | "new_stockist_visit"
  | "new_order"
  | "manage_leave"
  | "employee_live_tracker"
  | "route_map"
  | "tour_plan"
  | "primary_sales"
  | "credit_note"
  | "secondary_sales"
  | "meeting"
  | "standard_route_chart"
  | "sms"
  | "product_comparison"
  | "credit_note_new"
  | "primary_sales_new"
  | "dashboard"
  | "induction";

interface MrBuddyCardIconProps {
  type: MrBuddyCardType;
  size?: number;
}

export function MrBuddyCardIcon({ type, size = 64 }: MrBuddyCardIconProps) {
  switch (type) {
    case "deviation":
      // Map with folded terrain and red location pinpoint
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          <View style={styles.mapBase}>
            <Ionicons name="map" size={size * 0.72} color="#475569" />
            <View style={styles.redPinAbsolute}>
              <Ionicons name="location" size={size * 0.44} color="#E11D48" />
            </View>
          </View>
        </View>
      );

    case "doctor_visit":
      // Healthcare duo with stethoscope and medical red cross
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          <View style={[styles.illustrationCircle, { backgroundColor: "#FFF1F2" }]}>
            <FontAwesome5 name="user-md" size={size * 0.48} color="#E11D48" />
            <View style={styles.smallBadgeTopRight}>
              <Ionicons name="heart" size={size * 0.24} color="#E11D48" />
            </View>
          </View>
        </View>
      );

    case "new_doctor_visit":
      // Doctor with plus addition badge
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          <View style={[styles.illustrationCircle, { backgroundColor: "#FEF2F2" }]}>
            <MaterialCommunityIcons name="doctor" size={size * 0.52} color="#DC2626" />
            <View style={styles.plusBadge}>
              <Ionicons name="add-circle" size={size * 0.3} color="#DC2626" />
            </View>
          </View>
        </View>
      );

    case "chemist_visit":
      // Chemist pharmacy shop with pharmacist counter
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          <View style={[styles.illustrationSquare, { backgroundColor: "#FFF7ED" }]}>
            <MaterialCommunityIcons name="storefront" size={size * 0.52} color="#D97706" />
            <View style={styles.chemistBadge}>
              <MaterialCommunityIcons name="pill" size={size * 0.24} color="#DC2626" />
            </View>
          </View>
        </View>
      );

    case "new_chemist_visit":
      // Pharmacy shop with add new chemist action
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          <View style={[styles.illustrationSquare, { backgroundColor: "#F0FDF4" }]}>
            <MaterialIcons name="local-pharmacy" size={size * 0.52} color="#16A34A" />
            <View style={styles.plusBadge}>
              <Ionicons name="add-circle" size={size * 0.3} color="#16A34A" />
            </View>
          </View>
        </View>
      );

    case "stockist_visit":
      // Stockist distributor warehouse building
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          <View style={[styles.illustrationSquare, { backgroundColor: "#F8FAFC" }]}>
            <MaterialCommunityIcons name="warehouse" size={size * 0.54} color="#334155" />
            <View style={styles.smallBadgeBottomRight}>
              <Ionicons name="cube" size={size * 0.22} color="#D97706" />
            </View>
          </View>
        </View>
      );

    case "new_stockist_visit":
      // Add new stockist distributor
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          <View style={[styles.illustrationSquare, { backgroundColor: "#EFF6FF" }]}>
            <MaterialIcons name="business" size={size * 0.52} color="#2563EB" />
            <View style={styles.plusBadge}>
              <Ionicons name="add-circle" size={size * 0.3} color="#2563EB" />
            </View>
          </View>
        </View>
      );

    case "new_order":
      // Order booking store & shopping cart
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          <View style={[styles.illustrationSquare, { backgroundColor: "#FFF1F2" }]}>
            <MaterialCommunityIcons name="office-building" size={size * 0.5} color="#475569" />
            <View style={styles.redBadgeCart}>
              <Ionicons name="cart" size={size * 0.24} color="#FFFFFF" />
            </View>
          </View>
        </View>
      );

    case "manage_leave":
      // Calendar planner with leave request person
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          <View style={[styles.illustrationSquare, { backgroundColor: "#FEF2F2" }]}>
            <Ionicons name="calendar" size={size * 0.5} color="#475569" />
            <View style={styles.personBesideCalendar}>
              <Ionicons name="person" size={size * 0.26} color="#DC2626" />
            </View>
          </View>
        </View>
      );

    case "employee_live_tracker":
      // Globe with GPS pinpoint tracking
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          <View style={[styles.illustrationCircle, { backgroundColor: "#F1F5F9" }]}>
            <Ionicons name="globe-outline" size={size * 0.58} color="#475569" />
            <View style={styles.gpsCenterPin}>
              <Ionicons name="location" size={size * 0.3} color="#DC2626" />
            </View>
          </View>
        </View>
      );

    case "route_map":
      // Route road map with interconnected waypoints
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          <View style={[styles.illustrationSquare, { backgroundColor: "#EEF2FF" }]}>
            <MaterialCommunityIcons name="map-marker-path" size={size * 0.58} color="#4F46E5" />
            <View style={styles.smallBadgeTopRight}>
              <Ionicons name="pin" size={size * 0.22} color="#DC2626" />
            </View>
          </View>
        </View>
      );

    case "tour_plan":
      // Tour plan calendar with business representative
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          <View style={[styles.illustrationSquare, { backgroundColor: "#FFF7ED" }]}>
            <MaterialCommunityIcons name="calendar-check" size={size * 0.52} color="#EA580C" />
            <View style={styles.smallBadgeBottomRight}>
              <Ionicons name="briefcase" size={size * 0.22} color="#334155" />
            </View>
          </View>
        </View>
      );

    case "primary_sales":
      // Sales whiteboard analytics graph with executive
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          <View style={[styles.illustrationSquare, { backgroundColor: "#F8FAFC" }]}>
            <MaterialCommunityIcons name="chart-bar" size={size * 0.54} color="#DC2626" />
            <View style={styles.personBesideChart}>
              <Ionicons name="person" size={size * 0.24} color="#1E293B" />
            </View>
          </View>
        </View>
      );

    case "credit_note":
      // Credit note return invoice document
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          <View style={[styles.illustrationSquare, { backgroundColor: "#F1F5F9" }]}>
            <MaterialCommunityIcons name="file-document-outline" size={size * 0.54} color="#64748B" />
            <View style={styles.swapArrows}>
              <Ionicons name="swap-horizontal" size={size * 0.26} color="#DC2626" />
            </View>
          </View>
        </View>
      );

    case "secondary_sales":
      // Secondary sales chemist chart
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          <View style={[styles.illustrationSquare, { backgroundColor: "#FEF2F2" }]}>
            <MaterialIcons name="trending-up" size={size * 0.52} color="#E11D48" />
            <View style={styles.smallBadgeBottomRight}>
              <MaterialCommunityIcons name="storefront" size={size * 0.24} color="#1E293B" />
            </View>
          </View>
        </View>
      );

    case "meeting":
      // Meeting conference table with delegates
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          <View style={[styles.illustrationSquare, { backgroundColor: "#F0FDF4" }]}>
            <MaterialIcons name="groups" size={size * 0.54} color="#16A34A" />
            <View style={styles.smallBadgeTopRight}>
              <Ionicons name="chatbubbles" size={size * 0.22} color="#DC2626" />
            </View>
          </View>
        </View>
      );

    case "standard_route_chart":
      // Standard route chart dark map navigation
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          <View style={[styles.illustrationSquare, { backgroundColor: "#1E293B" }]}>
            <Ionicons name="navigate-circle" size={size * 0.54} color="#FFFFFF" />
            <View style={styles.redPinAbsolute}>
              <Ionicons name="location" size={size * 0.26} color="#E11D48" />
            </View>
          </View>
        </View>
      );

    case "sms":
      // SMS speech bubble with 3 red dots
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          <View style={[styles.illustrationCircle, { backgroundColor: "#FEF2F2" }]}>
            <Ionicons name="chatbox" size={size * 0.5} color="#E2E8F0" />
            <View style={styles.smsDots}>
              <Ionicons name="ellipsis-horizontal" size={size * 0.3} color="#DC2626" />
            </View>
            <View style={styles.smallBadgeBottomRight}>
              <Ionicons name="person" size={size * 0.22} color="#1E293B" />
            </View>
          </View>
        </View>
      );

    case "product_comparison":
      // Dual product comparison visual
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          <View style={[styles.illustrationSquare, { backgroundColor: "#EFF6FF" }]}>
            <Ionicons name="layers-outline" size={size * 0.52} color="#2563EB" />
            <View style={styles.personBesideChart}>
              <Ionicons name="person" size={size * 0.24} color="#DC2626" />
            </View>
          </View>
        </View>
      );

    case "credit_note_new":
      // New credit note form
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          <View style={[styles.illustrationSquare, { backgroundColor: "#F8FAFC" }]}>
            <MaterialCommunityIcons name="file-chart" size={size * 0.52} color="#64748B" />
            <View style={styles.plusBadge}>
              <Ionicons name="add-circle" size={size * 0.3} color="#DC2626" />
            </View>
          </View>
        </View>
      );

    case "primary_sales_new":
      // New primary sales booking
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          <View style={[styles.illustrationSquare, { backgroundColor: "#FEF2F2" }]}>
            <MaterialCommunityIcons name="chart-box-plus-outline" size={size * 0.54} color="#DC2626" />
            <View style={styles.personBesideChart}>
              <Ionicons name="person" size={size * 0.24} color="#1E293B" />
            </View>
          </View>
        </View>
      );

    case "dashboard":
      // Executive KPI dashboard computer monitor
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          <View style={[styles.illustrationSquare, { backgroundColor: "#F8FAFC" }]}>
            <Ionicons name="desktop-outline" size={size * 0.54} color="#1E293B" />
            <View style={styles.monitorChart}>
              <Ionicons name="stats-chart" size={size * 0.24} color="#DC2626" />
            </View>
          </View>
        </View>
      );

    case "induction":
      // Training presentation board with mentor
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          <View style={[styles.illustrationSquare, { backgroundColor: "#FFFBEB" }]}>
            <MaterialCommunityIcons name="presentation" size={size * 0.52} color="#D97706" />
            <View style={styles.personBesideChart}>
              <Ionicons name="person" size={size * 0.24} color="#DC2626" />
            </View>
          </View>
        </View>
      );

    default:
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          <Ionicons name="cube-outline" size={size * 0.5} color="#64748B" />
        </View>
      );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  illustrationCircle: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  illustrationSquare: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  mapBase: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  redPinAbsolute: {
    position: "absolute",
    top: 4,
    right: 6,
  },
  smallBadgeTopRight: {
    position: "absolute",
    top: 2,
    right: 2,
  },
  smallBadgeBottomRight: {
    position: "absolute",
    bottom: 2,
    right: 2,
  },
  plusBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
  },
  chemistBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    padding: 1,
  },
  redBadgeCart: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "#DC2626",
    borderRadius: 999,
    padding: 3,
  },
  personBesideCalendar: {
    position: "absolute",
    bottom: 2,
    left: 2,
  },
  personBesideChart: {
    position: "absolute",
    bottom: 2,
    right: 2,
  },
  gpsCenterPin: {
    position: "absolute",
    top: "30%",
    left: "35%",
  },
  swapArrows: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  smsDots: {
    position: "absolute",
    top: "32%",
    left: "30%",
  },
  monitorChart: {
    position: "absolute",
    top: "22%",
    left: "30%",
  },
});
