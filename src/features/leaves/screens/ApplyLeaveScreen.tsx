import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LeaveBalanceDto, leavesApi } from "../api/leavesApi";
import { ScreenHeader } from "../../../shared/components/ScreenHeader";
import { colors, radii, spacing, typography, shadows } from "../../../theme";

const LEAVE_TYPES: Array<{
  key: "CASUAL" | "SICK" | "EARNED";
  label: string;
  icon: keyof typeof Feather.glyphMap;
}> = [
  { key: "CASUAL", label: "Casual", icon: "sun" },
  { key: "SICK", label: "Sick", icon: "thermometer" },
  { key: "EARNED", label: "Earned", icon: "award" },
];

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
      <StatusBar style="light" />

      <ScreenHeader
        title="Apply for Leave"
        subtitle="Submit planned absence to manager"
        variant="navy"
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Leave Balance Bento Card */}
        <View style={styles.balanceCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconBox}>
              <Feather name="pie-chart" size={16} color={colors.brandBlue} />
            </View>
            <Text style={styles.cardTitle}>Available Leave Balance</Text>
          </View>

          {isLoadingBalance ? (
            <ActivityIndicator size="small" color={colors.navy} style={{ paddingVertical: 12 }} />
          ) : balance ? (
            <View style={styles.balanceRow}>
              <View style={[styles.balanceTile, { backgroundColor: colors.bluePastel }]}>
                <Text style={[styles.balanceValue, { color: colors.brandBlue }]}>
                  {balance.casual_leave_balance}
                </Text>
                <Text style={styles.balanceLabel}>Casual (CL)</Text>
              </View>

              <View style={[styles.balanceTile, { backgroundColor: colors.tealPastel }]}>
                <Text style={[styles.balanceValue, { color: colors.teal }]}>
                  {balance.sick_leave_balance}
                </Text>
                <Text style={styles.balanceLabel}>Sick (SL)</Text>
              </View>

              <View style={[styles.balanceTile, { backgroundColor: colors.orangePastel }]}>
                <Text style={[styles.balanceValue, { color: colors.orange }]}>
                  {balance.earned_leave_balance}
                </Text>
                <Text style={styles.balanceLabel}>Earned (EL)</Text>
              </View>

              <View style={[styles.balanceTile, { backgroundColor: colors.navy }]}>
                <Text style={[styles.balanceValue, { color: colors.surface }]}>
                  {balance.total_balance}
                </Text>
                <Text style={[styles.balanceLabel, { color: colors.emailSubtitle }]}>
                  Total Left
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Leave Type & Schedule Card */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconBox, { backgroundColor: colors.tealPastel }]}>
              <Feather name="calendar" size={16} color={colors.teal} />
            </View>
            <Text style={styles.cardTitle}>Leave Details</Text>
          </View>

          {/* Leave Type Selector */}
          <Text style={styles.label}>
            Leave Type <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.typeSelectorRow}>
            {LEAVE_TYPES.map((type) => {
              const isSelected = leaveType === type.key;
              return (
                <TouchableOpacity
                  key={type.key}
                  style={[styles.typeBtn, isSelected && styles.typeBtnSelected]}
                  onPress={() => setLeaveType(type.key)}
                  activeOpacity={0.8}
                >
                  <Feather
                    name={type.icon}
                    size={15}
                    color={isSelected ? colors.surface : colors.textMuted}
                  />
                  <Text style={[styles.typeBtnText, isSelected && styles.typeBtnTextSelected]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Half Day Toggle */}
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, marginRight: spacing.md }}>
              <Text style={styles.toggleTitle}>Half Day Leave</Text>
              <Text style={styles.toggleSubtitle}>0.5 day deduction for morning or evening off</Text>
            </View>
            <Switch
              value={isHalfDay}
              onValueChange={handleHalfDayToggle}
              trackColor={{ false: colors.border, true: colors.brandBlue }}
              thumbColor={colors.surface}
            />
          </View>

          {/* Date Inputs */}
          <View style={styles.dateInputsRow}>
            <View style={styles.dateField}>
              <Text style={styles.label}>
                Start Date <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Feather name="calendar" size={16} color={colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  value={startDate}
                  onChangeText={(val) => {
                    setStartDate(val);
                    if (isHalfDay) setEndDate(val);
                  }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textFaint}
                />
              </View>
            </View>

            {!isHalfDay && (
              <View style={styles.dateField}>
                <Text style={styles.label}>
                  End Date <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Feather name="calendar" size={16} color={colors.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    value={endDate}
                    onChangeText={setEndDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textFaint}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Days Count */}
          {!isHalfDay && (
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>
                Total Days <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Feather name="clock" size={16} color={colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  value={daysCount}
                  onChangeText={setDaysCount}
                  placeholder="1.0"
                  placeholderTextColor={colors.textFaint}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          {/* Reason */}
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>
              Reason for Leave <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.textArea}
              value={reason}
              onChangeText={setReason}
              placeholder="e.g. Urgent family matter / Medical checkup..."
              placeholderTextColor={colors.textFaint}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer Submit Bar */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <>
              <Feather name="send" size={16} color={colors.surface} />
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
    backgroundColor: colors.background,
  },
  body: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  balanceCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.soft,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.soft,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardIconBox: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: colors.bluePastel,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    ...typography.heading,
    fontSize: 16,
    fontWeight: "800",
    color: colors.textInk,
  },
  balanceRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  balanceTile: {
    flex: 1,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceValue: {
    ...typography.heading,
    fontSize: 18,
    fontWeight: "800",
  },
  balanceLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    marginTop: 2,
    textAlign: "center",
  },
  label: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: "700",
    color: colors.navy,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  required: {
    color: colors.accentRed,
  },
  typeSelectorRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: radii.lg,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  typeBtnSelected: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  typeBtnText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: "700",
    color: colors.textInk,
  },
  typeBtnTextSelected: {
    color: colors.surface,
    fontWeight: "800",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.inputBackground,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.lg,
  },
  toggleTitle: {
    ...typography.body,
    fontSize: 14,
    fontWeight: "700",
    color: colors.textInk,
  },
  toggleSubtitle: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  dateInputsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  dateField: {
    flex: 1,
  },
  fieldBlock: {
    marginBottom: spacing.md,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    ...typography.body,
    fontSize: 14,
    color: colors.textInk,
    fontWeight: "600",
  },
  textArea: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.lg,
    padding: spacing.md,
    ...typography.body,
    fontSize: 14,
    color: colors.textInk,
    minHeight: 88,
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.md,
    ...shadows.soft,
  },
  cancelBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.lg,
    backgroundColor: colors.inputBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    ...typography.button,
    fontSize: 14,
    fontWeight: "700",
    color: colors.textInk,
  },
  submitBtn: {
    flex: 2,
    flexDirection: "row",
    minHeight: 48,
    borderRadius: radii.lg,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    ...shadows.soft,
  },
  submitBtnText: {
    ...typography.button,
    fontSize: 14,
    fontWeight: "800",
    color: colors.surface,
  },
});
