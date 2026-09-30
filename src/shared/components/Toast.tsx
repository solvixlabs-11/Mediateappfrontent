import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { create } from "zustand";
import { colors, radii, spacing, typography } from "../theme/tokens";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
  showToast: (message: string, type?: ToastType, durationMs?: number) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  visible: false,
  message: "",
  type: "info",
  showToast: (message: string, type: ToastType = "info", durationMs: number = 3000) => {
    set({ visible: true, message, type });
    setTimeout(() => {
      set({ visible: false });
    }, durationMs);
  },
  hideToast: () => set({ visible: false }),
}));

export const Toast: React.FC = () => {
  const { visible, message, type } = useToastStore();

  if (!visible) {
    return null;
  }

  const bgColors: Record<ToastType, string> = {
    success: colors.success,
    error: colors.danger,
    warning: colors.warning,
    info: colors.info,
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColors[type] }]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 40,
    left: spacing.lg,
    right: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  text: {
    ...typography.bodyMedium,
    color: "#FFFFFF",
    textAlign: "center",
  },
});
