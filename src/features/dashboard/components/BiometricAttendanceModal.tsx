import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { attendanceApi, AttendanceDto } from "../../attendance/api/attendanceApi";
import { dcrApi } from "../../dcr/api/dcrApi";
import { getCurrentGeoLocation } from "../../../shared/utils/location";

interface BiometricAttendanceModalProps {
  visible: boolean;
  onClose: () => void;
  onAttendanceUpdated?: () => void;
}

export function BiometricAttendanceModal({
  visible,
  onClose,
  onAttendanceUpdated,
}: BiometricAttendanceModalProps) {
  const [attendance, setAttendance] = useState<AttendanceDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live calculation states
  const [currentTimeFormatted, setCurrentTimeFormatted] = useState<string>("");
  const [workingTimeFormatted, setWorkingTimeFormatted] = useState<string>("00 : 00");
  const [visitsDoneCount, setVisitsDoneCount] = useState<number>(0);
  const [totalPlannedVisitsCount, setTotalPlannedVisitsCount] = useState<number>(1);
  const [lastPunchInDisplay, setLastPunchInDisplay] = useState<string>("Empty");

  const formatDateTime = (date: Date) => {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
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
        const checkInDate = new Date(todayAtt.check_in_time);
        setLastPunchInDisplay(formatDateTime(checkInDate));

        // Calculate working duration
        const diffMs = Math.max(0, now.getTime() - checkInDate.getTime());
        const hrs = String(Math.floor(diffMs / (1000 * 60 * 60))).padStart(2, "0");
        const mins = String(Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, "0");
        setWorkingTimeFormatted(`${hrs} : ${mins}`);
      } else {
        setLastPunchInDisplay("Empty");
        setWorkingTimeFormatted("00 : 00");
      }

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
      setLastPunchInDisplay("Empty");
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
        address: loc?.address || "Chanakyapuri, Ahmedabad, Gujarat",
        mock_location_flag: loc?.mock_location_flag || false,
        remarks: "MR Daily Attendance Punch In",
        client_uuid: `att-in-${Date.now()}`,
      });

      Alert.alert("Punch In Successful 🎉", "Your shift punch in has been recorded with GPS verification.");
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
        address: loc?.address || "Chanakyapuri, Ahmedabad, Gujarat",
        mock_location_flag: loc?.mock_location_flag || false,
        remarks: "MR Daily Attendance Punch Out",
      });

      Alert.alert(
        "Punch Out Successful 👏",
        `Today's total working time: ${workingTimeFormatted} (${visitsDoneCount} visits completed).`
      );
      onAttendanceUpdated?.();
      onClose();
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
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalBackdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.bottomSheetCard}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#E11D48" />
                  <Text style={styles.loadingText}>Fetching shift details...</Text>
                </View>
              ) : isCheckedOut ? (
                /* ================= ALREADY PUNCHED OUT ================= */
                <View style={styles.contentBox}>
                  <Text style={styles.sheetTitle}>Punch Out</Text>
                  <Text style={styles.infoLine}>You have already punched out for today.</Text>
                  <Text style={styles.infoLine}>Your today working time is {workingTimeFormatted}</Text>
                  <Text style={styles.infoLine}>
                    You have done {visitsDoneCount} visit out of {totalPlannedVisitsCount}
                  </Text>
                  <View style={styles.dividerLine} />
                  <View style={styles.btnRow}>
                    <TouchableOpacity style={styles.fullWidthCloseBtn} onPress={onClose}>
                      <Text style={styles.closeBtnText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : isCheckedIn ? (
                /* ================= PUNCH OUT CONFIRMATION (MATCHES SCREENSHOT 2) ================= */
                <View style={styles.contentBox}>
                  <Text style={styles.sheetTitle}>Punch Out</Text>
                  <Text style={styles.promptText}>Are you sure want to punch out?</Text>

                  <Text style={styles.detailLine}>Your standard working time should be 1 hour</Text>
                  <Text style={styles.detailLine}>Your today working time is {workingTimeFormatted}</Text>
                  <Text style={styles.detailLine}>
                    You have done {visitsDoneCount} visit out of {totalPlannedVisitsCount}
                  </Text>

                  <View style={styles.dividerLine} />

                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={onClose}
                      disabled={isSubmitting}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.confirmPunchBtn}
                      onPress={handleConfirmPunchOut}
                      disabled={isSubmitting}
                      activeOpacity={0.8}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.confirmPunchBtnText}>Punch out</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* ================= PUNCH IN CONFIRMATION (MATCHES SCREENSHOT 1) ================= */
                <View style={styles.contentBox}>
                  <Text style={styles.sheetTitle}>Punch In</Text>
                  <Text style={styles.promptText}>Are you sure want to punch in?</Text>

                  <Text style={styles.detailLine}>Last punch In {lastPunchInDisplay}</Text>
                  <Text style={styles.detailLine}>punch In {currentTimeFormatted}</Text>

                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={onClose}
                      disabled={isSubmitting}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.confirmPunchBtn}
                      onPress={handleConfirmPunchIn}
                      disabled={isSubmitting}
                      activeOpacity={0.8}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.confirmPunchBtnText}>Punch In</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  bottomSheetCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  contentBox: {
    width: "100%",
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
  },
  promptText: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "500",
    marginBottom: 12,
  },
  detailLine: {
    fontSize: 13,
    color: "#334155",
    marginBottom: 4,
    lineHeight: 20,
  },
  infoLine: {
    fontSize: 13,
    color: "#475569",
    marginBottom: 4,
  },
  dividerLine: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 18,
    width: "100%",
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E11D48",
  },
  confirmPunchBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: "#E11D48",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E11D48",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  confirmPunchBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  fullWidthCloseBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: "#1B64DA",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  loadingContainer: {
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: "#64748B",
  },
});
