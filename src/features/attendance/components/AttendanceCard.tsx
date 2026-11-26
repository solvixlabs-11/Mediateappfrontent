import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { AttendanceDto, attendanceApi } from "../api/attendanceApi";
import { colors, radii, shadows, spacing, typography } from "../../../theme";
import { getCurrentGeoLocation } from "../../../shared/utils/location";
import { formatTimeIST } from "../../../shared/utils/date";

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
      const geo = await getCurrentGeoLocation();
      const record = await attendanceApi.checkIn({
        latitude: geo.latitude,
        longitude: geo.longitude,
        accuracy: geo.accuracy,
        address: geo.address,
        mock_location_flag: geo.mock_location_flag,
        remarks: "Started field work",
        client_uuid: `att-in-${Date.now()}`,
      });
      setAttendance(record);
      if (onStatusChanged) onStatusChanged(record);
      Alert.alert(
        "GPS Check-in Verified 🎉",
        `Time: ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}\nDate: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}\nLocation: ${geo.address}\nGPS: ${geo.latitude.toFixed(5)}, ${geo.longitude.toFixed(5)}\n\nAdmin & Managers have received your live field location.`
      );
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
              const geo = await getCurrentGeoLocation();
              const record = await attendanceApi.checkOut({
                latitude: geo.latitude,
                longitude: geo.longitude,
                accuracy: geo.accuracy,
                address: geo.address,
                mock_location_flag: geo.mock_location_flag,
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
        <ActivityIndicator size="small" color={colors.navy} />
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
                  ? colors.teal
                  : colors.orange,
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
                {formatTimeIST(attendance?.check_in_time)}
              </Text>
            </View>

            {isCheckedOut ? (
              <View style={styles.timeBlock}>
                <Text style={styles.timeLabel}>Check-Out Time</Text>
                <Text style={styles.timeVal}>
                  {formatTimeIST(attendance?.check_out_time)}
                </Text>
              </View>
            ) : (
              <View style={styles.timeBlock}>
                <Text style={styles.timeLabel}>Field Status</Text>
                <Text style={[styles.timeVal, { color: colors.teal }]}>Active Now</Text>
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
            accessibilityLabel="Check in for field work"
          >
            {isActionLoading ? (
              <ActivityIndicator color={colors.surface} size="small" />
            ) : (
              <>
                <Feather name="map-pin" size={16} color={colors.surface} />
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
            accessibilityLabel="End day and check out"
          >
            {isActionLoading ? (
              <ActivityIndicator color={colors.surface} size="small" />
            ) : (
              <>
                <Feather name="log-out" size={16} color={colors.surface} />
                <Text style={styles.checkOutBtnText}>End Day & Check Out</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.completedBadge}>
            <Feather name="check-circle" size={16} color={colors.teal} />
            <Text style={styles.completedText}>Attendance Closed for Today</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  center: {
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  statusGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textInk,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  body: {
    marginTop: 2,
  },
  hintText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  timeInfoRow: {
    flexDirection: "row",
    backgroundColor: colors.inputBackground,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  timeBlock: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
  },
  timeVal: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textInk,
    marginTop: 2,
  },
  checkInBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.navy,
    borderRadius: radii.lg,
    paddingVertical: 13,
    ...shadows.sm,
  },
  checkInBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface,
  },
  checkOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.accentRed,
    borderRadius: radii.lg,
    paddingVertical: 13,
    ...shadows.sm,
  },
  checkOutBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    backgroundColor: colors.tealPastel,
    borderRadius: radii.lg,
  },
  completedText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.teal,
  },
});
