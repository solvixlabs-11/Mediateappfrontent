import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import { colors, radii, spacing, typography } from "../../../theme";
import { PinDots } from "../../../shared/components/PinDots";
import { Keypad } from "../../../shared/components/Keypad";

export interface CreateMpinScreenProps {
  onBack?: () => void;
  onMpinCreated?: (pin: string) => void;
}

export const CreateMpinScreen: React.FC<CreateMpinScreenProps> = ({
  onBack,
  onMpinCreated,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [firstPin, setFirstPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const activePin = step === 1 ? firstPin : confirmPin;

  const handlePressDigit = (digit: string) => {
    if (activePin.length >= 4) return;
    setHasError(false);
    setErrorMessage("");

    const newPin = activePin + digit;

    if (step === 1) {
      setFirstPin(newPin);
      if (newPin.length === 4) {
        // Move to step 2 after brief delay
        setTimeout(() => {
          setStep(2);
        }, 200);
      }
    } else {
      setConfirmPin(newPin);
      if (newPin.length === 4) {
        if (newPin === firstPin) {
          // MPIN match confirmed!
          if (onMpinCreated) {
            onMpinCreated(newPin);
          }
        } else {
          // Shake and show error
          setHasError(true);
          setErrorMessage("MPIN does not match. Try again.");
          setTimeout(() => {
            setConfirmPin("");
          }, 600);
        }
      }
    }
  };

  const handlePressDelete = () => {
    setHasError(false);
    setErrorMessage("");
    if (step === 1) {
      setFirstPin((prev) => prev.slice(0, -1));
    } else {
      setConfirmPin((prev) => prev.slice(0, -1));
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setConfirmPin("");
      setHasError(false);
      setErrorMessage("");
    } else if (onBack) {
      onBack();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Top Header: Back Button & Step Indicator */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Go back"
        >
          <Feather name="chevron-left" size={24} color={colors.textInk} />
        </TouchableOpacity>

        <Text style={styles.stepText}>Step {step} of 2</Text>
      </View>

      <View style={styles.content}>
        {/* Pale Blue Lock Icon Tile */}
        <View style={styles.lockTile}>
          <Feather name="lock" size={24} color={colors.navy} />
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {step === 1 ? "Create your MPIN" : "Confirm your MPIN"}
        </Text>

        {/* Helper Line */}
        <Text style={styles.helperText}>
          {step === 1
            ? "Choose 4 digits you will remember. Use it to open the app quickly next time."
            : "Re-enter the 4-digit MPIN you just chose to confirm."}
        </Text>

        {/* 4 PinDots */}
        <PinDots value={activePin} hasError={hasError} />

        {/* Hint or Error Text */}
        <Text style={[styles.hintText, hasError && styles.errorText]}>
          {hasError
            ? errorMessage
            : step === 1
            ? "Avoid 1234 or your birth year"
            : "Enter same digits as step 1"}
        </Text>
      </View>

      {/* Custom Keypad */}
      <View style={styles.keypadWrapper}>
        <Keypad
          onPressDigit={handlePressDigit}
          onPressDelete={handlePressDelete}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.inputBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: "700",
    color: colors.brandBlue,
  },
  content: {
    alignItems: "flex-start",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  lockTile: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.bluePastel,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.titleLarge,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: colors.textInk,
    marginBottom: spacing.sm,
  },
  helperText: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  hintText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: "500",
    color: colors.textFaint,
    alignSelf: "center",
    textAlign: "center",
  },
  errorText: {
    color: colors.accentRed,
    fontWeight: "600",
  },
  keypadWrapper: {
    paddingBottom: spacing.xl,
  },
});
