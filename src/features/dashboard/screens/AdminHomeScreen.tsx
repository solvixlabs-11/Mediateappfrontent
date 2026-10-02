import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuthStore } from "../../auth/store";
import {
  AdminLiveActivityResponse,
  MrLiveActivityItem,
  dashboardApi,
} from "../api/dashboardApi";
import { RootStackParamList } from "../../../navigation/types";
import { ROUTES } from "../../../navigation/routes";
import { colors, radii, spacing, typography } from "../../../shared/theme/tokens";

type FilterStatus = "ALL" | "VISITING" | "CHECKED_IN" | "IDLE" | "NOT_CHECKED_IN" | "ON_LEAVE";

export function AdminHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAuthStore((s) => s.user);

  const [data, setData] = useState<AdminLiveActivityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterStatus>("ALL");

  const loadLiveActivity = useCallback(async () => {
    try {
      const res = await dashboardApi.getAdminLiveActivity();
      setData(res);
    } catch (err) {
      console.warn("Failed to load live field activity:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLiveActivity();
  }, [loadLiveActivity]);

  // Auto-refresh every 60 seconds while screen is in focus (Section 8.2)
  useFocusEffect(
    useCallback(() => {
      loadLiveActivity();
      const interval = setInterval(() => {
        loadLiveActivity();
      }, 60000);
      return () => clearInterval(interval);
    }, [loadLiveActivity])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    loadLiveActivity();
  };

  // Filtered MRs
  const filteredMrs = useMemo(() => {
    if (!data?.mr_activities) return [];
    return data.mr_activities.filter((item) => {
      // Filter status
      if (selectedFilter !== "ALL" && item.status !== selectedFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.mr_name.toLowerCase().includes(query);
        const matchesCode = item.employee_code.toLowerCase().includes(query);
        const matchesTerritory = item.territory_name?.toLowerCase().includes(query);
        if (!matchesName && !matchesCode && !matchesTerritory) {
          return false;
        }
      }
      return true;
    });
  }, [data, selectedFilter, searchQuery]);

  const summary = data?.summary;
  const pending = data?.pending_approvals;

  // Status helper colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case "VISITING":
        return "#10B981"; // Emerald
      case "CHECKED_IN":
        return "#0E8C7F"; // Primary Teal
      case "IDLE":
        return "#F59E0B"; // Amber
      case "ON_LEAVE":
        return "#8B5CF6"; // Purple
      case "NOT_CHECKED_IN":
      default:
        return "#94A3B8"; // Slate Gray
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "VISITING":
        return "Visiting Customer";
      case "CHECKED_IN":
        return "Checked In";
      case "IDLE":
        return "Idle (2h+)";
      case "ON_LEAVE":
        return "On Leave";
      case "NOT_CHECKED_IN":
      default:
        return "Not Checked In";
    }
  };

  const renderHeader = () => (
    <View style={styles.headerSection}>
      {/* Top Greeting Bar */}
      <View style={styles.topBar}>
        <View style={styles.userCol}>
          <Text style={styles.greetingTitle}>
            {user?.role === "ADMIN" ? "Admin Operations Hub" : "Field Force Command"}
          </Text>
          <Text style={styles.greetingSubtitle}>
            Welcome back, {user?.fullName || "Manager"} • Mediate Healthcare
          </Text>
        </View>

        <View style={styles.topRightActions}>
          <View style={styles.dateChip}>
            <Ionicons name="calendar-outline" size={14} color={colors.primary} />
            <Text style={styles.dateChipText}>Today</Text>
          </View>
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() =>
              Alert.alert(
                "System Live Status",
                `All field synchronization services are operational. ${summary?.checked_in_count ?? 0} representatives currently in field.`
              )
            }
          >
            <Ionicons name="notifications-outline" size={20} color={colors.navy} />
            {(pending?.total_pending ?? 0) > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{pending?.total_pending}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary Strip (Horizontal Scroll) */}
      <View style={styles.summaryContainer}>
        <Text style={styles.sectionHeaderTitle}>Live Field Snapshot</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.summaryScroll}
        >
          {/* MRs In Field */}
          <View style={[styles.summaryTile, { borderLeftColor: colors.primary }]}>
            <View style={styles.summaryIconBox}>
              <Ionicons name="people" size={18} color={colors.primary} />
            </View>
            <Text style={styles.summaryTileValue}>
              {summary ? `${summary.checked_in_count}/${summary.total_mrs}` : "--"}
            </Text>
            <Text style={styles.summaryTileLabel}>MRs in Field</Text>
            <View style={styles.summarySubBadge}>
              <Text style={styles.summarySubBadgeText}>{summary?.attendance_pct ?? 0}% active</Text>
            </View>
          </View>

          {/* Total Calls Today */}
          <View style={[styles.summaryTile, { borderLeftColor: colors.navy }]}>
            <View style={[styles.summaryIconBox, { backgroundColor: "#EEF2FF" }]}>
              <Ionicons name="call" size={18} color={colors.navy} />
            </View>
            <Text style={styles.summaryTileValue}>{summary?.total_calls_today ?? 0}</Text>
            <Text style={styles.summaryTileLabel}>Total Calls Today</Text>
            <View style={[styles.summarySubBadge, { backgroundColor: "#EEF2FF" }]}>
              <Text style={[styles.summarySubBadgeText, { color: colors.navy }]}>
                Verified visits
              </Text>
            </View>
          </View>

          {/* Doctors Visited */}
          <View style={[styles.summaryTile, { borderLeftColor: "#2563EB" }]}>
            <View style={[styles.summaryIconBox, { backgroundColor: "#EFF6FF" }]}>
              <Ionicons name="medkit" size={18} color="#2563EB" />
            </View>
            <Text style={styles.summaryTileValue}>{summary?.doctors_visited ?? 0}</Text>
            <Text style={styles.summaryTileLabel}>Doctors Visited</Text>
            <View style={[styles.summarySubBadge, { backgroundColor: "#EFF6FF" }]}>
              <Text style={[styles.summarySubBadgeText, { color: "#2563EB" }]}>Core & Tier-1</Text>
            </View>
          </View>

          {/* Chemists Visited */}
          <View style={[styles.summaryTile, { borderLeftColor: "#7C3AED" }]}>
            <View style={[styles.summaryIconBox, { backgroundColor: "#F5F3FF" }]}>
              <Ionicons name="business" size={18} color="#7C3AED" />
            </View>
            <Text style={styles.summaryTileValue}>{summary?.chemists_visited ?? 0}</Text>
            <Text style={styles.summaryTileLabel}>Chemists Visited</Text>
            <View style={[styles.summarySubBadge, { backgroundColor: "#F5F3FF" }]}>
              <Text style={[styles.summarySubBadgeText, { color: "#7C3AED" }]}>Stock checks</Text>
            </View>
          </View>

          {/* Total POB Booked */}
          <View style={[styles.summaryTile, { borderLeftColor: "#059669" }]}>
            <View style={[styles.summaryIconBox, { backgroundColor: "#ECFDF5" }]}>
              <Ionicons name="cash" size={18} color="#059669" />
            </View>
            <Text style={styles.summaryTileValue}>
              ₹{summary ? summary.total_pob_today.toLocaleString("en-IN") : "0"}
            </Text>
            <Text style={styles.summaryTileLabel}>Total POB Booked</Text>
            <View style={[styles.summarySubBadge, { backgroundColor: "#ECFDF5" }]}>
              <Text style={[styles.summarySubBadgeText, { color: "#059669" }]}>Secondary orders</Text>
            </View>
          </View>

          {/* Not Checked In */}
          <View style={[styles.summaryTile, { borderLeftColor: "#EF4444" }]}>
            <View style={[styles.summaryIconBox, { backgroundColor: "#FEF2F2" }]}>
              <Ionicons name="alert-circle" size={18} color="#EF4444" />
            </View>
            <Text style={styles.summaryTileValue}>{summary?.not_checked_in_count ?? 0}</Text>
            <Text style={styles.summaryTileLabel}>Not Checked In</Text>
            <View style={[styles.summarySubBadge, { backgroundColor: "#FEF2F2" }]}>
              <Text style={[styles.summarySubBadgeText, { color: "#EF4444" }]}>Pending start</Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Pending Approvals Card (Section 8.2 item 5) */}
      <View style={styles.approvalsCard}>
        <View style={styles.approvalsHeader}>
          <View style={styles.approvalsTitleRow}>
            <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
            <Text style={styles.approvalsTitle}>Pending Approvals</Text>
          </View>
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => {
              // Navigate to Approvals inbox
              const parent = navigation.getParent();
              if (parent) {
                parent.navigate("Approvals" as never);
              } else {
                navigation.navigate(ROUTES.AppTabs as any);
              }
            }}
          >
            <Text style={styles.viewAllBtnText}>View Inbox ({pending?.total_pending ?? 0})</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.approvalsPillsRow}>
          <View style={[styles.approvalPill, { backgroundColor: "#EFF6FF" }]}>
            <Ionicons name="airplane-outline" size={16} color="#2563EB" />
            <Text style={[styles.approvalPillValue, { color: "#2563EB" }]}>
              {pending?.tours_count ?? 0}
            </Text>
            <Text style={styles.approvalPillLabel}>Tours</Text>
          </View>

          <View style={[styles.approvalPill, { backgroundColor: "#ECFDF5" }]}>
            <Ionicons name="receipt-outline" size={16} color="#059669" />
            <Text style={[styles.approvalPillValue, { color: "#059669" }]}>
              {pending?.expenses_count ?? 0}
            </Text>
            <Text style={styles.approvalPillLabel}>Expenses</Text>
          </View>

          <View style={[styles.approvalPill, { backgroundColor: "#FEF3C7" }]}>
            <Ionicons name="time-outline" size={16} color="#D97706" />
            <Text style={[styles.approvalPillValue, { color: "#D97706" }]}>
              {pending?.leaves_count ?? 0}
            </Text>
            <Text style={styles.approvalPillLabel}>Leaves</Text>
          </View>
        </View>
      </View>

      {/* Live Field Activity Section Header & Controls */}
      <View style={styles.activityHeader}>
        <View style={styles.activityTitleRow}>
          <Text style={styles.activitySectionTitle}>Live Field Activity</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{filteredMrs.length} MRs</Text>
          </View>
        </View>

        {/* Search Input */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={colors.grey} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search representative, EMP code, territory..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.grey}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={16} color={colors.grey} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {(
            [
              { key: "ALL", label: "All MRs" },
              { key: "VISITING", label: "Visiting" },
              { key: "CHECKED_IN", label: "Checked In" },
              { key: "IDLE", label: "Idle" },
              { key: "NOT_CHECKED_IN", label: "Not Checked In" },
              { key: "ON_LEAVE", label: "On Leave" },
            ] as const
          ).map((filter) => {
            const isSelected = selectedFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setSelectedFilter(filter.key)}
              >
                <Text
                  style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );

  const renderMrCard = ({ item }: { item: MrLiveActivityItem }) => {
    const statusColor = getStatusColor(item.status);
    const progressPercent = Math.min(100, Math.round((item.calls_count / item.calls_target) * 100));

    return (
      <View style={styles.mrCard}>
        {/* Top Card Row */}
        <View style={styles.mrCardHeader}>
          {/* Avatar with Status Ring */}
          <View style={[styles.avatarRing, { borderColor: statusColor }]}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarText}>
                {item.mr_name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Name & Details */}
          <View style={styles.mrInfoCol}>
            <View style={styles.nameRow}>
              <Text style={styles.mrName} numberOfLines={1}>
                {item.mr_name}
              </Text>
              <View style={[styles.statusChip, { backgroundColor: `${statusColor}18` }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusChipText, { color: statusColor }]}>
                  {getStatusLabel(item.status)}
                </Text>
              </View>
            </View>

            <View style={styles.subInfoRow}>
              <Text style={styles.employeeCode}>{item.employee_code}</Text>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.territoryName} numberOfLines={1}>
                {item.territory_name || "Assigned Territory"}
              </Text>
              {item.check_in_time && (
                <>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.checkInTime}>
                    In:{" "}
                    {new Date(item.check_in_time).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Progress Bar (Calls vs Target) */}
        <View style={styles.progressContainer}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>Calls Completed</Text>
            <Text style={styles.progressValue}>
              {item.calls_count} / {item.calls_target} calls ({progressPercent}%)
            </Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progressPercent}%`,
                  backgroundColor: progressPercent >= 100 ? "#10B981" : colors.primary,
                },
              ]}
            />
          </View>
        </View>

        {/* Stat Pills */}
        <View style={styles.statPillsRow}>
          <View style={styles.statPill}>
            <Ionicons name="medkit-outline" size={12} color={colors.navy} />
            <Text style={styles.statPillText}>Doctors: {item.doctors_count}</Text>
          </View>
          <View style={styles.statPill}>
            <Ionicons name="business-outline" size={12} color="#7C3AED" />
            <Text style={styles.statPillText}>Chemists: {item.chemists_count}</Text>
          </View>
          <View style={styles.statPill}>
            <Ionicons name="gift-outline" size={12} color="#059669" />
            <Text style={styles.statPillText}>Samples: {item.samples_count}</Text>
          </View>
        </View>

        {/* Last Activity Line */}
        <View style={styles.lastActivityRow}>
          <View style={styles.activityTextCol}>
            <Text style={styles.lastActivityText} numberOfLines={1}>
              {item.last_activity_text || "No activity logged yet"}
            </Text>
            {item.last_activity_minutes_ago !== null && (
              <Text style={styles.timeAgoText}>
                {item.last_activity_minutes_ago === 0
                  ? "Just now"
                  : `${item.last_activity_minutes_ago}m ago`}
              </Text>
            )}
          </View>

          <View style={styles.activityActions}>
            <View
              style={[
                styles.verifiedChip,
                { backgroundColor: item.is_verified ? "#ECFDF5" : "#FEF3C7" },
              ]}
            >
              <Ionicons
                name={item.is_verified ? "checkmark-circle" : "alert-circle"}
                size={12}
                color={item.is_verified ? "#059669" : "#D97706"}
              />
              <Text
                style={[
                  styles.verifiedChipText,
                  { color: item.is_verified ? "#059669" : "#D97706" },
                ]}
              >
                {item.is_verified ? "Verified" : "Unverified"}
              </Text>
            </View>

            {item.latitude && item.longitude && (
              <TouchableOpacity
                style={styles.locationPinBtn}
                onPress={() =>
                  Alert.alert(
                    `${item.mr_name} Location`,
                    `GPS Lat: ${item.latitude?.toFixed(5)}, Lng: ${item.longitude?.toFixed(5)}\nStatus: ${getStatusLabel(item.status)}`
                  )
                }
              >
                <Ionicons name="location" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={48} color={colors.grey} />
      <Text style={styles.emptyTitle}>No field representatives match</Text>
      <Text style={styles.emptySubtitle}>
        Try changing the active status filter or search query above.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <RNStatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching real-time field activity...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMrs}
          keyExtractor={(item) => String(item.user_id)}
          renderItem={renderMrCard}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  listContent: {
    paddingBottom: 40,
  },
  headerSection: {
    backgroundColor: colors.surface,
    paddingTop: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  userCol: {
    flex: 1,
    marginRight: spacing.sm,
  },
  greetingTitle: {
    ...typography.title,
    fontSize: 20,
    color: colors.navy,
  },
  greetingSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  topRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  dateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${colors.primary}12`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  dateChipText: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.primary,
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  bellBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#EF4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  summaryContainer: {
    marginTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  sectionHeaderTitle: {
    ...typography.caption,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: colors.navy,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  summaryScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  summaryTile: {
    width: 140,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
  },
  summaryIconBox: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    backgroundColor: `${colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  summaryTileValue: {
    ...typography.subheading,
    fontSize: 16,
    fontWeight: "800",
    color: colors.navy,
  },
  summaryTileLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "600",
    marginTop: 2,
  },
  summarySubBadge: {
    alignSelf: "flex-start",
    backgroundColor: `${colors.primary}12`,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: radii.sm,
    marginTop: 4,
  },
  summarySubBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.primary,
  },
  approvalsCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  approvalsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  approvalsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  approvalsTitle: {
    ...typography.subheading,
    fontSize: 14,
    fontWeight: "700",
    color: colors.navy,
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  viewAllBtnText: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.primary,
  },
  approvalsPillsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  approvalPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: radii.sm,
  },
  approvalPillValue: {
    fontSize: 14,
    fontWeight: "800",
  },
  approvalPillLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  activityHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  activityTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  activitySectionTitle: {
    ...typography.title,
    fontSize: 16,
    color: colors.navy,
  },
  countBadge: {
    backgroundColor: `${colors.navy}10`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.navy,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: spacing.xs,
    fontSize: 13,
    color: colors.textPrimary,
  },
  filterScroll: {
    marginTop: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  mrCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  mrCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatarRing: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    borderWidth: 2.5,
    justifyContent: "center",
    alignItems: "center",
    padding: 2,
  },
  avatarInner: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    backgroundColor: `${colors.primary}18`,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.primary,
  },
  mrInfoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mrName: {
    ...typography.subheading,
    fontSize: 14,
    fontWeight: "700",
    color: colors.navy,
    flex: 1,
    marginRight: spacing.xs,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: radii.full,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: "700",
  },
  subInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  employeeCode: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.navy,
  },
  bulletDot: {
    fontSize: 10,
    color: colors.grey,
    marginHorizontal: 4,
  },
  territoryName: {
    fontSize: 11,
    color: colors.textSecondary,
    maxWidth: 120,
  },
  checkInTime: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
  },
  progressContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  progressValue: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.navy,
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: `${colors.border}`,
    borderRadius: radii.full,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: radii.full,
  },
  statPillsRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statPillText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.navy,
  },
  lastActivityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: `${colors.border}80`,
  },
  activityTextCol: {
    flex: 1,
    marginRight: spacing.sm,
  },
  lastActivityText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  timeAgoText: {
    fontSize: 10,
    color: colors.grey,
    marginTop: 1,
  },
  activityActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  verifiedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  verifiedChipText: {
    fontSize: 9,
    fontWeight: "700",
  },
  locationPinBtn: {
    width: 26,
    height: 26,
    borderRadius: radii.full,
    backgroundColor: `${colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    ...typography.subheading,
    color: colors.navy,
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
});
