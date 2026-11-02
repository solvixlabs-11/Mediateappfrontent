import React from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../auth/store";
import { colors, spacing, typography } from "../../../shared/theme/tokens";

interface MrBuddyDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSelectAction: (action: string) => void;
  activeTerritory: string;
}

export function MrBuddyDrawer({
  visible,
  onClose,
  onSelectAction,
  activeTerritory,
}: MrBuddyDrawerProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out from Mediate Healthcare?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          onClose();
          await logout();
        },
      },
    ]);
  };

  const menuItems = [
    { key: "change_territory", label: "Change Territory" },
    { key: "my_visits", label: "My Visits" },
    { key: "reports", label: "Reports" },
    { key: "sample_receive", label: "Sample Receive" },
    { key: "reimbursement", label: "Reimbursement" },
    { key: "dr_monthly_business", label: "Dr. Monthly Business" },
    { key: "near_by_me", label: "Near By Me" },
    { key: "settings", label: "Settings" },
    { key: "employee_route", label: "Employee Route" },
    { key: "whats_new", label: "What's New" },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.drawerContainer}>
          {/* Header Profile Section */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarCircle}>
                <Ionicons name="image-outline" size={26} color="#94A3B8" />
              </View>
              <View style={styles.nameBlock}>
                <Text style={styles.companyName} numberOfLines={1}>
                  {user?.fullName ? user.fullName.toUpperCase() : "MEDIATE HEALTHCARE"}
                </Text>
                <Text style={styles.userRole}>
                  {user?.role === "ADMIN"
                    ? "ERP ADMIN"
                    : user?.role === "MANAGER"
                    ? "AREA MANAGER"
                    : "FIELD REPRESENTATIVE"}
                </Text>
              </View>
            </View>

            <Text style={styles.phoneText}>8238848764</Text>
            <Text style={styles.subOrgText}>MEDIATE HEALTHCARE PVT. LTD.</Text>
            <View style={styles.territoryBadge}>
              <Ionicons name="location-sharp" size={12} color="#DC2626" />
              <Text style={styles.territoryBadgeText}>{activeTerritory}</Text>
            </View>
          </View>

          {/* Menu Items List */}
          <ScrollView
            style={styles.menuScroll}
            contentContainerStyle={styles.menuScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => {
                  onClose();
                  onSelectAction(item.key);
                }}
              >
                <Text style={styles.menuItemText}>{item.label}</Text>
              </TouchableOpacity>
            ))}

            {/* Red Sign Out Link */}
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={handleSignOut}
            >
              <Text style={styles.signOutText}>Sign out</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Footer App Info */}
          <View style={styles.drawerFooter}>
            <Text style={styles.footerAppName}>Mediate Buddy</Text>
            <Text style={styles.footerVersion}>version 1.0.63</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  backdrop: {
    flex: 1,
  },
  drawerContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "78%",
    maxWidth: 320,
    backgroundColor: "#FFFFFF",
    elevation: 16,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    display: "flex",
    flexDirection: "column",
  },
  profileHeader: {
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#FAFAFA",
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EEF2F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  nameBlock: {
    flex: 1,
  },
  companyName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    letterSpacing: 0.3,
  },
  userRole: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  phoneText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
    marginBottom: 2,
  },
  subOrgText: {
    fontSize: 11,
    fontWeight: "400",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  territoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "#FEE2E2",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: "flex-start",
    gap: 4,
  },
  territoryBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
  },
  menuScroll: {
    flex: 1,
  },
  menuScrollContent: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  menuItem: {
    paddingVertical: 13,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1E293B",
    letterSpacing: 0.2,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#EF4444",
    letterSpacing: 0.2,
  },
  drawerFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#FAFAFA",
  },
  footerAppName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
  },
  footerVersion: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
});
