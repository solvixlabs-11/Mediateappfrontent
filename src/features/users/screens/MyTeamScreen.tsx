import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usersApi } from "../api/usersApi";
import { UserDetail } from "../types";
import { Card } from "../../../shared/components/Card";
import { Header } from "../../../shared/components/Header";
import { ScreenContainer } from "../../../shared/components/ScreenContainer";
import { StatusChip } from "../../../shared/components/StatusChip";
import { colors, radii, spacing, typography } from "../../../shared/theme/tokens";

export function MyTeamScreen() {
  const [team, setTeam] = useState<UserDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTeam = useCallback(async () => {
    try {
      const data = await usersApi.getMyTeam();
      setTeam(data);
    } catch {
      // Handled silently or empty state
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchTeam();
  };

  const handleCall = (phone?: string | null) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const renderItem = ({ item }: { item: UserDetail }) => (
    <Card style={styles.memberCard}>
      <View style={styles.memberHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitials}>
            {item.full_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase()}
          </Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.full_name}</Text>
          <Text style={styles.memberRole}>Medical Representative</Text>
        </View>
        <StatusChip status="APPROVED" label="Active" />
      </View>

      <View style={styles.divider} />

      <View style={styles.contactDetails}>
        <TouchableOpacity
          style={styles.contactRow}
          onPress={() => handleEmail(item.email)}
          activeOpacity={0.7}
        >
          <Ionicons name="mail-outline" size={16} color={colors.primary} />
          <Text style={styles.contactText}>{item.email}</Text>
        </TouchableOpacity>

        {item.phone && (
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => handleCall(item.phone)}
            activeOpacity={0.7}
          >
            <Ionicons name="call-outline" size={16} color={colors.primary} />
            <Text style={styles.contactText}>{item.phone}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.actionButtons}>
        {item.phone && (
          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={() => handleCall(item.phone)}
          >
            <Ionicons name="call" size={14} color={colors.surface} />
            <Text style={styles.actionBtnPrimaryText}>Call MR</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.actionBtnSecondary}
          onPress={() => handleEmail(item.email)}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.navy} />
          <Text style={styles.actionBtnSecondaryText}>Send Email</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <ScreenContainer>
      <Header
        title="My Team"
        subtitle={`Active Field Force (${team.length} MRs)`}
      />

      {/* Summary KPI Banner */}
      <View style={styles.kpiBanner}>
        <View style={styles.kpiItem}>
          <Text style={styles.kpiValue}>{team.length}</Text>
          <Text style={styles.kpiLabel}>Assigned MRs</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiItem}>
          <Text style={[styles.kpiValue, { color: colors.success }]}>
            {team.filter((m) => m.is_active).length}
          </Text>
          <Text style={styles.kpiLabel}>Active Today</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading assigned team...</Text>
        </View>
      ) : (
        <FlatList
          data={team}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={colors.grey} />
              <Text style={styles.emptyTitle}>No Team Members Assigned</Text>
              <Text style={styles.emptyText}>
                No Medical Representatives are currently assigned to your team. Contact administrator to allocate MRs.
              </Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  kpiBanner: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kpiItem: {
    flex: 1,
    alignItems: "center",
  },
  kpiDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.navy,
  },
  kpiLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  memberCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  memberHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.navy,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "700",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    ...typography.subheading,
    color: colors.navy,
  },
  memberRole: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  contactDetails: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  contactText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  actionButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
  },
  actionBtnPrimaryText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: "600",
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.greyLight,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
  },
  actionBtnSecondaryText: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.subheading,
    color: colors.navy,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
