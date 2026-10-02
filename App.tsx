import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "./src/features/auth/store";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { ErrorBoundary } from "./src/shared/components/ErrorBoundary";
import { Toast } from "./src/shared/components/Toast";
import { getDatabase } from "./src/shared/services/sqlite";

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
