import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PlannedVisitDto } from "../../dcr/api/dcrApi";
import { ROUTES } from "../../../navigation/routes";

interface MrDailyVisitTargetCardProps {
  totalPlanned: number;
  totalCompleted: number;
  totalPending: number;
  donePercent: number;
  nextVisit: PlannedVisitDto | null;
  onRequirePunchIn: (action: () => void) => void;
  navigation?: any;
}

export function MrDailyVisitTargetCard({
  totalPlanned,
  totalCompleted,
  totalPending,
  donePercent,
  nextVisit,
  onRequirePunchIn,
  navigation,
}: MrDailyVisitTargetCardProps) {
  return (
    <>
      {/* 2. Today's Visit Target Card */}
      <View style={styles.cardContainer}>
        <View style={styles.targetHeaderRow}>
          <View>
            <Text style={styles.targetTitle}>Today's Visit Target</Text>
            <Text style={styles.targetSubtitle}>DCR Route: Dadar West & Prabhadevi</Text>
          </View>
          <View style={styles.donePill}>
            <Text style={styles.donePillText}>{donePercent}% Done</Text>
          </View>
        </View>

        {/* 3 Metrics Boxes in a row */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCardBlue}>
            <Text style={styles.metricValBlue}>{totalPlanned}</Text>
            <Text style={styles.metricLblBlue}>Planned</Text>
          </View>

          <View style={styles.metricCardGreen}>
            <Text style={styles.metricValGreen}>{totalCompleted}</Text>
            <Text style={styles.metricLblGreen}>Done</Text>
          </View>

          <View style={styles.metricCardYellow}>
            <Text style={styles.metricValYellow}>{totalPending}</Text>
            <Text style={styles.metricLblYellow}>Pending</Text>
          </View>
        </View>

        {/* Dual-color Progress Bar */}
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.min(100, Math.max(10, donePercent))}%` },
            ]}
          />
        </View>

        {/* Sub Breakdown */}
        <View style={styles.breakdownRow}>
          <View style={styles.breakdownItem}>
            <Ionicons name="medkit-outline" size={14} color="#047857" />
            <Text style={styles.breakdownText}>Primary Doctors: 4/5</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Ionicons name="business-outline" size={14} color="#047857" />
            <Text style={styles.breakdownText}>Chemists/Stockists: 2/2</Text>
          </View>
        </View>
      </View>

      {/* 3. NEXT UP Customer Call Card */}
      {nextVisit ? (
        <View style={[styles.cardContainer, styles.nextUpCard]}>
          <View style={styles.nextUpHeaderRow}>
            <View style={styles.timeTagRow}>
              <Ionicons name="time-outline" size={14} color="#475569" />
              <Text style={styles.nextUpTimeText}>NEXT UP SCHEDULED</Text>
            </View>
            <View style={styles.confirmedPill}>
              <Ionicons name="checkmark" size={12} color="#047857" />
              <Text style={styles.confirmedPillText}>Planned</Text>
            </View>
          </View>

          <View style={styles.doctorInfoRow}>
            <Text style={styles.doctorNameText}>{nextVisit.customer_name || "Customer Call"}</Text>
            <View style={styles.specialtyPill}>
              <Text style={styles.specialtyPillText}>{nextVisit.customer_type || "Customer"}</Text>
            </View>
          </View>

          {/* Action Row */}
          <View style={styles.nextUpActionsRow}>
            <TouchableOpacity
              style={styles.startVisitBtn}
              activeOpacity={0.85}
              onPress={() => {
                onRequirePunchIn(() => {
                  if (navigation) {
                    navigation.navigate(ROUTES.DcrForm, {
                      initialPlannedVisitId: nextVisit.id,
                      initialCustomerType: nextVisit.customer_type,
                      initialCustomerId: nextVisit.doctor_id || undefined,
                    });
                  }
                });
              }}
            >
              <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" />
              <Text style={styles.startVisitBtnText}>Start Visit Call</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={[styles.cardContainer, styles.nextUpCard, { alignItems: "center", paddingVertical: 20 }]}>
          <Ionicons name="calendar-outline" size={28} color="#94A3B8" />
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#475569", marginTop: 8 }}>
            No Pending Planned Visits Today
          </Text>
          <Text style={{ fontSize: 12, color: "#94A3B8", marginTop: 4, textAlign: "center", paddingHorizontal: 16 }}>
            All scheduled field calls are complete or none are planned for this tour cycle.
          </Text>
          <TouchableOpacity
            style={[styles.startVisitBtn, { marginTop: 14, width: "100%", justifyContent: "center" }]}
            onPress={() => {
              onRequirePunchIn(() => {
                if (navigation) navigation.navigate("Plan");
              });
            }}
          >
            <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
            <Text style={styles.startVisitBtnText}>Plan New Visits</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  targetHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  targetTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  targetSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  donePill: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  donePillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#047857",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  metricCardBlue: {
    flex: 1,
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  metricValBlue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1D4ED8",
  },
  metricLblBlue: {
    fontSize: 11,
    fontWeight: "600",
    color: "#3B82F6",
    marginTop: 2,
  },
  metricCardGreen: {
    flex: 1,
    backgroundColor: "#ECFDF5",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  metricValGreen: {
    fontSize: 18,
    fontWeight: "800",
    color: "#047857",
  },
  metricLblGreen: {
    fontSize: 11,
    fontWeight: "600",
    color: "#10B981",
    marginTop: 2,
  },
  metricCardYellow: {
    flex: 1,
    backgroundColor: "#FFFBEB",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  metricValYellow: {
    fontSize: 18,
    fontWeight: "800",
    color: "#B45309",
  },
  metricLblYellow: {
    fontSize: 11,
    fontWeight: "600",
    color: "#F59E0B",
    marginTop: 2,
  },
  progressBarBg: {
    height: 7,
    borderRadius: 4,
    backgroundColor: "#FDE68A",
    overflow: "hidden",
    marginBottom: 10,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#0D5C46",
    borderRadius: 4,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  breakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  breakdownText: {
    fontSize: 11,
    color: "#334155",
    fontWeight: "500",
  },
  nextUpCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#059669",
  },
  nextUpHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  timeTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  nextUpTimeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    letterSpacing: 0.5,
  },
  confirmedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  confirmedPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#047857",
  },
  doctorInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  doctorNameText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  specialtyPill: {
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  specialtyPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#7E22CE",
  },
  nextUpActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  startVisitBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0D5C46",
    borderRadius: 10,
    paddingVertical: 12,
  },
  startVisitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});

