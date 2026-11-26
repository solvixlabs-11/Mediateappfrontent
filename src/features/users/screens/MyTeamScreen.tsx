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
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { usersApi } from "../api/usersApi";
import { UserDetail } from "../types";
import { colors, radii, shadows, spacing, typography } from "../../../theme";
import { ScreenHeader } from "../../../shared/components/ScreenHeader";

export function MyTeamScreen() {
  const navigation = useNavigation<any>();
  const [team, setTeam] = useState<UserDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTeam = useCallback(async () => {
    try {
      const data = await usersApi.getMyTeam();
      setTeam(data);
    } catch {
      // Handled silently
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

  const renderItem = ({ item }: { item: UserDetail }) => {
    const initials = item.full_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    return (
      <View style={styles.memberCard}>
        <View style={styles.memberHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{item.full_name}</Text>
            <Text style={styles.memberRole}>
              {item.role?.code === "MR"
                ? "Medical Representative"
                : item.role?.name || "Field Officer"}
            </Text>
          </View>
          <View style={[styles.statusBadge, item.is_active ? styles.statusActive : styles.statusInactive]}>
            <Text style={[styles.statusBadgeText, item.is_active ? styles.statusActiveText : styles.statusInactiveText]}>
              {item.is_active ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.contactDetails}>
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => handleEmail(item.email)}
            activeOpacity={0.7}
          >
            <Feather name="mail" size={14} color={colors.brandBlue} />
            <Text style={styles.contactText} numberOfLines={1}>
              {item.email}
            </Text>
          </TouchableOpacity>

          {item.phone ? (
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => handleCall(item.phone)}
              activeOpacity={0.7}
            >
              <Feather name="phone" size={14} color={colors.teal} />
              <Text style={styles.contactText}>{item.phone}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.actionButtons}>
          {item.phone ? (
            <TouchableOpacity
              style={styles.actionBtnCall}
              onPress={() => handleCall(item.phone)}
              activeOpacity={0.8}
            >
              <Feather name="phone-call" size={14} color={colors.surface} />
              <Text style={styles.actionBtnCallText}>Call</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={styles.actionBtnEmail}
            onPress={() => handleEmail(item.email)}
            activeOpacity={0.8}
          >
            <Feather name="mail" size={14} color={colors.brandBlue} />
            <Text style={styles.actionBtnEmailText}>Send Email</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader
        title="My Team"
        subtitle={`Field force (${team.length} members)`}
        variant="navy"
        onBack={navigation?.canGoBack && navigation.canGoBack() ? () => navigation.goBack() : undefined}
        rightElement={
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={onRefresh}
            activeOpacity={0.7}
            accessibilityLabel="Refresh team list"
          >
            <Feather name="refresh-cw" size={18} color={colors.surface} />
          </TouchableOpacity>
        }
      />

      {/* KPI Summary Banner */}
      <View style={styles.kpiBanner}>
        <View style={styles.kpiItem}>
          <Text style={styles.kpiValue}>{team.length}</Text>
          <Text style={styles.kpiLabel}>Assigned Staff</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiItem}>
          <Text style={[styles.kpiValue, { color: colors.teal }]}>
            {team.filter((m) => m.is_active).length}
          </Text>
          <Text style={styles.kpiLabel}>Active Today</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.navy} />
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
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.navy} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Feather name="users" size={32} color={colors.brandBlue} />
              </View>
              <Text style={styles.emptyTitle}>No Team Members Assigned</Text>
              <Text style={styles.emptyText}>
                No field representatives are currently assigned to your team roster.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  kpiBanner: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  kpiItem: {
    flex: 1,
    alignItems: "center",
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textInk,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    marginTop: 2,
  },
  kpiDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  memberCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  memberHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.surface,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textInk,
  },
  memberRole: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  statusActive: {
    backgroundColor: colors.tealPastel,
  },
  statusInactive: {
    backgroundColor: colors.border,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statusActiveText: {
    color: colors.teal,
  },
  statusInactiveText: {
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.background,
    marginVertical: spacing.sm,
  },
  contactDetails: {
    gap: 6,
    marginBottom: spacing.sm,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contactText: {
    fontSize: 13,
    color: colors.textMuted,
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionBtnCall: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.navy,
    paddingVertical: 10,
    borderRadius: radii.lg,
  },
  actionBtnCallText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.surface,
  },
  actionBtnEmail: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.bluePastel,
    paddingVertical: 10,
    borderRadius: radii.lg,
  },
  actionBtnEmailText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.brandBlue,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: spacing.xl,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.bluePastel,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textInk,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
});
