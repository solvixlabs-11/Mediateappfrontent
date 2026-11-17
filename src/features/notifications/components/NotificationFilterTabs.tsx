import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type FilterType =
  | "ALL"
  | "UNREAD"
  | "APPROVALS"
  | "TASKS"
  | "LEAVE"
  | "EXPENSE"
  | "TOUR"
  | "REMINDERS"
  | "SYSTEM";

interface NotificationFilterTabsProps {
  activeFilter: FilterType;
  onSelectFilter: (filter: FilterType) => void;
  unreadCount: number;
  getFilterCount: (filter: FilterType) => number;
}

const FILTER_ITEMS = [
  { key: "ALL" as const, label: "All" },
  { key: "UNREAD" as const, label: "Unread" },
  { key: "APPROVALS" as const, label: "Approvals" },
  { key: "TASKS" as const, label: "Tasks" },
  { key: "LEAVE" as const, label: "Leave" },
  { key: "EXPENSE" as const, label: "Expense" },
  { key: "TOUR" as const, label: "Tour" },
  { key: "REMINDERS" as const, label: "Reminders" },
  { key: "SYSTEM" as const, label: "System" },
];

export function NotificationFilterTabs({
  activeFilter,
  onSelectFilter,
  unreadCount,
  getFilterCount,
}: NotificationFilterTabsProps) {
  return (
    <View style={styles.filterBarContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipScroll}
      >
        {FILTER_ITEMS.map((chip) => {
          const isSelected = activeFilter === chip.key;
          const count = getFilterCount(chip.key);
          return (
            <TouchableOpacity
              key={chip.key}
              style={[styles.filterChip, isSelected && styles.filterChipActive]}
              onPress={() => onSelectFilter(chip.key)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isSelected && styles.filterChipTextActive,
                ]}
              >
                {chip.key === "UNREAD" ? `Unread (${unreadCount})` : chip.label}
              </Text>
              {chip.key !== "UNREAD" && chip.key !== "ALL" && count > 0 && (
                <View
                  style={[
                    styles.countBubble,
                    isSelected && styles.countBubbleActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.countBubbleText,
                      isSelected && styles.countBubbleTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  filterBarContainer: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EDEEF6",
  },
  filterChipScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDEEF6",
    minHeight: 36,
  },
  filterChipActive: {
    backgroundColor: "#0C5D46",
    borderColor: "#0C5D46",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  countBubble: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  countBubbleActive: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  countBubbleText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  countBubbleTextActive: {
    color: "#FFFFFF",
  },
});

