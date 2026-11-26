import React, { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { useAuthStore } from "./src/features/auth/store";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { ErrorBoundary } from "./src/shared/components/ErrorBoundary";
import { Toast } from "./src/shared/components/Toast";
import { getDatabase } from "./src/shared/services/sqlite";
import { SplashScreen } from "./src/features/auth/screens/SplashScreen";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function App() {
  const initializeAuth = useAuthStore((s) => s.initializeAuth);
  const [showSplash, setShowSplash] = useState(true);

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    // Initialize SQLite & outbox table
    getDatabase().catch((err) => {
      console.error("Failed to initialize SQLite:", err);
    });

    // Restore authentication session from SecureStore
    initializeAuth().catch((err) => {
      console.error("Failed to initialize Auth:", err);
    });
  }, [initializeAuth]);

  if (showSplash) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <RootNavigator />
          <Toast />
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
