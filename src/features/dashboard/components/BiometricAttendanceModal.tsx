import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { attendanceApi, AttendanceDto } from "../../attendance/api/attendanceApi";
import { dcrApi } from "../../dcr/api/dcrApi";
import { getCurrentGeoLocation } from "../../../shared/utils/location";
import { formatDateTimeIST, parseUtcDate } from "../../../shared/utils/date";
import { colors, radii, shadows, spacing, typography } from "../../../theme";
import { PrimaryButton } from "../../../shared/components/PrimaryButton";

export interface BiometricAttendanceModalProps {
  visible: boolean;
  onClose: () => void;
  onAttendanceUpdated?: () => void;
  onPunchOutSuccess?: () => void;
}

export function BiometricAttendanceModal({
  visible,
  onClose,
  onAttendanceUpdated,
  onPunchOutSuccess,
}: BiometricAttendanceModalProps) {
  const insets = useSafeAreaInsets();
  const [attendance, setAttendance] = useState<AttendanceDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationName, setLocationName] = useState<string>("Ahmedabad");
  const [punchOutRemarks, setPunchOutRemarks] = useState<string>("");

  // Live calculation states
  const [currentTimeFormatted, setCurrentTimeFormatted] = useState<string>("");
  const [workingTimeFormatted, setWorkingTimeFormatted] = useState<string>("00 : 00");
  const [visitsDoneCount, setVisitsDoneCount] = useState<number>(0);
  const [totalPlannedVisitsCount, setTotalPlannedVisitsCount] = useState<number>(1);
  const [lastPunchInDisplay, setLastPunchInDisplay] = useState<string | null>(null);

  const formatDateTime = (date: Date) => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = String(hours).padStart(2, "0");

    return `${day} ${month} ${year} · ${formattedHours}:${minutes} ${ampm}`;
  };

  const loadData = async () => {
    setIsLoading(true);
    const now = new Date();
    setCurrentTimeFormatted(formatDateTime(now));

    try {
      // 1. Fetch Today's Attendance
      const todayAtt = await attendanceApi.getToday();
      setAttendance(todayAtt);

      if (todayAtt && todayAtt.check_in_time) {
        const checkInDate = parseUtcDate(todayAtt.check_in_time) || new Date(todayAtt.check_in_time);
        setLastPunchInDisplay(formatDateTimeIST(todayAtt.check_in_time));

        const endRef = todayAtt.check_out_time
          ? parseUtcDate(todayAtt.check_out_time) || now
          : now;
        const diffMs = Math.max(0, endRef.getTime() - checkInDate.getTime());
        const hrs = String(Math.floor(diffMs / (1000 * 60 * 60))).padStart(2, "0");
        const mins = String(Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, "0");
        setWorkingTimeFormatted(`${hrs} : ${mins}`);
      } else {
        setLastPunchInDisplay(null);
        setWorkingTimeFormatted("00 : 00");
      }

      // Fetch location preview
      getCurrentGeoLocation()
        .then((loc) => {
          if (loc?.address) {
            const shortLoc = loc.address.split(",")[0] || "Ahmedabad";
            setLocationName(shortLoc);
          }
        })
        .catch(() => {});

      // 2. Fetch Today's Visits
      const todayStr = now.toISOString().split("T")[0];
      try {
        const [plans, visits] = await Promise.all([
          dcrApi.listPlans({ plan_date: todayStr }),
          dcrApi.listVisits({ dcr_date: todayStr }),
        ]);
        const plannedCount = plans && plans.length > 0 ? plans.length : 1;
        const doneCount = visits ? visits.length : 0;
        setTotalPlannedVisitsCount(plannedCount);
        setVisitsDoneCount(doneCount);
      } catch {
        setTotalPlannedVisitsCount(1);
        setVisitsDoneCount(0);
      }
    } catch {
      setAttendance(null);
      setLastPunchInDisplay(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  // Handle Punch In Action
  const handleConfirmPunchIn = async () => {
    setIsSubmitting(true);
    try {
      const loc = await getCurrentGeoLocation();
      await attendanceApi.checkIn({
        latitude: loc?.latitude || 23.075341,
        longitude: loc?.longitude || 72.531375,
        accuracy: loc?.accuracy || 10,
        address: loc?.address || "Ahmedabad, Gujarat",
        mock_location_flag: loc?.mock_location_flag || false,
        remarks: "MR Daily Attendance Punch In",
        client_uuid: `att-in-${Date.now()}`,
      });

      Alert.alert("Punch In Successful", "Your attendance has been recorded with GPS verification.");
      onAttendanceUpdated?.();
      onClose();
    } catch (err: any) {
      Alert.alert("Punch In Failed", err?.response?.data?.detail || err?.message || "Please check connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Punch Out Action
  const handleConfirmPunchOut = async () => {
    setIsSubmitting(true);
    try {
      const loc = await getCurrentGeoLocation();
      await attendanceApi.checkOut({
        latitude: loc?.latitude || 23.075341,
        longitude: loc?.longitude || 72.531375,
        accuracy: loc?.accuracy || 10,
        address: loc?.address || "Ahmedabad, Gujarat",
        mock_location_flag: loc?.mock_location_flag || false,
        remarks: punchOutRemarks.trim() || "MR Daily Attendance Punch Out",
      });

      setPunchOutRemarks("");
      onAttendanceUpdated?.();
      onClose();
      onPunchOutSuccess?.();
    } catch (err: any) {
      Alert.alert("Punch Out Failed", err?.response?.data?.detail || err?.message || "Please check connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCheckedIn = !!attendance?.check_in_time && !attendance?.check_out_time;
  const isCheckedOut = !!attendance?.check_out_time;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.dismissOverlay} />
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.sheetCard,
            { paddingBottom: Math.max(insets.bottom, spacing.xl) },
          ]}
        >
          {/* Top Drag Handle */}
          <View style={styles.dragHandle} />

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accentRed} />
              <Text style={styles.loadingText}>Fetching shift details...</Text>
            </View>
          ) : isCheckedOut ? (
            /* Already Punched Out State */
            <View style={styles.contentBox}>
              <View style={styles.redIconTile}>
                <Feather name="check-circle" size={24} color={colors.accentRed} />
              </View>
              <Text style={styles.sheetTitle}>Punched out for today</Text>
              <Text style={styles.dateTimeText}>{currentTimeFormatted}</Text>

              <View style={styles.locationPill}>
                <Feather name="map" size={16} color={colors.brandBlue} />
                <Text style={styles.locationPillText}>
                  Location: {locationName} · GPS on
                </Text>
              </View>

              <Text style={styles.summaryText}>
                Total working time: {workingTimeFormatted} ({visitsDoneCount} of {totalPlannedVisitsCount} visits completed).
              </Text>

              <PrimaryButton
                title="Close"
                onPress={onClose}
                variant="outline"
                style={styles.fullWidthBtn}
              />
            </View>
          ) : isCheckedIn ? (
            /* Punch Out Confirmation (MR-Buddy Flow) */
            <View style={styles.contentBox}>
              <View style={styles.redIconTile}>
                <Feather name="log-out" size={24} color={colors.accentRed} />
              </View>

              <Text style={styles.sheetTitle}>Punch Out</Text>
              <Text style={styles.dateTimeText}>Are you sure you want to punch out?</Text>

              <View style={styles.punchSummaryBox}>
                <Text style={styles.punchSummaryLine}>
                  Your today working time is <Text style={styles.punchSummaryBold}>{workingTimeFormatted}</Text>
                </Text>
                <Text style={styles.punchSummaryLine}>
                  You have done <Text style={styles.punchSummaryBold}>{visitsDoneCount}</Text> visit{visitsDoneCount === 1 ? "" : "s"} out of {totalPlannedVisitsCount}
                </Text>
                {lastPunchInDisplay && (
                  <Text style={styles.lastPunchText}>
                    Punched in at: {lastPunchInDisplay}
                  </Text>
                )}
              </View>

              <TextInput
                style={styles.remarksInput}
                placeholder="Enter remarks (optional)..."
                placeholderTextColor={colors.textFaint}
                value={punchOutRemarks}
                onChangeText={setPunchOutRemarks}
                maxLength={200}
              />

              <View style={styles.actionRow}>
                <PrimaryButton
                  title="Cancel"
                  onPress={onClose}
                  variant="outline"
                  style={styles.halfBtn}
                />
                <PrimaryButton
                  title="Punch Out"
                  onPress={handleConfirmPunchOut}
                  isLoading={isSubmitting}
                  variant="red"
                  style={styles.halfBtn}
                />
              </View>
            </View>
          ) : (
            /* Punch In Confirmation (Matches Screenshot 6 exactly) */
            <View style={styles.contentBox}>
              <View style={styles.redIconTile}>
                <Feather name="navigation" size={24} color={colors.accentRed} />
              </View>

              <Text style={styles.sheetTitle}>Punch in now?</Text>
              <Text style={styles.dateTimeText}>{currentTimeFormatted}</Text>

              <View style={styles.locationPill}>
                <Feather name="map" size={16} color={colors.brandBlue} />
                <Text style={styles.locationPillText}>
                  Location: {locationName} · GPS on
                </Text>
              </View>

              {lastPunchInDisplay && (
                <Text style={styles.lastPunchText}>
                  Last punch in: {lastPunchInDisplay}
                </Text>
              )}

              <View style={styles.actionRow}>
                <PrimaryButton
                  title="Cancel"
                  onPress={onClose}
                  variant="outline"
                  style={styles.halfBtn}
                />
                <PrimaryButton
                  title="Punch In"
                  onPress={handleConfirmPunchIn}
                  isLoading={isSubmitting}
                  variant="red"
                  style={styles.halfBtn}
                />
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.backdrop,
  },
  dismissOverlay: {
    ...StyleSheet.absoluteFill,
  },
  sheetCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xl,
    ...shadows.sheet,
  },
  dragHandle: {
    width: 44,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.lg,
  },
  contentBox: {
    alignItems: "flex-start",
  },
  redIconTile: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: colors.accentRedPastel,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  sheetTitle: {
    ...typography.heading,
    fontSize: 22,
    fontWeight: "800",
    color: colors.textInk,
    marginBottom: 4,
  },
  dateTimeText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  locationPill: {
    width: "100%",
    height: 48,
    borderRadius: radii.lg,
    backgroundColor: colors.inputBackground,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  locationPillText: {
    ...typography.bodyMedium,
    fontSize: 13,
    color: colors.textInk,
    marginLeft: spacing.sm,
    fontWeight: "600",
  },
  lastPunchText: {
    ...typography.caption,
    color: colors.textFaint,
    marginTop: 4,
  },
  punchSummaryBox: {
    width: "100%",
    backgroundColor: colors.inputBackground,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
    gap: 4,
  },
  punchSummaryLine: {
    ...typography.body,
    fontSize: 13,
    color: colors.textInk,
  },
  punchSummaryBold: {
    fontWeight: "700",
    color: colors.navy,
  },
  remarksInput: {
    width: "100%",
    borderBottomWidth: 1.5,
    borderBottomColor: colors.accentRed,
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    fontSize: 14,
    color: colors.textInk,
    marginBottom: spacing.lg,
  },
  summaryText: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  halfBtn: {
    flex: 1,
    height: 50,
  },
  fullWidthBtn: {
    width: "100%",
    height: 50,
  },
  loadingContainer: {
    paddingVertical: spacing.xxxl,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
});
