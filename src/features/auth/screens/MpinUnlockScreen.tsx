import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing, typography } from "../../../theme";
import { PinDots } from "../../../shared/components/PinDots";
import { Keypad } from "../../../shared/components/Keypad";
import { useAuthStore } from "../store";

export interface MpinUnlockScreenProps {
  onComplete?: (pin: string) => Promise<boolean> | boolean | void;
  onBiometric?: () => void;
  onForgot?: () => void;
  onUsePassword?: () => void;
  isBiometricAvailable?: boolean;
}

export const MpinUnlockScreen: React.FC<MpinUnlockScreenProps> = ({
  onComplete,
  onBiometric,
  onForgot,
  onUsePassword,
  isBiometricAvailable = true,
}) => {
  const user = useAuthStore((s) => s.user);
  const [pin, setPin] = useState("");
  const [hasError, setHasError] = useState(false);

  // Compute initials and first name dynamically from existing user state
  const fullName = user?.fullName || "User";
  const firstName = fullName.split(" ")[0];
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "MR";

  const territoryOrRole = `${user?.role || "MR"}`;

  const handlePressDigit = async (digit: string) => {
    if (pin.length >= 4) return;
    setHasError(false);

    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === 4) {
      if (onComplete) {
        const result = await onComplete(newPin);
        if (result === false) {
          setHasError(true);
          setTimeout(() => {
            setPin("");
          }, 500);
        }
      } else {
        // Clearly marked stub handler (UI-only implementation)
        console.log("[STUB] MPIN entered:", newPin);
      }
    }
  };

  const handlePressDelete = () => {
    setHasError(false);
    setPin((prev) => prev.slice(0, -1));
  };

  const handleBiometricPress = () => {
    if (onBiometric) {
      onBiometric();
    } else {
      // Clearly marked stub handler
      console.log("[STUB] Biometric unlock requested");
    }
  };

  const handleForgotMpin = () => {
    if (onForgot) {
      onForgot();
    } else {
      // Clearly marked stub handler
      console.log("[STUB] Forgot MPIN tapped");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Navy Rounded Header */}
      <LinearGradient
        colors={["#27339A", "#1B2470"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.header}
      >
        {/* White Rounded Logo Card */}
        <View style={styles.logoCard}>
          <Image
            source={require("../../../../assets/logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* User Initials Avatar */}
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>

        {/* Welcome Back & Subtitle */}
        <Text style={styles.welcomeTitle}>Welcome back, {firstName}</Text>
        <Text style={styles.userSubtitle}>{territoryOrRole}</Text>
      </LinearGradient>

      {/* MPIN Input Section */}
      <View style={styles.content}>
        <Text style={styles.enterPinLabel}>Enter your MPIN</Text>

        <PinDots value={pin} hasError={hasError} />

        {/* Keypad with fingerprint key in bottom-left */}
        <Keypad
          onPressDigit={handlePressDigit}
          onPressDelete={handlePressDelete}
          leftSlot={
            isBiometricAvailable ? (
              <TouchableOpacity
                style={styles.biometricKey}
                onPress={handleBiometricPress}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Unlock with biometric fingerprint"
              >
                <Ionicons name="finger-print" size={28} color={colors.brandBlue} />
              </TouchableOpacity>
            ) : undefined
          }
        />

        {/* Bottom Links: Forgot MPIN & Use password */}
        <View style={styles.bottomLinksRow}>
          <TouchableOpacity
            onPress={handleForgotMpin}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.linkText}>Forgot MPIN?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onUsePassword}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.linkText}>Use password</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    paddingTop: 56,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  logoCard: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  logoImage: {
    width: 130,
    height: 32,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  avatarInitials: {
    ...typography.heading,
    fontSize: 22,
    fontWeight: "800",
    color: colors.navy,
  },
  welcomeTitle: {
    ...typography.heading,
    fontSize: 20,
    fontWeight: "800",
    color: colors.surface,
    marginBottom: 4,
  },
  userSubtitle: {
    ...typography.caption,
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.75)",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  enterPinLabel: {
    ...typography.subheading,
    fontSize: 15,
    fontWeight: "600",
    color: colors.textMuted,
  },
  biometricKey: {
    width: "100%",
    height: 64,
    borderRadius: radii.lg,
    backgroundColor: colors.bluePastel,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomLinksRow: {
    width: "100%",
    maxWidth: 340,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    marginTop: spacing.md,
  },
  linkText: {
    ...typography.bodyMedium,
    fontSize: 14,
    fontWeight: "700",
    color: colors.brandBlue,
  },
});
