import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { colors, radii, spacing, typography } from "../../theme";

export interface TextFieldProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string | null;
  leadingIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  error,
  leadingIcon,
  containerStyle,
  isPassword = false,
  secureTextEntry,
  value,
  onChangeText,
  placeholder,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isSecure = isPassword ? !showPassword : secureTextEntry;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          Boolean(error) && styles.inputError,
        ]}
      >
        {leadingIcon ? <View style={styles.leadingSlot}>{leadingIcon}</View> : null}

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          secureTextEntry={isSecure}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCapitalize="none"
          {...rest}
        />

        {isPassword ? (
          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => setShowPassword((prev) => !prev)}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
          >
            <Text style={styles.toggleText}>{showPassword ? "HIDE" : "SHOW"}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.xs + 2,
  },
  inputContainer: {
    height: 52,
    minHeight: 44,
    borderRadius: radii.lg,
    backgroundColor: colors.inputBackground,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  inputFocused: {
    borderColor: colors.brandBlue,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.accentRed,
  },
  leadingSlot: {
    marginRight: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    height: "100%",
    ...typography.bodyMedium,
    color: colors.textInk,
  },
  toggleBtn: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  toggleText: {
    ...typography.label,
    color: colors.brandBlue,
  },
  errorText: {
    ...typography.caption,
    color: colors.accentRed,
    marginTop: spacing.xs,
  },
});
