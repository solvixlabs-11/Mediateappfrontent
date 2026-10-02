import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TaskCommentDto, TaskDto, tasksApi } from "../api/tasksApi";
import { colors, radii, spacing, typography } from "../../../shared/theme/tokens";

interface TaskDetailModalProps {
  visible: boolean;
  task: TaskDto | null;
  onClose: () => void;
  onTaskUpdated: (updatedTask: TaskDto) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  visible,
  task,
  onClose,
  onTaskUpdated,
}) => {
  const [commentInput, setCommentInput] = useState<string>("");
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState<boolean>(false);

  if (!task) return null;

  const isCompleted = task.status === "COMPLETED";

  const handleToggleComplete = async () => {
    try {
      setIsTogglingStatus(true);
      const updated = await tasksApi.toggleComplete(task.id);
      onTaskUpdated(updated);
    } catch (err) {
      console.error("Failed to toggle status:", err);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleSendComment = async () => {
    if (!commentInput.trim() || isSubmittingComment) return;
    try {
      setIsSubmittingComment(true);
      const newComment = await tasksApi.addComment(task.id, {
        message: commentInput.trim(),
      });
      setCommentInput("");
      // Update local task comments
      const updatedTask: TaskDto = {
        ...task,
        comments_count: (task.comments_count || 0) + 1,
        comments: [...(task.comments || []), newComment],
      };
      onTaskUpdated(updatedTask);
    } catch (err) {
      console.error("Failed to send comment:", err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const renderComment = ({ item }: { item: TaskCommentDto }) => {
    const formattedTime = new Date(item.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    return (
      <View style={styles.commentItem}>
        <View style={styles.commentAvatar}>
          <Text style={styles.commentAvatarText}>
            {item.user_name ? item.user_name.charAt(0).toUpperCase() : "U"}
          </Text>
        </View>
        <View style={styles.commentBubble}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentAuthor}>{item.user_name || "Field User"}</Text>
            <Text style={styles.commentTime}>{formattedTime}</Text>
          </View>
          <Text style={styles.commentMessage}>{item.message}</Text>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Task Details</Text>
            <TouchableOpacity
              style={styles.toggleBtn}
              onPress={handleToggleComplete}
              disabled={isTogglingStatus}
            >
              {isTogglingStatus ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons
                  name={isCompleted ? "checkmark-circle" : "checkmark-circle-outline"}
                  size={26}
                  color={isCompleted ? colors.primary : colors.textSecondary}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Details & Comments */}
          <FlatList
            data={task.comments || []}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderComment}
            ListHeaderComponent={
              <View style={styles.detailCard}>
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusPill,
                      isCompleted ? styles.statusCompleted : styles.statusPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        isCompleted ? styles.statusCompletedText : styles.statusPendingText,
                      ]}
                    >
                      {task.status}
                    </Text>
                  </View>

                  <View style={styles.priorityPill}>
                    <Text style={styles.priorityText}>{task.priority} PRIORITY</Text>
                  </View>
                </View>

                <Text style={styles.titleText}>{task.title}</Text>
                {task.description ? (
                  <Text style={styles.descText}>{task.description}</Text>
                ) : null}

                <View style={styles.infoGrid}>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>DUE DATE</Text>
                    <View style={styles.infoRow}>
                      <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.infoVal}>{task.due_date}</Text>
                    </View>
                  </View>

                  {task.customer_type ? (
                    <View style={styles.infoCol}>
                      <Text style={styles.infoLabel}>CUSTOMER</Text>
                      <View style={styles.infoRow}>
                        <Ionicons name="business-outline" size={14} color={colors.navy} />
                        <Text style={[styles.infoVal, { color: colors.navy }]}>
                          {task.customer_type}
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  {task.assigned_to_name ? (
                    <View style={styles.infoCol}>
                      <Text style={styles.infoLabel}>ASSIGNED TO</Text>
                      <View style={styles.infoRow}>
                        <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                        <Text style={styles.infoVal}>{task.assigned_to_name}</Text>
                      </View>
                    </View>
                  ) : null}
                </View>

                <View style={styles.divider} />
                <View style={styles.chatSectionHeader}>
                  <Ionicons name="chatbubbles-outline" size={18} color={colors.primary} />
                  <Text style={styles.chatSectionTitle}>
                    Discussion Thread ({task.comments_count || 0})
                  </Text>
                </View>
              </View>
            }
            contentContainerStyle={styles.commentsList}
            ListEmptyComponent={
              <View style={styles.emptyComments}>
                <Text style={styles.emptyCommentsText}>
                  No comments yet. Start the conversation with your team!
                </Text>
              </View>
            }
          />

          {/* Comment input bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              placeholder="Type comment or field update..."
              placeholderTextColor={colors.textSecondary}
              value={commentInput}
              onChangeText={setCommentInput}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                !commentInput.trim() && styles.sendBtnDisabled,
              ]}
              onPress={handleSendComment}
              disabled={!commentInput.trim() || isSubmittingComment}
            >
              {isSubmittingComment ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Ionicons name="send" size={18} color={colors.surface} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
  toggleBtn: {
    padding: spacing.xs,
  },
  commentsList: {
    paddingBottom: 20,
  },
  detailCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.sm,
    marginRight: spacing.sm,
  },
  statusPending: {
    backgroundColor: "#FEF3C7",
  },
  statusCompleted: {
    backgroundColor: "#DCFCE7",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statusPendingText: {
    color: "#D97706",
  },
  statusCompletedText: {
    color: colors.success,
  },
  priorityPill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  titleText: {
    ...typography.heading,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  descText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#F8FAFC",
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  infoCol: {
    marginRight: spacing.lg,
    marginVertical: 4,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoVal: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textPrimary,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: spacing.md,
  },
  chatSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  chatSectionTitle: {
    ...typography.subheading,
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  commentItem: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    marginVertical: 6,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
    marginTop: 2,
  },
  commentAvatarText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "700",
  },
  commentBubble: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.navy,
  },
  commentTime: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  commentMessage: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  emptyComments: {
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyCommentsText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    fontSize: 13,
    color: colors.textPrimary,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: spacing.sm,
  },
  sendBtnDisabled: {
    backgroundColor: colors.border,
  },
});
