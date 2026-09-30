import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { apiClient } from "../../../api/client";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { ScreenContainer } from "../../../shared/components/ScreenContainer";
import { StatusChip } from "../../../shared/components/StatusChip";
import { useToastStore } from "../../../shared/components/Toast";
import { colors, radii, spacing, typography } from "../../../shared/theme/tokens";
import { Role, useAuthStore } from "../store";

export const LoginScreen: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<Role>("MR");
  const [testingHealth, setTestingHealth] = useState(false);
  const [healthStatus, setHealthStatus] = useState<string | null>(null);

  const setAuth = useAuthStore((s) => s.setAuth);
  const showToast = useToastStore((s) => s.showToast);

  const handleDevLogin = async () => {
    await setAuth(
      {
        id: 1,
        email: `${selectedRole.toLowerCase()}@mediatehealthcare.com`,
        fullName: `Demo ${selectedRole}`,
        role: selectedRole,
      },
      "dev-access-token",
      "dev-refresh-token"
    );
    showToast(`Logged in as ${selectedRole}`, "success");
  };

  const handleTestBackendHealth = async () => {
    setTestingHealth(true);
    try {
      const res = await apiClient.get("/health");
      setHealthStatus(`OK: v${res.data.version} (${res.data.status})`);
      showToast("Connected to Backend successfully!", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      setHealthStatus(`Error: ${msg}`);
      showToast(`Backend check failed: ${msg}`, "error");
    } finally {
      setTestingHealth(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logoTitle}>Mediate MR</Text>
          <Text style={styles.subtitle}>Field Force Automation</Text>
        </View>

        <Card>
          <Text style={styles.cardHeading}>Select Role for Dev Preview</Text>
          <View style={styles.roleRow}>
            {(["MR", "MANAGER", "ADMIN"] as Role[]).map((r) => (
              <Button
                key={r}
                title={r}
                variant={selectedRole === r ? "primary" : "secondary"}
                onPress={() => setSelectedRole(r)}
                style={styles.roleButton}
              />
            ))}
          </View>

          <Button
            title={`Enter App as ${selectedRole}`}
            onPress={handleDevLogin}
            style={styles.loginButton}
          />
        </Card>

        <Card>
          <Text style={styles.cardHeading}>Backend LAN Health Test (P0-M-07)</Text>
          <Text style={styles.apiInfo}>
            URL: {process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:8000"}
          </Text>

          <Button
            title="Check Backend /health"
            variant="secondary"
            loading={testingHealth}
            onPress={handleTestBackendHealth}
            style={styles.healthButton}
          />

          {healthStatus ? (
            <View style={styles.healthResult}>
              <StatusChip
                status={healthStatus.startsWith("OK") ? "Verified" : "Rejected"}
                label={healthStatus}
              />
            </View>
          ) : null}
        </Card>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  logoTitle: {
    ...typography.title,
    fontSize: 28,
    color: colors.navy,
  },
  subtitle: {
    ...typography.body,
    color: colors.primary,
    marginTop: spacing.xs,
    fontWeight: "600",
  },
  cardHeading: {
    ...typography.subheading,
    color: colors.navy,
    marginBottom: spacing.md,
  },
  roleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  roleButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  loginButton: {
    marginTop: spacing.xs,
  },
  apiInfo: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  healthButton: {
    marginBottom: spacing.md,
  },
  healthResult: {
    alignItems: "center",
  },
});
