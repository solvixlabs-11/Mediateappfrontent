import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NotificationDto, notificationsApi } from "../api/notificationsApi";
import { colors, radii, spacing, typography } from "../../../shared/theme/tokens";

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  visible,
  onClose,
}) => {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isMarkingAll, setIsMarkingAll] = useState<boolean>(false);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await notificationsApi.list({ limit: 50 });
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setIsLoading(true);
      loadNotifications();
    }
  }, [visible, loadNotifications]);

  const handleMarkAllRead = async () => {
    try {
      setIsMarkingAll(true);
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all read:", err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleItemPress = async (item: NotificationDto) => {
    if (!item.is_read) {
      try {
        const updated = await notificationsApi.markRead(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? updated : n))
        );
      } catch (err) {
        console.error("Failed to mark read:", err);
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "APPROVAL":
        return { name: "checkmark-done-circle" as const, color: colors.success };
      case "TASK":
        return { name: "checkbox" as const, color: colors.primary };
      case "EXPENSE":
        return { name: "receipt" as const, color: colors.warning };
      case "TOUR":
        return { name: "airplane" as const, color: colors.info };
      default:
        return { name: "notifications" as const, color: colors.navy };
    }
  };

  const renderItem = ({ item }: { item: NotificationDto }) => {
    const icon = getNotificationIcon(item.notification_type);
    const dateStr = new Date(item.created_at).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <TouchableOpacity
        style={[styles.notifCard, !item.is_read && styles.notifCardUnread]}
        activeOpacity={0.7}
        onPress={() => handleItemPress(item)}
      >
        <View style={[styles.iconWrapper, { backgroundColor: `${icon.color}15` }]}>
          <Ionicons name={icon.name} size={22} color={icon.color} />
        </View>

        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, !item.is_read && styles.titleUnread]}>
              {item.title}
            </Text>
            {!item.is_read ? <View style={styles.unreadDot} /> : null}
          </View>
          <Text style={styles.bodyText}>{item.body}</Text>
          <Text style={styles.timeText}>{dateStr}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notifications</Text>
            <TouchableOpacity
              onPress={handleMarkAllRead}
              disabled={isMarkingAll || notifications.every((n) => n.is_read)}
            >
              <Text
                style={[
                  styles.markAllText,
                  notifications.every((n) => n.is_read) && styles.markAllDisabled,
                ]}
              >
                Mark all read
              </Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading notifications...</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={() => {
                    setIsRefreshing(true);
                    loadNotifications();
                  }}
                  colors={[colors.primary]}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="notifications-off-outline" size={54} color={colors.grey} />
                  <Text style={styles.emptyTitle}>No notifications</Text>
                  <Text style={styles.emptySubtitle}>
                    You are all caught up! Updates about approvals, tasks, and system events will appear here.
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  markAllDisabled: {
    color: colors.grey,
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
  },
  notifCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  notifCardUnread: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  cardContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
  },
  titleUnread: {
    fontWeight: "700",
    color: colors.textPrimary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 6,
  },
  bodyText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 10,
    color: colors.grey,
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
});
