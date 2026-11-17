import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../shared/theme/tokens";

interface MrAttendancePunchCardProps {
  isCheckedIn: boolean;
  isCheckedOut: boolean;
  isPunchLoading: boolean;
  checkInTimeFormatted: string | null;
  onPunchCheckIn: () => void;
  onPunchCheckOut: () => void;
}

export function MrAttendancePunchCard({
  isCheckedIn,
  isCheckedOut,
  isPunchLoading,
  checkInTimeFormatted,
  onPunchCheckIn,
  onPunchCheckOut,
}: MrAttendancePunchCardProps) {
  return (
    <>
      {/* MANDATORY PUNCH-IN GATE BANNER */}
      {!isCheckedIn && (
        <View style={styles.mandatoryPunchBanner}>
          <View style={styles.mandatoryPunchHeader}>
            <View style={styles.lockIconCircle}>
              <Ionicons name="lock-closed" size={20} color="#DC2626" />
            </View>
            <View style={styles.mandatoryPunchTitleCol}>
              <Text style={styles.mandatoryPunchTitle}>FIELD OPERATIONS LOCKED</Text>
              <Text style={styles.mandatoryPunchSubtitle}>
                Daily Punch-In Required Before Any Action
              </Text>
            </View>
          </View>
          <Text style={styles.mandatoryPunchDesc}>
            Field visits, doctor calls, tour planning, commercial orders, and expense entries are locked
            until your daily attendance is recorded. Punch in now with GPS location to unlock operations.
          </Text>
          <TouchableOpacity
            style={styles.mandatoryPunchBtn}
            onPress={onPunchCheckIn}
            disabled={isPunchLoading}
            activeOpacity={0.85}
          >
            {isPunchLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="location" size={18} color="#FFFFFF" />
                <Text style={styles.mandatoryPunchBtnText}>Punch In with GPS Now</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Field Work & Attendance Card */}
      <View style={styles.cardContainer}>
        <View style={styles.fieldWorkHeader}>
          <View style={styles.fieldWorkPill}>
            <Ionicons name="walk" size={14} color="#0D9488" />
            <Text style={styles.fieldWorkPillText}>Field Work</Text>
          </View>

          <View style={styles.checkedInStatusRow}>
            {isCheckedOut ? (
              <>
                <Ionicons name="checkmark-done-circle" size={16} color={colors.navy} />
                <Text style={styles.checkedInText}>Punched Out</Text>
              </>
            ) : isCheckedIn ? (
              <>
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text style={styles.checkedInText}>Checked in {checkInTimeFormatted}</Text>
              </>
            ) : (
              <>
                <Ionicons name="time-outline" size={16} color="#B45309" />
                <Text style={[styles.checkedInText, { color: "#B45309" }]}>Not Checked In</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.fieldWorkDetailsRow}>
          <View style={styles.gpsLocationRow}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#059669" />
            <Text style={styles.gpsLocationText}>
              GPS Locked: <Text style={styles.gpsBold}>Dadar West</Text> (±12m)
            </Text>
          </View>

          <View style={styles.shiftPill}>
            <Text style={styles.shiftPillText}>Shift: 09:00 - 18:30</Text>
          </View>
        </View>

        {/* Punch Button */}
        {!isCheckedIn ? (
          <TouchableOpacity
            style={styles.primaryPunchBtn}
            onPress={onPunchCheckIn}
            disabled={isPunchLoading}
            activeOpacity={0.85}
          >
            {isPunchLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
                <Text style={styles.punchBtnText}>Punch Check-in</Text>
              </>
            )}
          </TouchableOpacity>
        ) : !isCheckedOut ? (
          <TouchableOpacity
            style={styles.primaryPunchBtn}
            onPress={onPunchCheckOut}
            disabled={isPunchLoading}
            activeOpacity={0.85}
          >
            {isPunchLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="exit-outline" size={20} color="#FFFFFF" />
                <Text style={styles.punchBtnText}>Punch Check-out</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.completedPunchBox}>
            <Ionicons name="checkmark-circle" size={18} color="#059669" />
            <Text style={styles.completedPunchText}>Shift Finalized • Daily Work Logged</Text>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  mandatoryPunchBanner: {
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    padding: 14,
    marginBottom: 12,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mandatoryPunchHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  lockIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  mandatoryPunchTitleCol: {
    flex: 1,
  },
  mandatoryPunchTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#991B1B",
    letterSpacing: 0.5,
  },
  mandatoryPunchSubtitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#B91C1C",
    marginTop: 1,
  },
  mandatoryPunchDesc: {
    fontSize: 12,
    color: "#7F1D1D",
    lineHeight: 17,
    marginBottom: 12,
  },
  mandatoryPunchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#DC2626",
    paddingVertical: 11,
    borderRadius: 10,
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  mandatoryPunchBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  fieldWorkHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  fieldWorkPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#E6FFFA",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  fieldWorkPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0D9488",
  },
  checkedInStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  checkedInText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
  },
  fieldWorkDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  gpsLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  gpsLocationText: {
    fontSize: 12,
    color: "#475569",
  },
  gpsBold: {
    fontWeight: "700",
    color: "#0F172A",
  },
  shiftPill: {
    backgroundColor: "#F0F9FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  shiftPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0284C7",
  },
  primaryPunchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0D5C46",
    borderRadius: 10,
    paddingVertical: 12,
  },
  punchBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  completedPunchBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#ECFDF5",
    paddingVertical: 10,
    borderRadius: 8,
  },
  completedPunchText: {
    color: "#047857",
    fontSize: 12,
    fontWeight: "600",
  },
});
