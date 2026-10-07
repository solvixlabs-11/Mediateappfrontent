import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Header } from "../../../shared/components/Header";
import { Card } from "../../../shared/components/Card";
import { ScreenContainer } from "../../../shared/components/ScreenContainer";
import { StatusChip } from "../../../shared/components/StatusChip";
import { colors, radii, spacing, typography } from "../../../shared/theme/tokens";

export interface ComingSoonScreenProps {
  featureName?: string;
  phase?: string;
  group?: string;
  reason?: string;
}

export const ComingSoonScreen: React.FC<ComingSoonScreenProps> = (props) => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const title = props.featureName || route.params?.featureName || route.params?.reportTitle || "Report Details";
  const group = props.group || route.params?.group || "Reports";
  const phase = props.phase || route.params?.phase || route.params?.status || "Coming Soon";
  const reason =
    props.reason ||
    route.params?.reason ||
    route.params?.comingSoonReason ||
    "This report requires upcoming operational or transaction data modules before activation.";

  return (
    <ScreenContainer>
      <Header
        title="Report Details"
        subtitle={group}
        showBack={navigation?.canGoBack ? navigation.canGoBack() : true}
        onBack={() => navigation?.goBack?.()}
      />
      <View style={styles.container}>
        <Card style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="construct-outline" size={36} color={colors.primary} />
          </View>

          <StatusChip status="Planned" label={`Status: ${phase}`} />

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.groupText}>Category: {group}</Text>

          <View style={styles.reasonBox}>
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.reasonText}>{reason}</Text>
          </View>

          <Text style={styles.subtext}>
            This report is fully registered in the Mediate reports catalog and will activate automatically once the corresponding data pipeline is connected.
          </Text>

          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.8}
            onPress={() => navigation?.goBack?.()}
          >
            <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
            <Text style={styles.backButtonText}>Back to Reports Catalog</Text>
          </TouchableOpacity>
        </Card>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  card: {
    width: "100%",
    alignItems: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#E6F4F1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.navy,
    textAlign: "center",
    marginTop: spacing.md,
    marginBottom: 4,
  },
  groupText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  reasonBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
    width: "100%",
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  reasonText: {
    ...typography.body,
    fontSize: 13,
    color: colors.navy,
    flex: 1,
  },
  subtext: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    gap: spacing.xs,
  },
  backButtonText: {
    ...typography.button,
    color: "#FFFFFF",
  },
});
