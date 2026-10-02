import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TaskDto, TaskSummaryDto, tasksApi } from "../api/tasksApi";
import { colors, radii, spacing, typography } from "../../../shared/theme/tokens";
import { Header } from "../../../shared/components/Header";
import { TaskDetailModal } from "./TaskDetailScreen";
import { TaskFormModal } from "./TaskFormScreen";
import { NotificationsModal } from "../../notifications/screens/NotificationsScreen";
import { notificationsApi } from "../../notifications/api/notificationsApi";

type TabFilter = "TODAY" | "UPCOMING" | "OVERDUE" | "COMPLETED" | "ALL";

export const TasksListScreen: React.FC = () => {
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
      // Refresh summary
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
    let bg = "#F1F5F9";
    let text = "#475569";
    if (priority === "URGENT") {
      bg = "#FEE2E2";
      text = colors.danger;
    } else if (priority === "HIGH") {
      bg = "#FFEDD5";
      text = "#C2410C";
    } else if (priority === "MEDIUM") {
      bg = "#E0F2FE";
      text = "#0369A1";
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
        activeOpacity={0.7}
        onPress={() => openDetail(item)}
      >
        <View style={styles.cardHeader}>
          <TouchableOpacity
            style={styles.checkCircle}
            onPress={() => handleToggleComplete(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isCompleted ? (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            ) : (
              <Ionicons name="ellipse-outline" size={24} color={colors.border} />
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
                <Ionicons name="business-outline" size={12} color={colors.navy} />
                <Text style={styles.customerChipText}>{item.customer_type}</Text>
              </View>
            ) : null}

            <View style={styles.dateChip}>
              <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.dateText}>{item.due_date}</Text>
            </View>
          </View>

          <View style={styles.commentCount}>
            <Ionicons name="chatbubble-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.commentCountText}>{item.comments_count || 0}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Daily Tasks"
        rightAction={
          <TouchableOpacity
            style={styles.notifIconContainer}
            onPress={() => setIsNotifsVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.navy} />
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
            { key: "COMPLETED" as const, label: "Completed", count: summary?.completed_count },
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
            >
              <Text style={[styles.tabLabel, isSelected && styles.tabLabelActive]}>
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

      {/* Search and Priority Chips */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks by title, doctor, shop..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={colors.grey} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Task List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading operational tasks...</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTaskItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkbox-outline" size={54} color={colors.grey} />
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

      {/* FAB - Add Task */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => setIsFormVisible(true)}
      >
        <Ionicons name="add" size={28} color={colors.surface} />
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  notifIconContainer: {
    position: "relative",
    padding: spacing.xs,
  },
  notifBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: colors.danger,
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radii.full,
    backgroundColor: colors.greyLight,
    marginRight: spacing.xs + 2,
  },
  tabPillActive: {
    backgroundColor: colors.primary,
  },
  tabPillOverdue: {
    backgroundColor: "#FEE2E2",
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.surface,
  },
  tabCountBadge: {
    backgroundColor: "#CBD5E1",
    borderRadius: radii.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 4,
  },
  tabCountBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  tabCountBadgeOverdue: {
    backgroundColor: "#FECACA",
  },
  tabCountText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  tabCountTextActive: {
    color: colors.surface,
  },
  tabCountTextOverdue: {
    color: colors.danger,
  },
  searchBarContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    height: 38,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.xs,
    fontSize: 13,
    color: colors.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 13,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 80,
  },
  taskCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  taskCardCompleted: {
    opacity: 0.7,
    backgroundColor: "#F8FAFC",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkCircle: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  cardTitleBox: {
    flex: 1,
  },
  taskTitle: {
    ...typography.subheading,
    fontSize: 14,
    color: colors.textPrimary,
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    color: colors.textSecondary,
  },
  taskDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  priorityBadge: {
    borderRadius: radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: spacing.xs,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "700",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  customerChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EDF2F7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
    marginRight: spacing.sm,
  },
  customerChipText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.navy,
    marginLeft: 3,
  },
  dateChip: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 3,
  },
  commentCount: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentCountText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 3,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.heading,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
