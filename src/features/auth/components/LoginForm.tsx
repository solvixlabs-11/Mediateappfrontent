import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, radii, spacing, typography } from "../../../theme";
import { TextField } from "../../../shared/components/TextField";
import { PrimaryButton } from "../../../shared/components/PrimaryButton";

export interface LoginFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  rememberMe?: boolean;
  setRememberMe?: (val: boolean) => void;
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
  isLoading,
  errorMessage,
  onSubmit,
  onForgotPassword,
}) => {
  return (
    <View style={styles.sheetContainer}>
      <Text style={styles.sheetTitle}>Sign in</Text>

      {/* Email Input */}
      <TextField
        label="WORK EMAIL"
        value={email}
        onChangeText={setEmail}
        placeholder="pranjal@mediatehealthcare.com"
        keyboardType="email-address"
        autoCapitalize="none"
        leadingIcon={<Feather name="mail" size={19} color={colors.textFaint} />}
      />

      {/* Password Input */}
      <TextField
        label="PASSWORD"
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••••"
        isPassword
        leadingIcon={<Feather name="lock" size={19} color={colors.textFaint} />}
      />

      {/* Forgot Password Link */}
      <View style={styles.forgotRow}>
        <TouchableOpacity
          onPress={onForgotPassword}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>
      </View>

      {/* Inline Error Message */}
      {errorMessage ? (
        <View style={styles.errorBanner}>
          <Feather name="alert-circle" size={16} color={colors.accentRed} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* Sign in Button */}
      <PrimaryButton
        title="Sign in"
        onPress={onSubmit}
        isLoading={isLoading}
        variant="navy"
        style={styles.signInButton}
      />

      {/* First Time Only Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>first time only</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Note */}
      <Text style={styles.firstTimeNote}>
        After your first sign in you will create a 4-digit MPIN for{"\n"}faster, secure access.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  sheetTitle: {
    ...typography.title,
    fontSize: 24,
    fontWeight: "800",
    color: colors.textInk,
    marginBottom: 20,
  },
  forgotRow: {
    alignItems: "flex-end",
    marginBottom: 20,
    marginTop: -4,
  },
  forgotText: {
    ...typography.bodyMedium,
    color: colors.brandBlue,
    fontWeight: "700",
    fontSize: 13,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accentRedPastel,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    ...typography.caption,
    color: colors.accentRed,
    fontWeight: "600",
    marginLeft: spacing.sm,
    flex: 1,
  },
  signInButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.navy,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  dividerText: {
    ...typography.caption,
    color: colors.textMuted,
    marginHorizontal: spacing.md,
    fontWeight: "500",
    fontSize: 12,
  },
  firstTimeNote: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
    textAlign: "center",
    paddingHorizontal: spacing.sm,
  },
});
