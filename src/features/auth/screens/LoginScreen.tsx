import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLogin } from "../hooks/useLogin";
import { useToastStore } from "../../../shared/components/Toast";
import { colors } from "../../../theme";
import { API_BASE_URL, apiClient } from "../../../api/client";
import { authApi, DemoAccount } from "../api/authApi";
import { LoginHeroBanner } from "../components/LoginHeroBanner";
import { LoginForm } from "../components/LoginForm";
import { DemoSwitcherPill } from "../components/DemoSwitcherPill";
import { LoginFooter } from "../components/LoginFooter";
import { CreateMpinScreen } from "./CreateMpinScreen";
import { MpinUnlockScreen } from "./MpinUnlockScreen";
import { FirstSyncScreen } from "./FirstSyncScreen";
import { secureStorage } from "../../../shared/services/secureStore";
import { useAuthStore } from "../store";

type AuthScreenMode = "password_login" | "mpin_unlock" | "create_mpin" | "first_sync";

export const LoginScreen: React.FC = () => {
  const [mode, setMode] = useState<AuthScreenMode>("password_login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // Dynamic backend metadata
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const [selectedRoleCode, setSelectedRoleCode] = useState<string>("MR");
  const [isServerOnline, setIsServerOnline] = useState<boolean | null>(null);

  const { login, isLoading, errorMessage } = useLogin();
  const showToast = useToastStore((s: { showToast: any }) => s.showToast);

  // Check if an MPIN exists in secure storage
  useEffect(() => {
    secureStorage.getMpin().then((storedPin) => {
      if (storedPin && storedPin.length === 4) {
        setMode("mpin_unlock");
      }
    });
  }, []);

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

    const success = await login({
      email: email.trim(),
      password,
    });

    if (success) {
      // Check if MPIN is already created
      const storedPin = await secureStorage.getMpin();
      if (!storedPin) {
        setMode("create_mpin");
      } else {
        setMode("first_sync");
      }
    }
  };

  const handleMpinCreated = async (pin: string) => {
    await secureStorage.setMpin(pin);
    showToast("MPIN created successfully! Setting up workspace...", "success");
    setMode("first_sync");
  };

  const handleMpinUnlockComplete = async (enteredPin: string): Promise<boolean> => {
    const storedPin = await secureStorage.getMpin();
    if (storedPin && enteredPin === storedPin) {
      showToast("MPIN verified successfully!", "success");
      // Unlock using existing auth session or default login
      if (email && password) {
        await login({ email, password });
      } else {
        // Fallback demo account login if available
        const defaultAcc = demoAccounts[0];
        if (defaultAcc) {
          await login({ email: defaultAcc.email, password: defaultAcc.password });
        }
      }
      return true;
    } else {
      showToast("Incorrect MPIN. Please try again or use password.", "error");
      return false;
    }
  };

  const handleFirstSyncComplete = () => {
    // Sync complete, AppTabs are displayed automatically via isAuthenticated store
    showToast("Workspace ready!", "success");
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

  // Render MPIN Unlock Screen (Screenshot 3)
  if (mode === "mpin_unlock") {
    return (
      <MpinUnlockScreen
        onComplete={handleMpinUnlockComplete}
        onUsePassword={() => setMode("password_login")}
        onForgot={async () => {
          await secureStorage.clearMpin();
          showToast("Sign in with your email & password to set a new MPIN.", "info");
          setMode("password_login");
        }}
        onBiometric={() => {
          showToast("Biometric verification requested", "info");
          console.log("[STUB] Biometric unlock invoked");
        }}
        isBiometricAvailable={true}
      />
    );
  }

  // Render Create MPIN Screen (Screenshot 2)
  if (mode === "create_mpin") {
    return (
      <CreateMpinScreen
        onBack={() => setMode("password_login")}
        onMpinCreated={handleMpinCreated}
      />
    );
  }

  // Render First Sync Screen (Screenshot 4)
  if (mode === "first_sync") {
    return <FirstSyncScreen onComplete={handleFirstSyncComplete} />;
  }

  // Render Password Sign In Screen (Screenshot 1)
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: colors.surface,
  },
});
