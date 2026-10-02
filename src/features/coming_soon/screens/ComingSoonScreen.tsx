import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "../../../shared/components/Card";
import { ScreenContainer } from "../../../shared/components/ScreenContainer";
import { StatusChip } from "../../../shared/components/StatusChip";
import { colors, spacing, typography } from "../../../shared/theme/tokens";

import { useRoute } from "@react-navigation/native";

export interface ComingSoonScreenProps {
  featureName?: string;
  phase?: string;
}

export const ComingSoonScreen: React.FC<ComingSoonScreenProps> = (props) => {
  const route = useRoute<any>();
  const featureName = props.featureName || route.params?.featureName || "Coming Soon";
  const phase = props.phase || route.params?.phase || "In Progress";
  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Card style={styles.card}>
          <StatusChip status="Planned" label={phase} />
          <Text style={styles.title}>{featureName}</Text>
          <Text style={styles.description}>
            This module is scheduled for implementation in {phase}.
          </Text>
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
    padding: spacing.md,
  },
  card: {
    width: "100%",
    alignItems: "center",
    paddingVertical: spacing.xxl,
  },
  title: {
    ...typography.title,
    color: colors.navy,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
  },
});
