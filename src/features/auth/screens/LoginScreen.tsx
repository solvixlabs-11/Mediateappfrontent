import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiClient } from "../../../api/client";
import { useToastStore } from "../../../shared/components/Toast";
import { colors, radii, spacing, typography } from "../../../shared/theme/tokens";
import { authApi, DemoAccount } from "../api/authApi";
import { useLogin } from "../hooks/useLogin";

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Dynamic backend metadata
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const [projectName, setProjectName] = useState("Mediate MR");
  const [selectedRoleCode, setSelectedRoleCode] = useState<string>("MR");
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [isServerOnline, setIsServerOnline] = useState<boolean | null>(null);

  // Input focus states for micro-animations
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const { login, isLoading, errorMessage } = useLogin();
  const showToast = useToastStore((s) => s.showToast);

  // Load dynamic configuration from backend
  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        const config = await authApi.getConfig();
        if (isMounted) {
          if (config.project_name) {
            setProjectName(config.project_name);
          }
          if (config.demo_accounts && config.demo_accounts.length > 0) {
            setDemoAccounts(config.demo_accounts);
            const defaultAcc =
              config.demo_accounts.find((a) => a.role === "MR") || config.demo_accounts[0];
            setEmail(defaultAcc.email);
            setPassword(defaultAcc.password);
            setSelectedRoleCode(defaultAcc.role);
          }
          setIsServerOnline(true);
        }
      } catch {
        if (isMounted) {
          setIsServerOnline(false);
        }
      }
    };

    fetchConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFormLogin = async () => {
    if (!email.trim() || !password) {
      showToast("Please enter both email and password", "warning");
      return;
    }
    await login({
      email: email.trim(),
      password,
    });
  };

  const handleSelectDemo = (demo: DemoAccount) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setSelectedRoleCode(demo.role);
    showToast(`Loaded ${demo.label || demo.role} credentials`, "info");
  };

  const checkServerHealth = async () => {
    try {
      await apiClient.get("/health");
      setIsServerOnline(true);
      showToast("Server is connected and operational", "success");
    } catch {
      setIsServerOnline(false);
      showToast("Backend unreachable. Please verify LAN/Wi-Fi connection.", "error");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#12355B" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Executive Hero Banner with Depth */}
          <View style={styles.heroBackground}>
            {/* Ambient decorative glowing circles */}
            <View style={styles.glowCircle1} />
            <View style={styles.glowCircle2} />

            {/* Top Bar with Server Status Pill */}
            <View style={styles.topBar}>
              <View style={styles.appTagBadge}>
                <Text style={styles.appTagText}>ENTERPRISE FIELD FORCE</Text>
              </View>

              <TouchableOpacity
                onPress={checkServerHealth}
                activeOpacity={0.8}
                style={[
                  styles.statusPill,
                  isServerOnline === false && styles.statusPillOffline,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    isServerOnline === true
                      ? styles.statusDotOnline
                      : isServerOnline === false
                      ? styles.statusDotOffline
                      : styles.statusDotChecking,
                  ]}
                />
                <Text style={styles.statusPillText}>
                  {isServerOnline === true
                    ? "Live"
                    : isServerOnline === false
                    ? "Retry"
                    : "Connecting"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Premium Brand Emblem & Titles */}
            <View style={styles.brandHero}>
              <View style={styles.logoHalo}>
                <View style={styles.logoBadge}>
                  {/* Medical Stethoscope/Shield Cross Emblem */}
                  <View style={styles.emblemCrossV} />
                  <View style={styles.emblemCrossH} />
                  <View style={styles.emblemCenterDot} />
                </View>
              </View>

              <Text style={styles.heroTitle}>{projectName}</Text>
              <Text style={styles.heroSubtitle}>Intelligent Pharma CRM & Field Automation</Text>
            </View>
          </View>

          {/* Floating High-Contrast Login Card */}
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
                  <InputBase
                    placeholder="e.g. rahul@mediatehealthcare.com"
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
                  <InputBase
                    placeholder="••••••••••••"
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
                  onPress={() =>
                    showToast(
                      "To reset password, contact your Area Manager or Mediate IT desk.",
                      "info"
                    )
                  }
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
                onPress={handleFormLogin}
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

          {/* Discreet Developer Profile Switcher (Guarded by EXPO_PUBLIC_DEV_LOGIN per Rule M-19) */}
          {process.env.EXPO_PUBLIC_DEV_LOGIN === "true" && demoAccounts.length > 0 ? (
            <View style={styles.devContainer}>
              <TouchableOpacity
                onPress={() => setShowDevPanel((v) => !v)}
                style={styles.devHeaderToggle}
                activeOpacity={0.7}
              >
                <Text style={styles.devHeaderToggleText}>
                  {showDevPanel ? "✕ Close Quick Switcher" : "⚡ Switch Demo Profile"}
                </Text>
              </TouchableOpacity>

              {showDevPanel ? (
                <View style={styles.devCard}>
                  <Text style={styles.devHelpNote}>
                    Select role to auto-fill credentials for testing:
                  </Text>
                  <View style={styles.demoPillsRow}>
                    {demoAccounts.map((acc) => {
                      const isSelected = selectedRoleCode === acc.role;
                      return (
                        <TouchableOpacity
                          key={acc.role}
                          onPress={() => handleSelectDemo(acc)}
                          style={[
                            styles.demoRolePill,
                            isSelected && styles.demoRolePillActive,
                          ]}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              styles.demoRolePillText,
                              isSelected && styles.demoRolePillTextActive,
                            ]}
                          >
                            {acc.role}
                          </Text>
                          <Text
                            style={[
                              styles.demoRolePillSub,
                              isSelected && styles.demoRolePillSubActive,
                            ]}
                          >
                            {acc.label ? acc.label.split(" ")[0] : acc.role}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Compliance & Security Footer */}
          <View style={styles.footerContainer}>
            <View style={styles.securityBadge}>
              <Text style={styles.lockIcon}>🛡️</Text>
              <Text style={styles.securityText}>256-Bit SSL Encrypted Enterprise Gateway</Text>
            </View>
            <Text style={styles.copyrightText}>
              © 2026 Mediate Healthcare Pvt. Ltd. • All Rights Reserved
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Clean unstyled base text input to allow complete wrapper styling
interface InputBaseProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
}

const InputBase: React.FC<InputBaseProps> = (props) => {
  const { TextInput } = require("react-native");
  return (
    <TextInput
      style={styles.innerTextInput}
      placeholderTextColor="#94A3B8"
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#12355B",
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },

  // Hero Section
  heroBackground: {
    backgroundColor: "#12355B",
    paddingTop: spacing.md,
    paddingBottom: 48,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    position: "relative",
    overflow: "hidden",
  },
  glowCircle1: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(14, 140, 127, 0.18)",
    top: -60,
    right: -40,
  },
  glowCircle2: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(30, 111, 217, 0.14)",
    bottom: -30,
    left: -20,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  appTagBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
  },
  appTagText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#A5F3FC",
    letterSpacing: 0.8,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  statusPillOffline: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderColor: "rgba(239, 68, 68, 0.4)",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusDotOnline: {
    backgroundColor: "#10B981",
  },
  statusDotOffline: {
    backgroundColor: "#EF4444",
  },
  statusDotChecking: {
    backgroundColor: "#F59E0B",
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Brand Hero
  brandHero: {
    alignItems: "center",
    marginTop: spacing.xs,
  },
  logoHalo: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: "rgba(14, 140, 127, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: "rgba(14, 140, 127, 0.6)",
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  emblemCrossV: {
    position: "absolute",
    width: 9,
    height: 28,
    backgroundColor: "#FFFFFF",
    borderRadius: 4.5,
  },
  emblemCrossH: {
    position: "absolute",
    width: 28,
    height: 9,
    backgroundColor: "#FFFFFF",
    borderRadius: 4.5,
  },
  emblemCenterDot: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primaryDark,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#93C5FD",
    marginTop: 4,
    letterSpacing: 0.2,
  },

  // Floating Card
  floatingCardContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: -28,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.xl,
    shadowColor: "#0E8C7F",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
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

  // Inputs
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

  // Options Row
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

  // Error Banner
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

  // Primary Action Button
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

  // Discreet Dev Panel
  devContainer: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    alignItems: "center",
  },
  devHeaderToggle: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    backgroundColor: "rgba(14, 140, 127, 0.08)",
  },
  devHeaderToggleText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primary,
  },
  devCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: spacing.md,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  devHelpNote: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: "500",
  },
  demoPillsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  demoRolePill: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  demoRolePillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  demoRolePillText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.navy,
  },
  demoRolePillTextActive: {
    color: "#FFFFFF",
  },
  demoRolePillSub: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 2,
  },
  demoRolePillSubActive: {
    color: "rgba(255, 255, 255, 0.8)",
  },

  // Footer
  footerContainer: {
    alignItems: "center",
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.full,
    marginBottom: spacing.xs,
  },
  lockIcon: {
    fontSize: 11,
    marginRight: 6,
  },
  securityText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  copyrightText: {
    fontSize: 10,
    color: "#94A3B8",
    textAlign: "center",
  },
});
