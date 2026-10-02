import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { expensesApi } from "../api/expensesApi";
import { colors, radii, spacing } from "../../../shared/theme/tokens";

const EXPENSE_TYPES = [
  { label: "Daily Allowance (DA)", value: "DAILY_ALLOWANCE" as const, icon: "cash-outline" as const },
  { label: "Travel Fare (TA)", value: "TRAVEL_FARE" as const, icon: "car-outline" as const },
  { label: "Hotel / Lodging", value: "LODGING" as const, icon: "bed-outline" as const },
  { label: "Miscellaneous", value: "MISCELLANEOUS" as const, icon: "receipt-outline" as const },
] as const;

export function AddExpenseScreen() {
  const navigation = useNavigation();
  const todayStr = new Date().toISOString().split("T")[0];
  const [expenseDate, setExpenseDate] = useState<string>(todayStr);
  const [expenseType, setExpenseType] = useState<
    "DAILY_ALLOWANCE" | "TRAVEL_FARE" | "LODGING" | "MISCELLANEOUS"
  >("DAILY_ALLOWANCE");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [hasReceipt, setHasReceipt] = useState<boolean>(false);
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handlePickReceipt = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setReceiptUri(result.assets[0].uri);
        setHasReceipt(true);
      }
    } catch {
      // Fallback toggle
      setHasReceipt(!hasReceipt);
    }
  };

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount.trim());
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid expense amount in INR.");
      return;
    }

    if (!expenseDate.trim()) {
      Alert.alert("Missing Date", "Please enter the date of the expense (YYYY-MM-DD).");
      return;
    }

    setIsSubmitting(true);
    try {
      await expensesApi.create({
        expense_date: expenseDate.trim(),
        expense_type: expenseType,
        amount: numAmount,
        description: description.trim() || undefined,
        client_uuid: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      });

      Alert.alert("Submitted", "Expense claim has been submitted for manager approval.", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to submit expense claim.";
      Alert.alert("Submission Failed", msg);
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
          <Text style={styles.title}>Submit Expense Claim</Text>
          <Text style={styles.subtitle}>Daily allowance, fuel, travel & lodging</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Category Selector */}
        <Text style={styles.label}>Expense Category *</Text>
        <View style={styles.categoryGrid}>
          {EXPENSE_TYPES.map((cat) => {
            const isSelected = expenseType === cat.value;
            return (
              <TouchableOpacity
                key={cat.value}
                style={[styles.categoryTile, isSelected && styles.categoryTileSelected]}
                onPress={() => setExpenseType(cat.value)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={cat.icon}
                  size={20}
                  color={isSelected ? colors.primary : "#64748B"}
                />
                <Text
                  style={[
                    styles.categoryTileText,
                    isSelected && styles.categoryTileTextSelected,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Date Field */}
        <Text style={styles.label}>Expense Date (YYYY-MM-DD) *</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="calendar-outline" size={18} color="#64748B" style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            value={expenseDate}
            onChangeText={setExpenseDate}
            placeholder="2026-10-02"
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* Amount Field */}
        <Text style={styles.label}>Claim Amount (₹) *</Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.currencyPrefix}>₹</Text>
          <TextInput
            style={styles.textInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="e.g. 450"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
          />
        </View>

        {/* Description Field */}
        <Text style={styles.label}>Remarks / Route Details</Text>
        <TextInput
          style={styles.textArea}
          value={description}
          onChangeText={setDescription}
          placeholder="e.g. Dadar to Thane clinic travel fare via local train & cab"
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* Receipt Attachment Toggle */}
        <TouchableOpacity
          style={styles.receiptToggle}
          activeOpacity={0.8}
          onPress={handlePickReceipt}
        >
          <Ionicons
            name={hasReceipt ? "checkbox" : "camera-outline"}
            size={22}
            color={hasReceipt ? colors.primary : "#94A3B8"}
          />
          <View style={styles.receiptToggleTextGroup}>
            <Text style={styles.receiptToggleTitle}>Attach Bill / Receipt Photo</Text>
            <Text style={styles.receiptToggleSubtitle}>
              {hasReceipt
                ? receiptUri
                  ? "Receipt image selected"
                  : "Paper bill verified"
                : "Tap to capture or choose receipt image"}
            </Text>
          </View>
        </TouchableOpacity>
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
              <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>Submit Claim</Text>
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
  body: {
    padding: spacing.lg,
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginTop: 8,
    marginBottom: 4,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  },
  categoryTile: {
    flexBasis: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  categoryTileSelected: {
    borderColor: colors.primary,
    backgroundColor: "#ECFDF5",
  },
  categoryTileText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    flexShrink: 1,
  },
  categoryTileTextSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: radii.md,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: spacing.sm,
    height: 44,
  },
  inputIcon: {
    marginRight: 6,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
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
  receiptToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F1F5F9",
    padding: spacing.sm,
    borderRadius: radii.md,
    marginTop: 10,
  },
  receiptToggleTextGroup: {
    flex: 1,
  },
  receiptToggleTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  receiptToggleSubtitle: {
    fontSize: 11,
    color: "#64748B",
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
