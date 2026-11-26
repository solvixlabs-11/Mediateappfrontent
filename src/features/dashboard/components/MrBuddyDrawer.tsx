import React, { useEffect, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuthStore } from "../../auth/store";
import { apiClient } from "../../../api/client";
import { colors, radii, shadows, spacing, typography } from "../../../theme";
import appConfig from "../../../../app.json";

export interface MrBuddyDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSelectAction: (action: string) => void;
  activeTerritory: string;
}

interface DrawerMenuItem {
  key: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
}

const DEFAULT_DRAWER_ITEMS: DrawerMenuItem[] = [
  { key: "change_territory", label: "Change Territory", icon: "map" },
  { key: "my_visits", label: "My Visits", icon: "user" },
  { key: "reports", label: "Reports", icon: "bar-chart-2" },
  { key: "sample_receive", label: "Sample Receive", icon: "box" },
  { key: "reimbursement", label: "Reimbursement", icon: "file-text" },
  { key: "dr_monthly_business", label: "Dr. Monthly Business", icon: "bar-chart" },
  { key: "near_by_me", label: "Near By Me", icon: "map-pin" },
  { key: "employee_route", label: "Employee Route", icon: "share-2" },
  { key: "settings", label: "Settings", icon: "sliders" },
  { key: "whats_new", label: "What's New", icon: "bell" },
];

export function MrBuddyDrawer({
  visible,
  onClose,
  onSelectAction,
  activeTerritory,
}: MrBuddyDrawerProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [activeItemKey, setActiveItemKey] = useState<string>("change_territory");

  const [menuItems, setMenuItems] = useState<DrawerMenuItem[]>(DEFAULT_DRAWER_ITEMS);

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

  useEffect(() => {
    apiClient
      .get<Array<{ key: string; label: string }>>("/api/v1/navigation/mobile-drawer")
      .then((res) => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          // Merge API items with known icons
          const merged = res.data.map((item) => {
            const found = DEFAULT_DRAWER_ITEMS.find((d) => d.key === item.key);
            return {
              key: item.key,
              label: item.label,
              icon: (found ? found.icon : "circle") as keyof typeof Feather.glyphMap,
            };
          });
          setMenuItems(merged);
        }
      })
      .catch(() => {
        // Fallback to default
        setMenuItems(DEFAULT_DRAWER_ITEMS);
      });
  }, []);

  const fullName = user?.fullName || "Representative";
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "MR";

  const userRole = user?.role || "MR";
  const userPhone = user?.phone || "";
  const roleAndPhone = userPhone ? `${userRole} · ${userPhone}` : userRole;
  const appVersion = appConfig?.expo?.version || "1.0.0";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.drawerContainer,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) },
          ]}
        >
          {/* Navy Header Block */}
          <View style={[styles.profileHeader, { paddingTop: Math.max(insets.top + 8, 48) }]}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>

              <View style={styles.nameBlock}>
                <Text style={styles.userName} numberOfLines={1}>
                  {fullName}
                </Text>
                <Text style={styles.rolePhone}>{roleAndPhone}</Text>
              </View>
            </View>

            <Text style={styles.companyName}>MEDIATE HEALTHCARE PVT. LTD.</Text>
          </View>

          {/* Menu Items List */}
          <ScrollView
            style={styles.menuScroll}
            contentContainerStyle={styles.menuScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {menuItems.map((item) => {
              const isActive = activeItemKey === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.menuRow, isActive && styles.menuRowActive]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setActiveItemKey(item.key);
                    onClose();
                    onSelectAction(item.key);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                >
                  <Feather
                    name={item.icon}
                    size={20}
                    color={isActive ? colors.navy : colors.textInk}
                    style={styles.menuIcon}
                  />
                  <Text
                    style={[
                      styles.menuText,
                      isActive && styles.menuTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Divider */}
            <View style={styles.divider} />

            {/* Red Sign Out Link */}
            <TouchableOpacity
              style={styles.signOutBtn}
              activeOpacity={0.7}
              onPress={handleSignOut}
              accessibilityRole="button"
            >
              <Text style={styles.signOutText}>Sign out</Text>
            </TouchableOpacity>

            {/* App Version Info */}
            <Text style={styles.versionText}>
              Mediate MR App · version {appVersion}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.backdrop,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  drawerContainer: {
    width: "80%",
    maxWidth: 320,
    backgroundColor: colors.surface,
    height: "100%",
    ...shadows.sheet,
  },
  profileHeader: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  avatarText: {
    ...typography.heading,
    fontSize: 18,
    fontWeight: "800",
    color: colors.navy,
  },
  nameBlock: {
    flex: 1,
  },
  userName: {
    ...typography.heading,
    fontSize: 17,
    fontWeight: "800",
    color: colors.surface,
  },
  rolePhone: {
    ...typography.caption,
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.75)",
    marginTop: 2,
    fontWeight: "600",
  },
  companyName: {
    ...typography.caption,
    fontSize: 10,
    letterSpacing: 0.8,
    color: "rgba(255, 255, 255, 0.65)",
    fontWeight: "700",
  },
  menuScroll: {
    flex: 1,
  },
  menuScrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    marginBottom: 4,
  },
  menuRowActive: {
    backgroundColor: colors.bluePastel,
  },
  menuIcon: {
    marginRight: spacing.md,
  },
  menuText: {
    ...typography.bodyMedium,
    fontSize: 14,
    color: colors.textInk,
    fontWeight: "600",
  },
  menuTextActive: {
    color: colors.navy,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
    marginHorizontal: spacing.sm,
  },
  signOutBtn: {
    height: 48,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  signOutText: {
    ...typography.bodyMedium,
    fontSize: 14,
    fontWeight: "700",
    color: colors.accentRed,
  },
  versionText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textFaint,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
});
