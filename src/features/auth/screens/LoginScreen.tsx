import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLogin } from "../hooks/useLogin";
import { useToastStore } from "../../../shared/components/Toast";
import { colors, spacing } from "../../../shared/theme/tokens";
import { API_BASE_URL, apiClient } from "../../../api/client";
import { authApi, DemoAccount } from "../api/authApi";
import { DEV_DEMO_ACCOUNTS } from "../../../mocks/demoAccounts";
import { LoginHeroBanner } from "../components/LoginHeroBanner";
import { LoginForm } from "../components/LoginForm";
import { DemoSwitcherPill } from "../components/DemoSwitcherPill";
import { LoginFooter } from "../components/LoginFooter";

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // Dynamic backend metadata
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const [selectedRoleCode, setSelectedRoleCode] = useState<string>("MR");
  const [isServerOnline, setIsServerOnline] = useState<boolean | null>(null);

  const { login, isLoading, errorMessage } = useLogin();
  const showToast = useToastStore((s: { showToast: any }) => s.showToast);

  // Load dynamic configuration from backend
  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        const config = await authApi.getConfig();
        if (isMounted) {
          if (config.demo_accounts && config.demo_accounts.length > 0) {
            setDemoAccounts(config.demo_accounts);
            const defaultAcc =
              config.demo_accounts.find((a) => a.role === "MR") || config.demo_accounts[0];
            setEmail(defaultAcc.email);
            setPassword(defaultAcc.password);
            setSelectedRoleCode(defaultAcc.role);
          } else if (process.env.EXPO_PUBLIC_DEV_LOGIN === "true") {
            setDemoAccounts(DEV_DEMO_ACCOUNTS);
            const defaultAcc = DEV_DEMO_ACCOUNTS.find((a) => a.role === "MR") || DEV_DEMO_ACCOUNTS[0];
            setEmail(defaultAcc.email);
            setPassword(defaultAcc.password);
            setSelectedRoleCode(defaultAcc.role);
          }
          setIsServerOnline(true);
        }
      } catch (err: any) {
        if (isMounted) {
          setIsServerOnline(false);
          if (process.env.EXPO_PUBLIC_DEV_LOGIN === "true") {
            setDemoAccounts(DEV_DEMO_ACCOUNTS);
            const defaultAcc = DEV_DEMO_ACCOUNTS[0];
            setEmail(defaultAcc.email);
            setPassword(defaultAcc.password);
            setSelectedRoleCode(defaultAcc.role);
          }
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
      await apiClient.get("/api/v1/health");
      setIsServerOnline(true);
      showToast("Server is connected and operational", "success");
    } catch {
      try {
        await apiClient.get("/health");
        setIsServerOnline(true);
        showToast("Server is connected and operational", "success");
      } catch (err: any) {
        const errDetail = err?.message || err?.code || "Unreachable";
        setIsServerOnline(false);
        showToast(`Cannot reach ${API_BASE_URL} (${errDetail})`, "error");
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <LoginHeroBanner
            isServerOnline={isServerOnline}
            onCheckHealth={checkServerHealth}
          />

          <LoginForm
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            rememberMe={rememberMe}
            setRememberMe={setRememberMe}
            isLoading={isLoading}
            errorMessage={errorMessage}
            onSubmit={handleFormLogin}
            onForgotPassword={() =>
              showToast(
                "To reset password, contact your Area Manager or Mediate IT desk.",
                "info"
              )
            }
          />

          {process.env.EXPO_PUBLIC_DEV_LOGIN === "true" && (
            <DemoSwitcherPill
              demoAccounts={demoAccounts}
              selectedRoleCode={selectedRoleCode}
              onSelectDemo={handleSelectDemo}
            />
          )}

          <LoginFooter />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#EBF3FC",
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
});
