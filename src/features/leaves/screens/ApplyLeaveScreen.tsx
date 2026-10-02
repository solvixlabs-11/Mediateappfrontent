import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LeaveBalanceDto, leavesApi } from "../api/leavesApi";
import { colors, radii, spacing } from "../../../shared/theme/tokens";

export function ApplyLeaveScreen() {
  const navigation = useNavigation();
  const todayStr = new Date().toISOString().split("T")[0];
  const [balance, setBalance] = useState<LeaveBalanceDto | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(true);

  const [leaveType, setLeaveType] = useState<"CASUAL" | "SICK" | "EARNED">("CASUAL");
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [isHalfDay, setIsHalfDay] = useState<boolean>(false);
  const [daysCount, setDaysCount] = useState<string>("1.0");
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    setIsLoadingBalance(true);
    try {
      const data = await leavesApi.getBalance();
      setBalance(data);
    } catch {
      // ignore
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handleHalfDayToggle = (val: boolean) => {
    setIsHalfDay(val);
    if (val) {
      setDaysCount("0.5");
      setEndDate(startDate);
    } else {
      setDaysCount("1.0");
    }
  };

  const handleSubmit = async () => {
    const days = parseFloat(daysCount);
    if (isNaN(days) || days <= 0) {
      Alert.alert("Invalid Days", "Please specify a valid number of leave days.");
      return;
    }

    if (!startDate || !endDate) {
      Alert.alert("Missing Dates", "Please provide valid start and end dates (YYYY-MM-DD).");
      return;
    }

    if (!reason.trim()) {
      Alert.alert("Reason Required", "Please state the reason for your leave request.");
      return;
    }

    setIsSubmitting(true);
    try {
      await leavesApi.apply({
        leave_type: leaveType,
        start_date: startDate.trim(),
        end_date: endDate.trim(),
        days_count: days,
        reason: reason.trim(),
        client_uuid: `leave-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      });

      Alert.alert("Applied", "Leave application submitted to reporting manager.", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to submit leave application.";
      Alert.alert("Application Failed", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screenContainer} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Apply for Leave</Text>
          <Text style={styles.subtitle}>Submit planned absence to manager</Text>
        </View>
      </View>

      {/* Current Balance Bar */}
      <View style={styles.balanceContainer}>
        {isLoadingBalance ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : balance ? (
          <View style={styles.balanceRow}>
            <View style={styles.balanceCol}>
              <Text style={styles.balanceValue}>{balance.casual_leave_balance}</Text>
              <Text style={styles.balanceLabel}>Casual (CL)</Text>
            </View>
            <View style={styles.balanceCol}>
              <Text style={styles.balanceValue}>{balance.sick_leave_balance}</Text>
              <Text style={styles.balanceLabel}>Sick (SL)</Text>
            </View>
            <View style={styles.balanceCol}>
              <Text style={styles.balanceValue}>{balance.earned_leave_balance}</Text>
              <Text style={styles.balanceLabel}>Earned (EL)</Text>
            </View>
            <View style={[styles.balanceCol, styles.totalCol]}>
              <Text style={[styles.balanceValue, { color: colors.primary }]}>
                {balance.total_balance}
              </Text>
              <Text style={styles.balanceLabel}>Total Left</Text>
            </View>
          </View>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Leave Type Selector */}
        <Text style={styles.label}>Leave Type *</Text>
        <View style={styles.typeSelectorRow}>
          {(["CASUAL", "SICK", "EARNED"] as const).map((type) => {
            const isSelected = leaveType === type;
            return (
              <TouchableOpacity
                key={type}
                style={[styles.typeBtn, isSelected && styles.typeBtnSelected]}
                onPress={() => setLeaveType(type)}
                activeOpacity={0.8}
              >
                <Text style={[styles.typeBtnText, isSelected && styles.typeBtnTextSelected]}>
                  {type}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Half Day Toggle */}
        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleTitle}>Half Day Leave</Text>
            <Text style={styles.toggleSubtitle}>0.5 day deduction for morning/evening off</Text>
          </View>
          <Switch
            value={isHalfDay}
            onValueChange={handleHalfDayToggle}
            trackColor={{ false: "#CBD5E1", true: colors.primary }}
          />
        </View>

        {/* Date Inputs */}
        <View style={styles.dateInputsRow}>
          <View style={styles.dateField}>
            <Text style={styles.label}>Start Date *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="calendar-outline" size={16} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={startDate}
                onChangeText={(val) => {
                  setStartDate(val);
                  if (isHalfDay) setEndDate(val);
                }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {!isHalfDay && (
            <View style={styles.dateField}>
              <Text style={styles.label}>End Date *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="calendar-outline" size={16} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>
          )}
        </View>

        {/* Days Count */}
        {!isHalfDay && (
          <View>
            <Text style={styles.label}>Total Days *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="hourglass-outline" size={16} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={daysCount}
                onChangeText={setDaysCount}
                placeholder="1.0"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
            </View>
          </View>
        )}

        {/* Reason */}
        <Text style={styles.label}>Reason for Leave *</Text>
        <TextInput
          style={styles.textArea}
          value={reason}
          onChangeText={setReason}
          placeholder="e.g. Urgent family matter / Viral fever..."
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </ScrollView>

      {/* Footer Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="send-outline" size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>Submit Application</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  balanceContainer: {
    backgroundColor: "#F8FAFC",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  balanceCol: {
    alignItems: "center",
  },
  totalCol: {
    borderLeftWidth: 1,
    borderLeftColor: "#E2E8F0",
    paddingLeft: spacing.md,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 2,
  },
  body: {
    padding: spacing.lg,
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 4,
  },
  typeSelectorRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
  },
  typeBtnSelected: {
    borderColor: colors.primary,
    backgroundColor: "#ECFDF5",
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  typeBtnTextSelected: {
    color: colors.primary,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F1F5F9",
    padding: spacing.sm,
    borderRadius: radii.md,
    marginVertical: 4,
  },
  toggleTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  toggleSubtitle: {
    fontSize: 10,
    color: "#64748B",
  },
  dateInputsRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateField: {
    flex: 1,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: radii.md,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: spacing.sm,
    height: 42,
  },
  inputIcon: {
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: radii.md,
    backgroundColor: "#F8FAFC",
    padding: spacing.sm,
    fontSize: 14,
    color: "#0F172A",
    minHeight: 70,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radii.md,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
