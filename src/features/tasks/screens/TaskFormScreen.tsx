import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { tasksApi } from "../api/tasksApi";
import { colors, radii, spacing, typography } from "../../../shared/theme/tokens";

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

      // Reset
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
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Task / Reminder</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={styles.formContent}>
            {/* Title */}
            <Text style={styles.label}>Task Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Deliver sample batch to Dr. Sharma"
              placeholderTextColor={colors.textSecondary}
              value={title}
              onChangeText={setTitle}
            />

            {/* Description */}
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add key objectives, discussion points or notes..."
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            {/* Due Date */}
            <Text style={styles.label}>Due Date (YYYY-MM-DD) *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
              value={dueDate}
              onChangeText={setDueDate}
            />

            {/* Priority Selector */}
            <Text style={styles.label}>Priority Level</Text>
            <View style={styles.chipsRow}>
              {(["LOW", "MEDIUM", "HIGH", "URGENT"] as const).map((p) => {
                const isSelected = priority === p;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[styles.priorityChip, isSelected && styles.priorityChipSelected]}
                    onPress={() => setPriority(p)}
                  >
                    <Text
                      style={[
                        styles.priorityChipText,
                        isSelected && styles.priorityChipTextSelected,
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Customer Type Selector */}
            <Text style={styles.label}>Link Customer Type (Optional)</Text>
            <View style={styles.chipsRow}>
              {(["DOCTOR", "CHEMIST", "HOSPITAL", "STOCKIST"] as const).map((c) => {
                const isSelected = customerType === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.customerChip, isSelected && styles.customerChipSelected]}
                    onPress={() => setCustomerType(isSelected ? null : c)}
                  >
                    <Text
                      style={[
                        styles.customerChipText,
                        isSelected && styles.customerChipTextSelected,
                      ]}
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.submitBtnText}>Create Task</Text>
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
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  formContent: {
    padding: spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.textPrimary,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.xs,
  },
  priorityChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  priorityChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  priorityChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  priorityChipTextSelected: {
    color: colors.surface,
  },
  customerChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  customerChipSelected: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  customerChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  customerChipTextSelected: {
    color: colors.surface,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.xl,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "700",
  },
});
