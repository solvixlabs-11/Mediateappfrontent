import React, { ReactNode } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing, typography } from "../theme/tokens";
import { useAuthStore } from "../../features/auth/store";

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  rightAction?: ReactNode;
  rightElement?: ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  showLogo?: boolean;
  roleBadgeText?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  rightAction,
  rightElement,
  showBack,
  onBack,
  showLogo = true,
  roleBadgeText,
}) => {
  const user = useAuthStore((s) => s.user);
  const role = roleBadgeText || user?.role || "MR";
  const actionNode = rightAction || rightElement;

  // Role display badge styling
  const getRoleConfig = () => {
    switch (role) {
      case "ADMIN":
        return {
          label: "ADMIN",
          bg: "#ECFDF5",
          border: "#A7F3D0",
          text: "#047857",
        };
      case "MANAGER":
        return {
          label: "MANAGER",
          bg: "#EEF2FF",
          border: "#C7D2FE",
          text: "#4338CA",
        };
      default:
        return {
          label: "MR FIELD",
          bg: "#EBF3FC",
          border: "#CFE2F8",
          text: "#1B64DA",
        };
    }
  };

  const roleConfig = getRoleConfig();

  // If in detail mode with back button
  if (showBack) {
    return (
      <View style={styles.headerBackMode}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.navy} />
        </TouchableOpacity>
        <View style={styles.backTitleContainer}>
          {title ? <Text style={styles.title} numberOfLines={1}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
        {actionNode ? <View style={styles.rightAction}>{actionNode}</View> : (
          <Image
            source={require("../../../assets/logo.png")}
            style={styles.smallCornerLogo}
            resizeMode="contain"
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.header}>
      {/* Top Brand Bar: Mediate Logo + Role Badge on Left, Action/Live on Right */}
      <View style={styles.topBrandRow}>
        <View style={styles.brandGroup}>
          {showLogo && (
            <Image
              source={require("../../../assets/logo.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          )}
          <View
            style={[
              styles.roleBadge,
              { backgroundColor: roleConfig.bg, borderColor: roleConfig.border },
            ]}
          >
            <Text style={[styles.roleBadgeText, { color: roleConfig.text }]}>
              {roleConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.topRightArea}>
          {actionNode ? (
            <View style={styles.rightAction}>{actionNode}</View>
          ) : (
            <View style={styles.onlinePill}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlinePillText}>Live</Text>
            </View>
          )}
        </View>
      </View>

      {/* Screen Title & Subtitle Row (if title is provided) */}
      {title ? (
        <View style={styles.titleRow}>
          <View style={styles.titleCol}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: "#E8F0FA",
    shadowColor: "#1B64DA",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  headerBackMode: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#E8F0FA",
    backgroundColor: colors.surface,
  },
  topBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 32,
  },
  brandGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerLogo: {
    width: 104,
    height: 28,
    marginRight: 8,
  },
  smallCornerLogo: {
    width: 72,
    height: 22,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  topRightArea: {
    flexDirection: "row",
    alignItems: "center",
  },
  onlinePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16A34A",
    marginRight: 4,
  },
  onlinePillText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#15803D",
  },
  titleRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleCol: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.navy,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 1,
  },
  backBtn: {
    marginRight: spacing.md,
  },
  backTitleContainer: {
    flex: 1,
  },
  rightAction: {
    marginLeft: spacing.sm,
  },
});
