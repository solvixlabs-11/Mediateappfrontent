import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { TaskDto, TaskSummaryDto, tasksApi } from "../api/tasksApi";
import { colors, radii, shadows, spacing, typography } from "../../../theme";
import { ScreenHeader } from "../../../shared/components/ScreenHeader";
import { TaskDetailModal } from "./TaskDetailScreen";
import { TaskFormModal } from "./TaskFormScreen";
import { NotificationsModal } from "../../notifications/screens/NotificationsScreen";
import { notificationsApi } from "../../notifications/api/notificationsApi";

type TabFilter = "TODAY" | "UPCOMING" | "OVERDUE" | "COMPLETED" | "ALL";

export const TasksListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<TabFilter>("TODAY");
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [summary, setSummary] = useState<TaskSummaryDto | null>(null);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);

  // Modals
  const [selectedTask, setSelectedTask] = useState<TaskDto | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState<boolean>(false);
  const [isFormVisible, setIsFormVisible] = useState<boolean>(false);
  const [isNotifsVisible, setIsNotifsVisible] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      const [summaryRes, notifsRes] = await Promise.all([
        tasksApi.getSummary().catch(() => null),
        notificationsApi.getSummary().catch(() => null),
      ]);
      if (summaryRes) setSummary(summaryRes);
      if (notifsRes) setUnreadNotifsCount(notifsRes.unread_count);

      const params: Parameters<typeof tasksApi.list>[0] = {};
      if (activeTab === "TODAY") params.today_only = true;
      else if (activeTab === "UPCOMING") params.upcoming_only = true;
      else if (activeTab === "OVERDUE") params.overdue_only = true;
      else if (activeTab === "COMPLETED") params.status = "COMPLETED";

      if (selectedPriority) params.priority = selectedPriority;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const taskList = await tasksApi.list(params);
      setTasks(taskList);
    } catch (err) {
      console.error("Error loading tasks:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab, selectedPriority, searchQuery]);

  useEffect(() => {
    setIsLoading(true);
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleToggleComplete = async (taskId: number) => {
    try {
      const updated = await tasksApi.toggleComplete(taskId);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      tasksApi.getSummary().then(setSummary).catch(() => null);
    } catch (err) {
      console.error("Failed to toggle task:", err);
    }
  };

  const openDetail = (task: TaskDto) => {
    setSelectedTask(task);
    setIsDetailVisible(true);
  };

  const renderPriorityBadge = (priority: string) => {
    let bg: string = colors.border;
    let text: string = colors.textMuted;
    if (priority === "URGENT") {
      bg = "#FEE2E2";
      text = colors.accentRed;
    } else if (priority === "HIGH") {
      bg = colors.orangePastel;
      text = colors.orange;
    } else if (priority === "MEDIUM") {
      bg = colors.bluePastel;
      text = colors.brandBlue;
    } else if (priority === "LOW") {
      bg = colors.tealPastel;
      text = colors.teal;
    }
    return (
      <View style={[styles.priorityBadge, { backgroundColor: bg }]}>
        <Text style={[styles.priorityText, { color: text }]}>{priority}</Text>
      </View>
    );
  };

  const renderTaskItem = ({ item }: { item: TaskDto }) => {
    const isCompleted = item.status === "COMPLETED";
    return (
      <TouchableOpacity
        style={[styles.taskCard, isCompleted && styles.taskCardCompleted]}
        activeOpacity={0.75}
        onPress={() => openDetail(item)}
      >
        <View style={styles.cardHeader}>
          <TouchableOpacity
            style={styles.checkCircle}
            onPress={() => handleToggleComplete(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel={isCompleted ? "Mark incomplete" : "Mark complete"}
          >
            {isCompleted ? (
              <View style={styles.checkDoneCircle}>
                <Feather name="check" size={14} color={colors.surface} />
              </View>
            ) : (
              <View style={styles.checkPendingCircle} />
            )}
          </TouchableOpacity>

          <View style={styles.cardTitleBox}>
            <Text
              style={[styles.taskTitle, isCompleted && styles.taskTitleCompleted]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
            {item.description ? (
              <Text style={styles.taskDesc} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
          </View>

          {renderPriorityBadge(item.priority)}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.metaRow}>
            {item.customer_type ? (
              <View style={styles.customerChip}>
                <Feather name="briefcase" size={12} color={colors.navy} />
                <Text style={styles.customerChipText}>{item.customer_type}</Text>
              </View>
            ) : null}

            <View style={styles.dateChip}>
              <Feather name="calendar" size={12} color={colors.textMuted} />
              <Text style={styles.dateText}>{item.due_date}</Text>
            </View>
          </View>

          <View style={styles.commentCount}>
            <Feather name="message-square" size={13} color={colors.textMuted} />
            <Text style={styles.commentCountText}>{item.comments_count || 0}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader
        title="Tasks & Schedule"
        subtitle="Manage daily field assignments"
        variant="navy"
        onBack={navigation?.canGoBack && navigation.canGoBack() ? () => navigation.goBack() : undefined}
        rightElement={
          <TouchableOpacity
            style={styles.notifIconContainer}
            onPress={() => setIsNotifsVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Notifications"
          >
            <Feather name="bell" size={20} color={colors.surface} />
            {unreadNotifsCount > 0 ? (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {unreadNotifsCount > 99 ? "99+" : unreadNotifsCount}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        }
      />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(
          [
            { key: "TODAY" as const, label: "Today", count: summary?.today_count },
            { key: "UPCOMING" as const, label: "Upcoming", count: summary?.upcoming_count },
            { key: "OVERDUE" as const, label: "Overdue", count: summary?.overdue_count },
            { key: "COMPLETED" as const, label: "Done", count: summary?.completed_count },
            { key: "ALL" as const, label: "All", count: undefined },
          ]
        ).map((tab) => {
          const isSelected = activeTab === tab.key;
          const isOverdueTab = tab.key === "OVERDUE" && (tab.count || 0) > 0;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabPill,
                isSelected && styles.tabPillActive,
                isOverdueTab && !isSelected && styles.tabPillOverdue,
              ]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabLabel,
                  isSelected && styles.tabLabelActive,
                  isOverdueTab && !isSelected && styles.tabLabelOverdue,
                ]}
              >
                {tab.label}
              </Text>
              {tab.count !== undefined ? (
                <View
                  style={[
                    styles.tabCountBadge,
                    isSelected && styles.tabCountBadgeActive,
                    isOverdueTab && styles.tabCountBadgeOverdue,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabCountText,
                      isSelected && styles.tabCountTextActive,
                      isOverdueTab && styles.tabCountTextOverdue,
                    ]}
                  >
                    {tab.count}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchInputWrapper}>
          <Feather name="search" size={17} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks, doctors, shops..."
            placeholderTextColor={colors.textFaint}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Task List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.navy} />
          <Text style={styles.loadingText}>Loading operational tasks...</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTaskItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.navy}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Feather name="check-square" size={32} color={colors.teal} />
              </View>
              <Text style={styles.emptyTitle}>No tasks found</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === "TODAY"
                  ? "Great job! You have cleared all tasks scheduled for today."
                  : activeTab === "OVERDUE"
                  ? "No overdue tasks. Your schedule is up to date!"
                  : "Tap the '+' button below to create a new task or reminder."}
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => setIsFormVisible(true)}
        accessibilityLabel="Create task"
      >
        <Feather name="plus" size={26} color={colors.surface} />
      </TouchableOpacity>

      {/* Modals */}
      <TaskDetailModal
        visible={isDetailVisible}
        task={selectedTask}
        onClose={() => {
          setIsDetailVisible(false);
          setSelectedTask(null);
        }}
        onTaskUpdated={(updated) => {
          setSelectedTask(updated);
          setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
          tasksApi.getSummary().then(setSummary).catch(() => null);
        }}
      />

      <TaskFormModal
        visible={isFormVisible}
        onClose={() => setIsFormVisible(false)}
        onTaskCreated={() => {
          setIsFormVisible(false);
          loadData();
        }}
      />

      <NotificationsModal
        visible={isNotifsVisible}
        onClose={() => {
          setIsNotifsVisible(false);
          notificationsApi.getSummary().then((s) => setUnreadNotifsCount(s.unread_count));
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  notifIconContainer: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: colors.accentRed,
    borderRadius: radii.full,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    color: colors.surface,
    fontSize: 9,
    fontWeight: "700",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 6,
  },
  tabPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    gap: 4,
  },
  tabPillActive: {
    backgroundColor: colors.bluePastel,
  },
  tabPillOverdue: {
    backgroundColor: "#FEE2E2",
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.brandBlue,
    fontWeight: "700",
  },
  tabLabelOverdue: {
    color: colors.accentRed,
  },
  tabCountBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radii.full,
  },
  tabCountBadgeActive: {
    backgroundColor: colors.brandBlue,
  },
  tabCountBadgeOverdue: {
    backgroundColor: colors.accentRed,
  },
  tabCountText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
  },
  tabCountTextActive: {
    color: colors.surface,
  },
  tabCountTextOverdue: {
    color: colors.surface,
  },
  searchBarContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textInk,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 90,
  },
  taskCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  taskCardCompleted: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  checkCircle: {
    marginTop: 2,
  },
  checkPendingCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
  },
  checkDoneCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitleBox: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textInk,
    lineHeight: 20,
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    color: colors.textMuted,
  },
  taskDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
    lineHeight: 16,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    marginLeft: spacing.xs,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  customerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.bluePastel,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  customerChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.navy,
  },
  dateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  commentCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  commentCountText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
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
    backgroundColor: colors.tealPastel,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textInk,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },
});
