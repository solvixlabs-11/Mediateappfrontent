import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { ScreenHeader } from "../../../shared/components/ScreenHeader";
import { Card } from "../../../shared/components/Card";
import { ScreenContainer } from "../../../shared/components/ScreenContainer";
import { StatusChip } from "../../../shared/components/StatusChip";
import { colors, radii, spacing, typography, shadows } from "../../../theme";

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
      <ScreenHeader
        title="Report Details"
        subtitle={group}
        variant="navy"
        onBack={navigation?.canGoBack ? () => navigation.goBack() : undefined}
      />
      <View style={styles.container}>
        <Card style={styles.card}>
          <View style={styles.iconCircle}>
            <Feather name="sliders" size={32} color={colors.brandBlue} />
          </View>

          <StatusChip status="Planned" label={`Status: ${phase}`} />

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.groupText}>Category: {group}</Text>

          <View style={styles.reasonBox}>
            <Feather name="info" size={18} color={colors.brandBlue} />
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
            <Feather name="arrow-left" size={16} color={colors.surface} />
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
    backgroundColor: colors.background,
  },
  card: {
    width: "100%",
    alignItems: "center",
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.soft,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.bluePastel,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title,
    fontSize: 20,
    fontWeight: "800",
    color: colors.textInk,
    textAlign: "center",
    marginTop: spacing.md,
    marginBottom: 4,
  },
  groupText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  reasonBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
    width: "100%",
    borderLeftWidth: 3,
    borderLeftColor: colors.brandBlue,
  },
  reasonText: {
    ...typography.body,
    fontSize: 13,
    color: colors.textInk,
    flex: 1,
  },
  subtext: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: spacing.xl,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.navy,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
    gap: spacing.sm,
    ...shadows.soft,
  },
  backButtonText: {
    ...typography.button,
    color: colors.surface,
    fontWeight: "800",
  },
});
