import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ROUTES } from "../../../navigation/routes";

interface MrQuickActionsGridProps {
  isCheckedIn: boolean;
  onRequirePunchIn: (action: () => void) => void;
  navigation?: any;
  onOpenProducts: () => void;
  onOpenOrders: () => void;
}

export function MrQuickActionsGrid({
  isCheckedIn,
  onRequirePunchIn,
  navigation,
  onOpenProducts,
  onOpenOrders,
}: MrQuickActionsGridProps) {
  return (
    <View style={styles.quickActionsSection}>
      <View style={styles.quickActionsHeaderRow}>
        <Text style={styles.quickActionsTitle}>Quick Actions</Text>
        <Text style={styles.quickActionsSubtitle}>Standard Ops</Text>
      </View>

      <View style={styles.quickActionsGrid}>
        {/* Tile 1: New Visit Report */}
        <TouchableOpacity
          style={[styles.actionTile, !isCheckedIn && styles.actionTileLocked]}
          activeOpacity={0.8}
          onPress={() => {
            onRequirePunchIn(() => {
              if (navigation) navigation.navigate(ROUTES.DcrForm);
            });
          }}
        >
          <View style={styles.tileLeft}>
            <View style={[styles.tileIconCircle, { backgroundColor: "#D1FAE5" }]}>
              <Ionicons name="clipboard-outline" size={20} color="#059669" />
            </View>
            <Text style={styles.tileTitle}>New Visit Report</Text>
          </View>
          {!isCheckedIn ? (
            <View style={styles.lockTag}>
              <Ionicons name="lock-closed" size={12} color="#DC2626" />
              <Text style={styles.lockTagText}>Locked</Text>
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          )}
        </TouchableOpacity>

        {/* Tile 2: Plan Tour / Visit */}
        <TouchableOpacity
          style={[styles.actionTile, !isCheckedIn && styles.actionTileLocked]}
          activeOpacity={0.8}
          onPress={() => {
            onRequirePunchIn(() => {
              if (navigation) navigation.navigate(ROUTES.TourPlanner);
            });
          }}
        >
          <View style={styles.tileLeft}>
            <View style={[styles.tileIconCircle, { backgroundColor: "#DBEAFE" }]}>
              <Ionicons name="calendar-outline" size={20} color="#2563EB" />
            </View>
            <Text style={styles.tileTitle}>Plan Tour / TP</Text>
          </View>
          {!isCheckedIn ? (
            <View style={styles.lockTag}>
              <Ionicons name="lock-closed" size={12} color="#DC2626" />
              <Text style={styles.lockTagText}>Locked</Text>
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          )}
        </TouchableOpacity>

        {/* Tile 3: Add Expense */}
        <TouchableOpacity
          style={[styles.actionTile, !isCheckedIn && styles.actionTileLocked]}
          activeOpacity={0.8}
          onPress={() => {
            onRequirePunchIn(() => {
              if (navigation) navigation.navigate(ROUTES.ExpenseList);
            });
          }}
        >
          <View style={styles.tileLeft}>
            <View style={[styles.tileIconCircle, { backgroundColor: "#FEF3C7" }]}>
              <Ionicons name="receipt-outline" size={20} color="#D97706" />
            </View>
            <Text style={styles.tileTitle}>Add Expense</Text>
          </View>
          {!isCheckedIn ? (
            <View style={styles.lockTag}>
              <Ionicons name="lock-closed" size={12} color="#DC2626" />
              <Text style={styles.lockTagText}>Locked</Text>
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          )}
        </TouchableOpacity>

        {/* Tile 4: Apply Leave */}
        <TouchableOpacity
          style={[styles.actionTile, !isCheckedIn && styles.actionTileLocked]}
          activeOpacity={0.8}
          onPress={() => {
            onRequirePunchIn(() => {
              if (navigation) navigation.navigate(ROUTES.LeaveList);
            });
          }}
        >
          <View style={styles.tileLeft}>
            <View style={[styles.tileIconCircle, { backgroundColor: "#FEE2E2" }]}>
              <Ionicons name="calendar-clear-outline" size={20} color="#DC2626" />
            </View>
            <Text style={styles.tileTitle}>Apply Leave</Text>
          </View>
          {!isCheckedIn ? (
            <View style={styles.lockTag}>
              <Ionicons name="lock-closed" size={12} color="#DC2626" />
              <Text style={styles.lockTagText}>Locked</Text>
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          )}
        </TouchableOpacity>

        {/* Tile 5: Products & E-Detailing */}
        <TouchableOpacity
          style={[styles.actionTile, !isCheckedIn && styles.actionTileLocked]}
          activeOpacity={0.8}
          onPress={() => {
            onRequirePunchIn(() => {
              onOpenProducts();
            });
          }}
        >
          <View style={styles.tileLeft}>
            <View style={[styles.tileIconCircle, { backgroundColor: "#E0E7FF" }]}>
              <Ionicons name="tablet-landscape-outline" size={20} color="#4F46E5" />
            </View>
            <Text style={styles.tileTitle}>Products & E-Detailing</Text>
          </View>
          {!isCheckedIn ? (
            <View style={styles.lockTag}>
              <Ionicons name="lock-closed" size={12} color="#DC2626" />
              <Text style={styles.lockTagText}>Locked</Text>
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          )}
        </TouchableOpacity>

        {/* Tile 6: My Orders / POB */}
        <TouchableOpacity
          style={[styles.actionTile, !isCheckedIn && styles.actionTileLocked]}
          activeOpacity={0.8}
          onPress={() => {
            onRequirePunchIn(() => {
              onOpenOrders();
            });
          }}
        >
          <View style={styles.tileLeft}>
            <View style={[styles.tileIconCircle, { backgroundColor: "#CCFBF1" }]}>
              <Ionicons name="bag-handle-outline" size={20} color="#0D9488" />
            </View>
            <Text style={styles.tileTitle}>My Orders / POB</Text>
          </View>
          {!isCheckedIn ? (
            <View style={styles.lockTag}>
              <Ionicons name="lock-closed" size={12} color="#DC2626" />
              <Text style={styles.lockTagText}>Locked</Text>
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          )}
        </TouchableOpacity>

        {/* Tile 7: Tasks & Reminders */}
        <TouchableOpacity
          style={[styles.actionTile, !isCheckedIn && styles.actionTileLocked]}
          activeOpacity={0.8}
          onPress={() => {
            onRequirePunchIn(() => {
              if (navigation) {
                navigation.navigate("Tasks");
              }
            });
          }}
        >
          <View style={styles.tileLeft}>
            <View style={[styles.tileIconCircle, { backgroundColor: "#EDE9FE" }]}>
              <Ionicons name="checkbox-outline" size={20} color="#7C3AED" />
            </View>
            <Text style={styles.tileTitle}>Tasks & Reminders</Text>
          </View>
          {!isCheckedIn ? (
            <View style={styles.lockTag}>
              <Ionicons name="lock-closed" size={12} color="#DC2626" />
              <Text style={styles.lockTagText}>Locked</Text>
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  actionTileLocked: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    opacity: 0.85,
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
  lockTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lockTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#DC2626",
  },
});

