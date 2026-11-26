import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing, typography } from "../../theme";

export interface KeypadProps {
  onPressDigit: (digit: string) => void;
  onPressDelete: () => void;
  leftSlot?: React.ReactNode;
  style?: ViewStyle;
  disabled?: boolean;
}

export const Keypad: React.FC<KeypadProps> = ({
  onPressDigit,
  onPressDelete,
  leftSlot,
  style,
  disabled = false,
}) => {
  const rows = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
  ];

  return (
    <View style={[styles.container, style]}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((digit) => (
            <TouchableOpacity
              key={digit}
              style={styles.key}
              onPress={() => onPressDigit(digit)}
              disabled={disabled}
              activeOpacity={0.65}
              accessibilityRole="button"
              accessibilityLabel={`Digit ${digit}`}
            >
              <Text style={styles.digitText}>{digit}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      {/* Bottom row: [leftSlot] [0] [delete] */}
      <View style={styles.row}>
        <View style={styles.bottomKeyContainer}>
          {leftSlot ? (
            leftSlot
          ) : (
            <View style={styles.emptySlot} />
          )}
        </View>

        <TouchableOpacity
          style={styles.key}
          onPress={() => onPressDigit("0")}
          disabled={disabled}
          activeOpacity={0.65}
          accessibilityRole="button"
          accessibilityLabel="Digit 0"
        >
          <Text style={styles.digitText}>0</Text>
        </TouchableOpacity>

        <View style={styles.bottomKeyContainer}>
          <TouchableOpacity
            style={styles.key}
            onPress={onPressDelete}
            disabled={disabled}
            activeOpacity={0.65}
            accessibilityRole="button"
            accessibilityLabel="Delete digit"
          >
            <Ionicons name="backspace-outline" size={24} color={colors.navy} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 340,
    alignSelf: "center",
    paddingHorizontal: spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  key: {
    flex: 1,
    height: 64,
    marginHorizontal: spacing.xs + 2,
    borderRadius: radii.lg,
    backgroundColor: colors.inputBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomKeyContainer: {
    flex: 1,
    marginHorizontal: spacing.xs + 2,
    alignItems: "center",
    justifyContent: "center",
  },
  emptySlot: {
    width: "100%",
    height: 64,
  },
  digitText: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "700",
    color: colors.textInk,
  },
});
