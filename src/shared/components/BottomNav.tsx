import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { colors, radii, spacing, typography } from "../../theme";

export interface BottomNavItem {
  name: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
}

export interface BottomNavProps {
  activeTab: string;
  onTabPress: (name: string) => void;
  items?: BottomNavItem[];
}

export const DEFAULT_MR_TABS: BottomNavItem[] = [
  { name: "Home", label: "Home", icon: "grid" },
  { name: "Visits", label: "Visits", icon: "user-check" },
  { name: "Plan", label: "Plan", icon: "calendar" },
  { name: "Reports", label: "Reports", icon: "bar-chart-2" },
  { name: "More", label: "More", icon: "menu" },
];

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabPress,
  items = DEFAULT_MR_TABS,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 8) },
      ]}
    >
      {items.map((item) => {
        const isActive = activeTab === item.name;
        return (
          <TouchableOpacity
            key={item.name}
            style={styles.tabButton}
            onPress={() => onTabPress(item.name)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={item.label}
          >
            <View
              style={[
                styles.iconWrap,
                isActive && styles.iconWrapActive,
              ]}
            >
              <Feather
                name={item.icon}
                size={20}
                color={isActive ? colors.navy : colors.textFaint}
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
                isActive ? styles.tabLabelActive : styles.tabLabelInactive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 8,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  iconWrap: {
    width: 36,
    height: 28,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: colors.bluePastel,
  },
  tabLabel: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 2,
  },
  tabLabelActive: {
    fontFamily: typography.caption.fontFamily,
    fontWeight: "700",
    color: colors.navy,
  },
  tabLabelInactive: {
    fontFamily: typography.caption.fontFamily,
    fontWeight: "500",
    color: colors.textFaint,
  },
});
