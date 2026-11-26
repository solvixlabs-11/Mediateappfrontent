import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
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
import { tasksApi } from "../api/tasksApi";
import { ScreenHeader } from "../../../shared/components/ScreenHeader";
import { colors, radii, spacing, typography, shadows } from "../../../theme";

interface TaskFormModalProps {
  visible: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  visible,
  onClose,
  onTaskCreated,
}) => {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [priority, setPriority] = useState<string>("MEDIUM");
  const [customerType, setCustomerType] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Required", "Please provide a task title.");
      return;
    }

    try {
      setIsSubmitting(true);
      await tasksApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        due_date: dueDate,
        priority: priority,
        customer_type: customerType || undefined,
      });

      setTitle("");
      setDescription("");
      setDueDate(new Date().toISOString().split("T")[0]);
      setPriority("MEDIUM");
      setCustomerType(null);
      onTaskCreated();
    } catch (err) {
      console.error("Failed to create task:", err);
      Alert.alert("Error", "Could not create task. Please verify inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <StatusBar style="light" />
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScreenHeader
            title="New Task"
            subtitle="Create field reminder or follow-up"
            variant="navy"
            onBack={onClose}
          />

          <ScrollView
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Card 1: Task Details */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardIconBox}>
                  <Feather name="check-square" size={16} color={colors.brandBlue} />
                </View>
                <Text style={styles.cardTitle}>Task Information</Text>
              </View>

              <Text style={styles.label}>
                Task Title <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Deliver sample batch to Dr. Sharma"
                placeholderTextColor={colors.textFaint}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add key objectives, discussion points or notes..."
                placeholderTextColor={colors.textFaint}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>
                Due Date (YYYY-MM-DD) <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWithIcon}>
                <Feather name="calendar" size={16} color={colors.textMuted} />
                <TextInput
                  style={styles.inputInner}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textFaint}
                  value={dueDate}
                  onChangeText={setDueDate}
                />
              </View>
            </View>

            {/* Card 2: Priority & Linked Entity */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconBox, { backgroundColor: colors.orangePastel }]}>
                  <Feather name="flag" size={16} color={colors.orange} />
                </View>
                <Text style={styles.cardTitle}>Priority & Category</Text>
              </View>

              <Text style={styles.label}>Priority Level</Text>
              <View style={styles.chipsRow}>
                {(["LOW", "MEDIUM", "HIGH", "URGENT"] as const).map((p) => {
                  const isSelected = priority === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.chipBtn,
                        isSelected && styles.priorityChipSelected,
                      ]}
                      onPress={() => setPriority(p)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}
                      >
                        {p}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>Link Customer Type (Optional)</Text>
              <View style={styles.chipsRow}>
                {(["DOCTOR", "CHEMIST", "HOSPITAL", "STOCKIST"] as const).map((c) => {
                  const isSelected = customerType === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.chipBtn,
                        isSelected && styles.customerChipSelected,
                      ]}
                      onPress={() => setCustomerType(isSelected ? null : c)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}
                      >
                        {c}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <>
                  <Feather name="plus-circle" size={18} color={colors.surface} />
                  <Text style={styles.submitBtnText}>Create Task</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  formContent: {
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
    marginBottom: spacing.sm,
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
  label: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: "700",
    color: colors.navy,
    marginBottom: 6,
    marginTop: spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  required: {
    color: colors.accentRed,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    fontSize: 14,
    color: colors.textInk,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
    gap: spacing.sm,
  },
  inputInner: {
    flex: 1,
    ...typography.body,
    fontSize: 14,
    color: colors.textInk,
  },
  textArea: {
    minHeight: 84,
    textAlignVertical: "top",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: 2,
  },
  chipBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  priorityChipSelected: {
    backgroundColor: colors.brandBlue,
    borderColor: colors.brandBlue,
  },
  customerChipSelected: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  chipText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
  },
  chipTextSelected: {
    color: colors.surface,
    fontWeight: "800",
  },
  submitBtn: {
    flexDirection: "row",
    backgroundColor: colors.navy,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    ...shadows.soft,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    ...typography.button,
    color: colors.surface,
    fontSize: 15,
    fontWeight: "800",
  },
});
