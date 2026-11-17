import React from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NotificationItemExtended } from "./NotificationCard";

interface NotificationRejectionModalProps {
  visible: boolean;
  item: NotificationItemExtended | null;
  reason: string;
  onChangeReason: (val: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function NotificationRejectionModal({
  visible,
  item,
  reason,
  onChangeReason,
  onClose,
  onSubmit,
  isSubmitting,
}: NotificationRejectionModalProps) {
  if (!visible || !item) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.rejectSheetContent}>
          <View style={styles.rejectSheetHeader}>
            <View style={styles.rejectSheetTitleCol}>
              <Text style={styles.rejectSheetTitle}>Reject Approval Request</Text>
              <Text style={styles.rejectSheetSubtitle} numberOfLines={1}>
                {item.title}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.rejectInputLabel}>Reason for Rejection (Required) *</Text>
          <TextInput
            style={styles.rejectInput}
            placeholder="e.g. Fare claims exceed city allowance ceiling. Please re-submit with bills."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            value={reason}
            onChangeText={onChangeReason}
          />

          <View style={styles.rejectSheetActions}>
            <TouchableOpacity
              style={styles.rejectCancelBtn}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.rejectCancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.rejectConfirmBtn,
                !reason.trim() && styles.rejectConfirmBtnDisabled,
              ]}
              onPress={onSubmit}
              disabled={isSubmitting || !reason.trim()}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.rejectConfirmBtnText}>Submit Rejection</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  rejectSheetContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  rejectSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  rejectSheetTitleCol: {
    flex: 1,
    marginRight: 12,
  },
  rejectSheetTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  rejectSheetSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  rejectInputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  rejectInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    fontSize: 13,
    color: "#0F172A",
    textAlignVertical: "top",
    marginBottom: 16,
  },
  rejectSheetActions: {
    flexDirection: "row",
    gap: 10,
  },
  rejectCancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
  },
  rejectCancelBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  rejectConfirmBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#E22122",
  },
  rejectConfirmBtnDisabled: {
    backgroundColor: "#FCA5A5",
  },
  rejectConfirmBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

