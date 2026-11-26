import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { expensesApi } from "../api/expensesApi";
import { mastersApi } from "../../masters/api/mastersApi";
import { ScreenHeader } from "../../../shared/components/ScreenHeader";
import { colors, radii, spacing, typography, shadows } from "../../../theme";

interface ExpenseTypeOption {
  label: string;
  value: "DAILY_ALLOWANCE" | "TRAVEL_FARE" | "LODGING" | "MISCELLANEOUS";
  icon: keyof typeof Feather.glyphMap;
}

const DEFAULT_EXPENSE_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  DAILY_ALLOWANCE: "dollar-sign",
  TRAVEL_FARE: "navigation",
  LODGING: "home",
  MISCELLANEOUS: "file-text",
};

export function AddExpenseScreen() {
  const navigation = useNavigation();
  const todayStr = new Date().toISOString().split("T")[0];
  const [expenseDate, setExpenseDate] = useState<string>(todayStr);
  const [expenseTypesList, setExpenseTypesList] = useState<ExpenseTypeOption[]>([
    { label: "Daily Allowance (DA)", value: "DAILY_ALLOWANCE", icon: "dollar-sign" },
    { label: "Travel Fare (TA)", value: "TRAVEL_FARE", icon: "navigation" },
    { label: "Hotel / Lodging", value: "LODGING", icon: "home" },
    { label: "Miscellaneous", value: "MISCELLANEOUS", icon: "file-text" },
  ]);
  const [expenseType, setExpenseType] = useState<
    "DAILY_ALLOWANCE" | "TRAVEL_FARE" | "LODGING" | "MISCELLANEOUS"
  >("DAILY_ALLOWANCE");

  useEffect(() => {
    mastersApi
      .listItems("EXPENSE_TYPE")
      .then((res) => {
        if (res && res.length > 0) {
          const mapped: ExpenseTypeOption[] = res.map((i) => ({
            label: i.name,
            value: i.code as "DAILY_ALLOWANCE" | "TRAVEL_FARE" | "LODGING" | "MISCELLANEOUS",
            icon: DEFAULT_EXPENSE_ICONS[i.code] || "file-text",
          }));
          setExpenseTypesList(mapped);
          setExpenseType(mapped[0].value);
        }
      })
      .catch(() => {});
  }, []);

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
      <StatusBar style="light" />

      <ScreenHeader
        title="Submit Expense Claim"
        subtitle="Daily allowance, fuel, travel & lodging"
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
        {/* Category Selector Card */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconBox}>
              <Feather name="grid" size={16} color={colors.brandBlue} />
            </View>
            <Text style={styles.cardTitle}>Expense Category</Text>
          </View>

          <View style={styles.categoryGrid}>
            {expenseTypesList.map((cat) => {
              const isSelected = expenseType === cat.value;
              return (
                <TouchableOpacity
                  key={cat.value}
                  style={[styles.categoryTile, isSelected && styles.categoryTileSelected]}
                  onPress={() => setExpenseType(cat.value)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.catIconBadge,
                      isSelected && styles.catIconBadgeSelected,
                    ]}
                  >
                    <Feather
                      name={cat.icon}
                      size={16}
                      color={isSelected ? colors.surface : colors.brandBlue}
                    />
                  </View>
                  <Text
                    style={[
                      styles.categoryTileText,
                      isSelected && styles.categoryTileTextSelected,
                    ]}
                    numberOfLines={2}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Expense Amount & Details Card */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconBox, { backgroundColor: colors.tealPastel }]}>
              <Feather name="credit-card" size={16} color={colors.teal} />
            </View>
            <Text style={styles.cardTitle}>Claim Details</Text>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>
              Expense Date (YYYY-MM-DD) <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <Feather name="calendar" size={16} color={colors.textMuted} />
              <TextInput
                style={styles.textInput}
                value={expenseDate}
                onChangeText={setExpenseDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textFaint}
              />
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>
              Claim Amount (₹) <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.currencyPrefix}>₹</Text>
              <TextInput
                style={[styles.textInput, styles.amountInput]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={colors.textFaint}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Remarks / Route Details</Text>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Travel route details, outstation allowance note..."
              placeholderTextColor={colors.textFaint}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Receipt Upload Card */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconBox, { backgroundColor: colors.orangePastel }]}>
              <Feather name="paperclip" size={16} color={colors.orange} />
            </View>
            <Text style={styles.cardTitle}>Bill / Receipt Attachment</Text>
          </View>

          <TouchableOpacity
            style={[styles.receiptBox, hasReceipt && styles.receiptBoxAttached]}
            activeOpacity={0.8}
            onPress={handlePickReceipt}
          >
            {receiptUri ? (
              <View style={styles.receiptPreviewWrap}>
                <Image source={{ uri: receiptUri }} style={styles.receiptPreviewImg} />
                <View style={styles.receiptOverlayBadge}>
                  <Feather name="refresh-cw" size={13} color={colors.surface} />
                  <Text style={styles.receiptOverlayText}>Change Receipt</Text>
                </View>
              </View>
            ) : (
              <View style={styles.receiptPlaceholder}>
                <View style={styles.receiptIconCircle}>
                  <Feather
                    name={hasReceipt ? "check-circle" : "camera"}
                    size={24}
                    color={hasReceipt ? colors.successGreen : colors.navy}
                  />
                </View>
                <Text style={styles.receiptTitle}>
                  {hasReceipt ? "Paper Bill Verified" : "Attach Bill / Receipt Photo"}
                </Text>
                <Text style={styles.receiptSubtitle}>
                  Tap to choose receipt image from gallery
                </Text>
              </View>
            )}
          </TouchableOpacity>
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
              <Feather name="upload-cloud" size={16} color={colors.surface} />
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
    backgroundColor: colors.background,
  },
  body: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
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
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  categoryTile: {
    width: "48.5%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.inputBackground,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  categoryTileSelected: {
    backgroundColor: colors.bluePastel,
    borderColor: colors.brandBlue,
  },
  catIconBadge: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  catIconBadgeSelected: {
    backgroundColor: colors.brandBlue,
  },
  categoryTileText: {
    flex: 1,
    ...typography.caption,
    fontSize: 12,
    fontWeight: "700",
    color: colors.textInk,
  },
  categoryTileTextSelected: {
    color: colors.brandBlue,
    fontWeight: "800",
  },
  fieldBlock: {
    marginBottom: spacing.md,
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
  currencyPrefix: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.navy,
  },
  textInput: {
    flex: 1,
    ...typography.body,
    fontSize: 14,
    color: colors.textInk,
    fontWeight: "600",
  },
  amountInput: {
    fontSize: 18,
    fontWeight: "800",
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
    minHeight: 84,
  },
  receiptBox: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.brandBlue,
    borderRadius: radii.xl,
    padding: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.inputBackground,
    minHeight: 130,
    overflow: "hidden",
  },
  receiptBoxAttached: {
    borderColor: colors.successGreen,
    padding: 0,
  },
  receiptPreviewWrap: {
    width: "100%",
    height: 160,
    position: "relative",
  },
  receiptPreviewImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  receiptOverlayBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 21, 56, 0.85)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    gap: 6,
  },
  receiptOverlayText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "700",
  },
  receiptPlaceholder: {
    alignItems: "center",
  },
  receiptIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bluePastel,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  receiptTitle: {
    ...typography.heading,
    fontSize: 14,
    fontWeight: "800",
    color: colors.textInk,
  },
  receiptSubtitle: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
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
