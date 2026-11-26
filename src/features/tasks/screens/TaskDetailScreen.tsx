import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { TaskCommentDto, TaskDto, tasksApi } from "../api/tasksApi";
import { ScreenHeader } from "../../../shared/components/ScreenHeader";
import { colors, radii, spacing, typography, shadows } from "../../../theme";
import { formatTimeIST } from "../../../shared/utils/date";

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
    const formattedTime = formatTimeIST(item.created_at);
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
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <StatusBar style="light" />
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        >
          <ScreenHeader
            title="Task Details"
            subtitle={task.due_date ? `Due: ${task.due_date}` : "Action item"}
            variant="navy"
            onBack={onClose}
            rightElement={
              <TouchableOpacity
                style={[
                  styles.completePillBtn,
                  isCompleted && styles.completePillBtnDone,
                ]}
                onPress={handleToggleComplete}
                disabled={isTogglingStatus}
                activeOpacity={0.8}
              >
                {isTogglingStatus ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <>
                    <Feather
                      name={isCompleted ? "check-circle" : "circle"}
                      size={14}
                      color={colors.surface}
                    />
                    <Text style={styles.completePillText}>
                      {isCompleted ? "Done" : "Mark Done"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            }
          />

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
                      <Feather name="calendar" size={14} color={colors.textMuted} />
                      <Text style={styles.infoVal}>{task.due_date}</Text>
                    </View>
                  </View>

                  {task.customer_type ? (
                    <View style={styles.infoCol}>
                      <Text style={styles.infoLabel}>CUSTOMER</Text>
                      <View style={styles.infoRow}>
                        <Feather name="briefcase" size={14} color={colors.brandBlue} />
                        <Text style={[styles.infoVal, { color: colors.brandBlue }]}>
                          {task.customer_type}
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  {task.assigned_to_name ? (
                    <View style={styles.infoCol}>
                      <Text style={styles.infoLabel}>ASSIGNED TO</Text>
                      <View style={styles.infoRow}>
                        <Feather name="user" size={14} color={colors.textMuted} />
                        <Text style={styles.infoVal}>{task.assigned_to_name}</Text>
                      </View>
                    </View>
                  ) : null}
                </View>

                <View style={styles.divider} />
                <View style={styles.chatSectionHeader}>
                  <Feather name="message-circle" size={16} color={colors.navy} />
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
              placeholderTextColor={colors.textFaint}
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
              activeOpacity={0.8}
            >
              {isSubmittingComment ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Feather name="send" size={16} color={colors.surface} />
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
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  completePillBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    gap: 5,
  },
  completePillBtnDone: {
    backgroundColor: colors.successGreen,
  },
  completePillText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "700",
  },
  commentsList: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.soft,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  statusPending: {
    backgroundColor: colors.warningPastel,
  },
  statusCompleted: {
    backgroundColor: colors.successGreenPastel,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  statusPendingText: {
    color: colors.warning,
  },
  statusCompletedText: {
    color: colors.successGreen,
  },
  priorityPill: {
    backgroundColor: colors.bluePastel,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.brandBlue,
  },
  titleText: {
    ...typography.heading,
    fontSize: 18,
    fontWeight: "800",
    color: colors.textInk,
    marginBottom: spacing.xs,
  },
  descText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
    marginTop: spacing.xs,
  },
  infoCol: {
    minWidth: 100,
  },
  infoLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: "700",
    color: colors.textFaint,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoVal: {
    ...typography.body,
    fontSize: 13,
    fontWeight: "700",
    color: colors.textInk,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  chatSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  chatSectionTitle: {
    ...typography.heading,
    fontSize: 14,
    fontWeight: "800",
    color: colors.textInk,
  },
  commentItem: {
    flexDirection: "row",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.bluePastel,
    alignItems: "center",
    justifyContent: "center",
  },
  commentAvatarText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.navy,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  commentAuthor: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: "800",
    color: colors.textInk,
  },
  commentTime: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textFaint,
  },
  commentMessage: {
    ...typography.body,
    fontSize: 13,
    color: colors.textInk,
    lineHeight: 19,
  },
  emptyComments: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  emptyCommentsText: {
    ...typography.body,
    fontSize: 13,
    color: colors.textFaint,
    textAlign: "center",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    maxHeight: 100,
    ...typography.body,
    fontSize: 14,
    color: colors.textInk,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.soft,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
