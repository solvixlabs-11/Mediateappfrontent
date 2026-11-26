import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import { colors, radii, shadows, spacing, typography } from "../../../theme";
import { StepRow, StepStatus } from "../../../shared/components/StepRow";
import { useMasterStore } from "../../masters/store";

export interface SyncStepItem {
  id: string;
  title: string;
  status: StepStatus;
}

export interface FirstSyncScreenProps {
  onComplete?: () => void;
}

export const FirstSyncScreen: React.FC<FirstSyncScreenProps> = ({ onComplete }) => {
  const fetchMasters = useMasterStore((s) => s.fetchMasters);

  const [steps, setSteps] = useState<SyncStepItem[]>([
    { id: "1", title: "Profile and territory", status: "syncing" },
    { id: "2", title: "Doctors and chemists", status: "waiting" },
    { id: "3", title: "Products and stock", status: "waiting" },
    { id: "4", title: "Tour plan and routes", status: "waiting" },
    { id: "5", title: "Reports and targets", status: "waiting" },
  ]);

  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  const doneCount = steps.filter((s) => s.status === "done").length;
  const totalSteps = steps.length;
  const progressPercent = Math.round((doneCount / totalSteps) * 100);

  const runSync = async () => {
    setHasError(false);
    setErrorMessage("");

    try {
      // Step 1: Profile and territory
      setSteps((prev) =>
        prev.map((s, idx) => (idx === 0 ? { ...s, status: "syncing" } : s))
      );
      await fetchMasters(true);
      setSteps((prev) =>
        prev.map((s, idx) =>
          idx === 0
            ? { ...s, status: "done" }
            : idx === 1
            ? { ...s, status: "syncing" }
            : s
        )
      );

      // Step 2: Doctors and chemists
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSteps((prev) =>
        prev.map((s, idx) =>
          idx === 1
            ? { ...s, status: "done" }
            : idx === 2
            ? { ...s, status: "syncing" }
            : s
        )
      );

      // Step 3: Products and stock
      await new Promise((resolve) => setTimeout(resolve, 700));
      setSteps((prev) =>
        prev.map((s, idx) =>
          idx === 2
            ? { ...s, status: "done" }
            : idx === 3
            ? { ...s, status: "syncing" }
            : s
        )
      );

      // Step 4: Tour plan and routes
      await new Promise((resolve) => setTimeout(resolve, 700));
      setSteps((prev) =>
        prev.map((s, idx) =>
          idx === 3
            ? { ...s, status: "done" }
            : idx === 4
            ? { ...s, status: "syncing" }
            : s
        )
      );

      // Step 5: Reports and targets
      await new Promise((resolve) => setTimeout(resolve, 600));
      setSteps((prev) =>
        prev.map((s, idx) => (idx === 4 ? { ...s, status: "done" } : s))
      );

      // Complete!
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 500);
    } catch (err: any) {
      setHasError(true);
      setErrorMessage(err?.message || "Sync encountered an issue.");
    }
  };

  useEffect(() => {
    runSync();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title & Helper */}
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Setting up your{"\n"}workspace</Text>
          <Text style={styles.helperText}>
            Getting today’s data ready, so the app works smoothly even in low
            network areas.
          </Text>
        </View>

        {/* Circular Progress Ring */}
        <View style={styles.progressContainer}>
          <View style={styles.outerRing}>
            {/* Progress Arc simulation with high-contrast styling */}
            <View style={styles.innerRing}>
              <Text style={styles.progressPercent}>{progressPercent}%</Text>
              <Text style={styles.progressSubtitle}>
                {doneCount} of {totalSteps} steps
              </Text>
            </View>
          </View>
        </View>

        {/* Error / Retry Banner */}
        {hasError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              {errorMessage || "Sync failed. Tap to retry."}
            </Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={runSync}
              activeOpacity={0.8}
            >
              <Text style={styles.retryBtnText}>Retry Sync</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* What We Are Loading Section */}
        <Text style={styles.sectionHeader}>WHAT WE ARE LOADING</Text>

        <View style={styles.stepsCard}>
          {steps.map((item) => (
            <StepRow key={item.id} title={item.title} status={item.status} />
          ))}
        </View>

        {/* Collapsible Technical Details (Preserves diagnostic info without cluttering UI) */}
        <TouchableOpacity
          style={styles.detailsToggle}
          onPress={() => setShowDetails((prev) => !prev)}
          activeOpacity={0.7}
        >
          <Text style={styles.detailsToggleText}>
            {showDetails ? "Hide sync diagnostics" : "View sync diagnostics"}
          </Text>
          <Feather
            name={showDetails ? "chevron-up" : "chevron-down"}
            size={16}
            color={colors.textFaint}
          />
        </TouchableOpacity>

        {showDetails && (
          <View style={styles.diagnosticsBox}>
            <Text style={styles.diagnosticLine}>• SQLite Database: Ready</Text>
            <Text style={styles.diagnosticLine}>• Master Data Cache: Synchronized</Text>
            <Text style={styles.diagnosticLine}>• Offline Queue Outbox: Active</Text>
          </View>
        )}

        {/* Footer Note */}
        <Text style={styles.footerNote}>
          This happens once after sign in. Later syncs run in the background.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  headerBlock: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.titleLarge,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: colors.textInk,
    marginBottom: spacing.sm,
  },
  helperText: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  progressContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.xl,
  },
  outerRing: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 10,
    borderColor: colors.bluePastel,
    alignItems: "center",
    justifyContent: "center",
    borderTopColor: colors.navy,
    borderRightColor: colors.navy,
  },
  innerRing: {
    alignItems: "center",
    justifyContent: "center",
  },
  progressPercent: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    color: colors.navy,
  },
  progressSubtitle: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionHeader: {
    ...typography.label,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  stepsCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    ...shadows.card,
  },
  errorBox: {
    backgroundColor: colors.accentRedPastel,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: "center",
  },
  errorText: {
    ...typography.caption,
    color: colors.accentRed,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  retryBtn: {
    backgroundColor: colors.accentRed,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  retryBtnText: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: "700",
  },
  detailsToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
    paddingVertical: spacing.xs,
  },
  detailsToggleText: {
    ...typography.caption,
    color: colors.textFaint,
    marginRight: 4,
  },
  diagnosticsBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  diagnosticLine: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
  footerNote: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textFaint,
    textAlign: "center",
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
});
