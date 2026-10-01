import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AttendanceDto, attendanceApi } from "../api/attendanceApi";
import { colors, radii, spacing, typography } from "../../../shared/theme/tokens";

interface AttendanceCardProps {
  onStatusChanged?: (attendance: AttendanceDto | null) => void;
}

export function AttendanceCard({ onStatusChanged }: AttendanceCardProps) {
  const [attendance, setAttendance] = useState<AttendanceDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchToday = async () => {
    try {
      const data = await attendanceApi.getToday();
      setAttendance(data);
      if (onStatusChanged) onStatusChanged(data);
    } catch (err) {
      console.error("Failed to fetch today attendance:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchToday();
  }, []);

  const handleCheckIn = async () => {
    setIsActionLoading(true);
    try {
      const record = await attendanceApi.checkIn({
        latitude: 19.0760,
        longitude: 72.8777,
        accuracy: 10.0,
        address: "Bandra Kurla Complex, Mumbai",
        remarks: "Started field work",
        client_uuid: `att-in-${Date.now()}`,
      });
      setAttendance(record);
      if (onStatusChanged) onStatusChanged(record);
      Alert.alert("Success", "Attendance Check-in recorded successfully!");
    } catch (err: any) {
      if (err?.response?.status === 409) {
        const today = await attendanceApi.getToday();
        setAttendance(today);
        if (onStatusChanged) onStatusChanged(today);
      } else {
        Alert.alert("Error", err?.response?.data?.detail || "Check-in failed.");
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    Alert.alert(
      "Confirm Check-Out",
      "Are you sure you want to end your daily field calls and check out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Check Out",
          onPress: async () => {
            setIsActionLoading(true);
            try {
              const record = await attendanceApi.checkOut({
                latitude: 19.0765,
                longitude: 72.8780,
                remarks: "Day completed",
              });
              setAttendance(record);
              if (onStatusChanged) onStatusChanged(record);
              Alert.alert("Day Completed", "Check-out recorded successfully.");
            } catch (err: any) {
              Alert.alert("Error", err?.response?.data?.detail || "Check-out failed.");
            } finally {
              setIsActionLoading(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.card, styles.center]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  const isCheckedIn = !!attendance?.check_in_time;
  const isCheckedOut = !!attendance?.check_out_time;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.statusGroup}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isCheckedOut
                  ? colors.navy
                  : isCheckedIn
                  ? colors.success
                  : colors.warning,
              },
            ]}
          />
          <Text style={styles.statusTitle}>
            {isCheckedOut
              ? "Day Completed"
              : isCheckedIn
              ? "On Field Duty (Checked In)"
              : "Not Checked In"}
          </Text>
        </View>

        <Text style={styles.dateText}>
          {new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}
        </Text>
      </View>

      <View style={styles.body}>
        {isCheckedIn ? (
          <View style={styles.timeInfoRow}>
            <View style={styles.timeBlock}>
              <Text style={styles.timeLabel}>Check-In Time</Text>
              <Text style={styles.timeVal}>
                {new Date(attendance!.check_in_time!).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>

            {isCheckedOut ? (
              <View style={styles.timeBlock}>
                <Text style={styles.timeLabel}>Check-Out Time</Text>
                <Text style={styles.timeVal}>
                  {new Date(attendance!.check_out_time!).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            ) : (
              <View style={styles.timeBlock}>
                <Text style={styles.timeLabel}>Total Field Time</Text>
                <Text style={styles.timeVal}>Active Now</Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.hintText}>
            Check in with your GPS location to verify today's field attendance and start DCR calls.
          </Text>
        )}

        {/* Action Buttons */}
        {!isCheckedIn ? (
          <TouchableOpacity
            style={styles.checkInBtn}
            onPress={handleCheckIn}
            disabled={isActionLoading}
            activeOpacity={0.8}
          >
            {isActionLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="location" size={16} color="#fff" />
                <Text style={styles.checkInBtnText}>Check In for Field Work</Text>
              </>
            )}
          </TouchableOpacity>
        ) : !isCheckedOut ? (
          <TouchableOpacity
            style={styles.checkOutBtn}
            onPress={handleCheckOut}
            disabled={isActionLoading}
            activeOpacity={0.8}
          >
            {isActionLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="log-out-outline" size={16} color="#fff" />
                <Text style={styles.checkOutBtnText}>End Day & Check Out</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={colors.navy} />
            <Text style={styles.completedBadgeText}>
              All attendance records for today are finalized
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md + 2,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
    paddingBottom: spacing.xs + 2,
  },
  statusGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusTitle: {
    ...typography.subheading,
    fontSize: 13,
    color: colors.navy,
  },
  dateText: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  body: {
    marginTop: spacing.sm,
  },
  hintText: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  timeInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  timeBlock: {
    flex: 1,
  },
  timeLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
  },
  timeVal: {
    ...typography.subheading,
    fontSize: 14,
    color: colors.navy,
    marginTop: 2,
  },
  checkInBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
  },
  checkInBtnText: {
    ...typography.button,
    color: "#fff",
    fontSize: 13,
  },
  checkOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.navy,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
  },
  checkOutBtnText: {
    ...typography.button,
    color: "#fff",
    fontSize: 13,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
  },
  completedBadgeText: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.navy,
  },
});
