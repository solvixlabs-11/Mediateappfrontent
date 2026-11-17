import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors, radii, spacing } from "../../../shared/theme/tokens";

interface LoginFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  rememberMe: boolean;
  setRememberMe: (val: boolean) => void;
  isLoading: boolean;
  errorMessage: string | null;
  onSubmit: () => void;
  onForgotPassword: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  rememberMe,
  setRememberMe,
  isLoading,
  errorMessage,
  onSubmit,
  onForgotPassword,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  return (
    <View style={styles.floatingCardContainer}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeading}>Sign In to Workspace</Text>
          <Text style={styles.cardCaption}>
            Enter your registered ID to synchronize tours, customers & DCR
          </Text>
        </View>

        {/* Email Input Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.fieldLabel}>CORPORATE EMAIL / ID</Text>
          <View
            style={[
              styles.inputFieldContainer,
              emailFocused && styles.inputFocused,
            ]}
          >
            <View style={styles.fieldIconBox}>
              <Text style={styles.fieldIconText}>✉️</Text>
            </View>
            <TextInput
              style={styles.innerTextInput}
              placeholder="e.g. user@mediatehealthcare.com"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Password Input Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.fieldLabel}>PASSWORD</Text>
          <View
            style={[
              styles.inputFieldContainer,
              passwordFocused && styles.inputFocused,
            ]}
          >
            <View style={styles.fieldIconBox}>
              <Text style={styles.fieldIconText}>🔒</Text>
            </View>
            <TextInput
              style={styles.innerTextInput}
              placeholder="••••••••••••"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword((prev) => !prev)}
              style={styles.toggleVisibilityBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.toggleVisibilityText}>
                {showPassword ? "HIDE" : "SHOW"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Options Row: Remember Me & Forgot Password */}
        <View style={styles.optionsRow}>
          <TouchableOpacity
            onPress={() => setRememberMe(!rememberMe)}
            activeOpacity={0.8}
            style={styles.rememberMeBtn}
          >
            <View
              style={[
                styles.checkbox,
                rememberMe && styles.checkboxActive,
              ]}
            >
              {rememberMe ? <Text style={styles.checkmarkText}>✓</Text> : null}
            </View>
            <Text style={styles.rememberMeLabel}>Remember me</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onForgotPassword}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Inline Error Banner */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Action Button */}
        <TouchableOpacity
          onPress={onSubmit}
          activeOpacity={0.85}
          disabled={isLoading}
          style={[styles.primaryCtaButton, isLoading && styles.primaryCtaDisabled]}
        >
          {isLoading ? (
            <View style={styles.btnLoadingRow}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.primaryCtaText}>Authenticating...</Text>
            </View>
          ) : (
            <View style={styles.btnContentRow}>
              <Text style={styles.primaryCtaText}>Sign In to App</Text>
              <View style={styles.arrowCircle}>
                <Text style={styles.arrowText}>→</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingCardContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: -20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.xl,
    shadowColor: "#1B64DA",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#D8E4F2",
  },
  cardHeader: {
    marginBottom: spacing.lg,
  },
  cardHeading: {
    fontSize: 19,
    fontWeight: "700",
    color: colors.navy,
  },
  cardCaption: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  inputFieldContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: "#F0FDFA",
  },
  fieldIconBox: {
    marginRight: spacing.sm,
  },
  fieldIconText: {
    fontSize: 15,
  },
  innerTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  toggleVisibilityBtn: {
    paddingLeft: spacing.sm,
    paddingVertical: spacing.xs,
  },
  toggleVisibilityText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
    marginBottom: spacing.lg,
  },
  rememberMeBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    backgroundColor: "#FFFFFF",
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmarkText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    marginTop: -1,
  },
  rememberMeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    color: "#B91C1C",
    fontWeight: "500",
  },
  primaryCtaButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryCtaDisabled: {
    opacity: 0.7,
  },
  btnContentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  btnLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  primaryCtaText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  arrowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.sm,
  },
  arrowText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    marginTop: -2,
  },
});

