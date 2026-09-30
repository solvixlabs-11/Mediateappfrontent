import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usersApi } from "../api/usersApi";
import { ManagerSummary, UserDetail } from "../types";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { Header } from "../../../shared/components/Header";
import { Input } from "../../../shared/components/Input";
import { ScreenContainer } from "../../../shared/components/ScreenContainer";
import { StatusChip } from "../../../shared/components/StatusChip";
import { colors, radii, spacing, typography } from "../../../shared/theme/tokens";

export function UsersListScreen() {
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Create User Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState<"MR" | "MANAGER" | "ADMIN">("MR");
  const [newPassword, setNewPassword] = useState("Mediate@2026");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Password Policy Checks
  const isLengthValid = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const isPasswordValid = isLengthValid && hasUppercase && hasLowercase && hasNumber && hasSpecial;

  // Assign Manager Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<UserDetail | null>(null);
  const [managersList, setManagersList] = useState<ManagerSummary[]>([]);
  const [assignManagerId, setAssignManagerId] = useState<number | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await usersApi.listUsers({
        role: selectedRole || undefined,
        search: searchQuery.trim() || undefined,
        page_size: 100,
      });
      setUsers(res.items);
      setTotalCount(res.total);
    } catch {
      // Handle network error
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedRole, searchQuery]);

  const loadManagers = async () => {
    try {
      const data = await usersApi.getManagers();
      setManagersList(data);
      if (data.length > 0 && !selectedManagerId) {
        setSelectedManagerId(data[0].id);
      }
    } catch {
      // Failed to load managers
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    loadManagers();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchUsers();
  };

  const handleCreateUser = async () => {
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      Alert.alert("Validation", "Name, email, and password are required.");
      return;
    }

    if (!isPasswordValid) {
      Alert.alert(
        "Password Criteria Not Met",
        "The password must be at least 8 characters long and contain at least one uppercase letter (A-Z), one number (0-9), and one special symbol (@$!%*?&)."
      );
      return;
    }

    try {
      setIsCreating(true);
      await usersApi.createUser({
        full_name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        phone: newPhone.trim() || null,
        role_code: newRole,
        password: newPassword.trim(),
        manager_id: newRole === "MR" ? selectedManagerId : null,
      });

      setIsCreateModalOpen(false);
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setNewPassword("Mediate@123");
      fetchUsers();
      Alert.alert("Success", "User account created successfully.");
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : "Could not create user";
      Alert.alert("Error", errorMsg || "Failed to create user account.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleStatus = (user: UserDetail) => {
    const actionName = user.is_active ? "Deactivate" : "Activate";
    const promptMsg = user.is_active
      ? `Are you sure you want to deactivate ${user.full_name}? Per BR-14, their active login sessions will be revoked immediately.`
      : `Activate ${user.full_name}'s account?`;

    Alert.alert(actionName, promptMsg, [
      { text: "Cancel", style: "cancel" },
      {
        text: actionName,
        style: user.is_active ? "destructive" : "default",
        onPress: async () => {
          try {
            await usersApi.updateStatus(user.id, !user.is_active);
            fetchUsers();
          } catch {
            Alert.alert("Error", `Failed to ${actionName.toLowerCase()} user.`);
          }
        },
      },
    ]);
  };

  const openAssignModal = (user: UserDetail) => {
    setTargetUser(user);
    setAssignManagerId(user.current_manager?.id || (managersList[0]?.id ?? null));
    setIsAssignModalOpen(true);
  };

  const handleAssignManager = async () => {
    if (!targetUser || !assignManagerId) return;

    try {
      setIsAssigning(true);
      await usersApi.assignManager(targetUser.id, assignManagerId);
      setIsAssignModalOpen(false);
      fetchUsers();
      Alert.alert("Success", `Manager assigned to ${targetUser.full_name}.`);
    } catch {
      Alert.alert("Error", "Failed to assign manager.");
    } finally {
      setIsAssigning(false);
    }
  };

  const renderUserItem = ({ item }: { item: UserDetail }) => (
    <Card style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {item.full_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase()}
          </Text>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.full_name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          {item.phone && <Text style={styles.userPhone}>{item.phone}</Text>}
        </View>

        <View style={styles.roleContainer}>
          <StatusChip status={item.role.code} label={item.role.code} />
          {item.is_active ? (
            <Text style={styles.activeLabel}>Active</Text>
          ) : (
            <Text style={styles.inactiveLabel}>Deactivated</Text>
          )}
        </View>
      </View>

      {/* MR Manager info */}
      {item.role.code === "MR" && (
        <View style={styles.managerBanner}>
          <Ionicons name="git-network-outline" size={14} color={colors.primary} />
          <Text style={styles.managerBannerText}>
            Manager:{" "}
            <Text style={styles.managerBannerName}>
              {item.current_manager?.full_name || "Unassigned"}
            </Text>
          </Text>
          <TouchableOpacity onPress={() => openAssignModal(item)}>
            <Text style={styles.reassignLink}>
              {item.current_manager ? "Change" : "Assign"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[
            styles.statusToggleBtn,
            item.is_active ? styles.deactivateBtn : styles.activateBtn,
          ]}
          onPress={() => handleToggleStatus(item)}
        >
          <Ionicons
            name={item.is_active ? "ban-outline" : "checkmark-circle-outline"}
            size={14}
            color={item.is_active ? colors.danger : colors.success}
          />
          <Text
            style={[
              styles.statusToggleText,
              { color: item.is_active ? colors.danger : colors.success },
            ]}
          >
            {item.is_active ? "Deactivate" : "Activate"}
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <ScreenContainer>
      <Header
        title="User Management"
        subtitle={`System Accounts (${totalCount} Total)`}
      />

      {/* Search and Action Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={18} color={colors.grey} style={styles.searchIcon} />
          <TextInput
            placeholder="Search by name, email, or phone..."
            placeholderTextColor={colors.grey}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={16} color={colors.grey} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.createUserBtn}
          onPress={() => setIsCreateModalOpen(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add" size={16} color={colors.surface} />
          <Text style={styles.createUserBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Role Filter Chips */}
      <View style={styles.filterChipsRow}>
        {(["ALL", "MR", "MANAGER", "ADMIN"] as const).map((r) => {
          const isSelected = (r === "ALL" && selectedRole === null) || selectedRole === r;
          return (
            <TouchableOpacity
              key={r}
              style={[styles.filterChip, isSelected && styles.filterChipSelected]}
              onPress={() => setSelectedRole(r === "ALL" ? null : r)}
            >
              <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                {r}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Users List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching system users...</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={colors.grey} />
              <Text style={styles.emptyTitle}>No Users Found</Text>
              <Text style={styles.emptyText}>No users matched your search criteria.</Text>
            </View>
          }
        />
      )}

      {/* Create User Modal */}
      <Modal visible={isCreateModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Account</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Input
                label="Full Name"
                placeholder="e.g. Rahul Sharma"
                value={newName}
                onChangeText={setNewName}
              />
              <Input
                label="Email Address"
                placeholder="user@mediatehealthcare.com"
                value={newEmail}
                onChangeText={setNewEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Input
                label="Phone Number"
                placeholder="+91..."
                value={newPhone}
                onChangeText={setNewPhone}
                keyboardType="phone-pad"
              />
              <View style={styles.passwordFieldWrapper}>
                <Input
                  label="Initial Password"
                  placeholder="e.g. Mediate@2026"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIconBtn}
                  onPress={() => setShowPassword((prev) => !prev)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.navy}
                  />
                </TouchableOpacity>
              </View>

              {/* Password Requirements Alert Box */}
              <View
                style={[
                  styles.pwCriteriaBox,
                  isPasswordValid ? styles.pwCriteriaBoxValid : styles.pwCriteriaBoxAlert,
                ]}
              >
                <View style={styles.pwCriteriaHeader}>
                  <Ionicons
                    name={isPasswordValid ? "checkmark-circle" : "alert-circle"}
                    size={16}
                    color={isPasswordValid ? colors.success : colors.danger}
                  />
                  <Text
                    style={[
                      styles.pwCriteriaHeaderText,
                      isPasswordValid
                        ? styles.pwCriteriaHeaderValid
                        : styles.pwCriteriaHeaderAlert,
                    ]}
                  >
                    {isPasswordValid
                      ? "Password fulfills enterprise security criteria"
                      : "Password must meet all security requirements:"}
                  </Text>
                </View>

                <View style={styles.criteriaGrid}>
                  <View style={styles.criteriaItem}>
                    <Ionicons
                      name={isLengthValid ? "checkmark-circle" : "close-circle-outline"}
                      size={14}
                      color={isLengthValid ? colors.success : colors.danger}
                    />
                    <Text
                      style={[
                        styles.criteriaText,
                        isLengthValid && styles.criteriaTextMet,
                      ]}
                    >
                      8+ Characters
                    </Text>
                  </View>

                  <View style={styles.criteriaItem}>
                    <Ionicons
                      name={hasUppercase ? "checkmark-circle" : "close-circle-outline"}
                      size={14}
                      color={hasUppercase ? colors.success : colors.danger}
                    />
                    <Text
                      style={[
                        styles.criteriaText,
                        hasUppercase && styles.criteriaTextMet,
                      ]}
                    >
                      1 Uppercase (A-Z)
                    </Text>
                  </View>

                  <View style={styles.criteriaItem}>
                    <Ionicons
                      name={hasNumber ? "checkmark-circle" : "close-circle-outline"}
                      size={14}
                      color={hasNumber ? colors.success : colors.danger}
                    />
                    <Text
                      style={[
                        styles.criteriaText,
                        hasNumber && styles.criteriaTextMet,
                      ]}
                    >
                      1 Number (0-9)
                    </Text>
                  </View>

                  <View style={styles.criteriaItem}>
                    <Ionicons
                      name={hasSpecial ? "checkmark-circle" : "close-circle-outline"}
                      size={14}
                      color={hasSpecial ? colors.success : colors.danger}
                    />
                    <Text
                      style={[
                        styles.criteriaText,
                        hasSpecial && styles.criteriaTextMet,
                      ]}
                    >
                      1 Special Char (@$!%*?&)
                    </Text>
                  </View>
                </View>

                {/* Quick Auto-generate button */}
                <TouchableOpacity
                  style={styles.generatePwBtn}
                  onPress={() =>
                    setNewPassword(`Mediate@${Math.floor(1000 + Math.random() * 9000)}`)
                  }
                  activeOpacity={0.8}
                >
                  <Ionicons name="sparkles" size={13} color={colors.primary} />
                  <Text style={styles.generatePwText}>Generate Strong Password</Text>
                </TouchableOpacity>
              </View>

              {/* Role Selection */}
              <Text style={styles.fieldLabel}>Role</Text>
              <View style={styles.rolePickerRow}>
                {(["MR", "MANAGER", "ADMIN"] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.rolePickBtn, newRole === r && styles.rolePickBtnActive]}
                    onPress={() => setNewRole(r)}
                  >
                    <Text
                      style={[
                        styles.rolePickBtnText,
                        newRole === r && styles.rolePickBtnTextActive,
                      ]}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Manager assignment if MR */}
              {newRole === "MR" && managersList.length > 0 && (
                <View style={styles.managerSelectSection}>
                  <Text style={styles.fieldLabel}>Assign Reporting Manager</Text>
                  <View style={styles.managerOptions}>
                    {managersList.map((m) => (
                      <TouchableOpacity
                        key={m.id}
                        style={[
                          styles.managerOptionItem,
                          selectedManagerId === m.id && styles.managerOptionItemActive,
                        ]}
                        onPress={() => setSelectedManagerId(m.id)}
                      >
                        <Text
                          style={[
                            styles.managerOptionName,
                            selectedManagerId === m.id && styles.managerOptionNameActive,
                          ]}
                        >
                          {m.full_name}
                        </Text>
                        <Text style={styles.managerOptionEmail}>{m.email}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setIsCreateModalOpen(false)}
                  style={styles.modalBtn}
                />
                <Button
                  title={isCreating ? "Creating..." : "Create User"}
                  variant="primary"
                  onPress={handleCreateUser}
                  disabled={isCreating}
                  style={styles.modalBtn}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Assign Manager Modal */}
      <Modal visible={isAssignModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Manager</Text>
            <Text style={styles.modalSubtitle}>
              Select reporting manager for {targetUser?.full_name}:
            </Text>

            <ScrollView style={styles.managerPickScroll}>
              {managersList.map((mgr) => (
                <TouchableOpacity
                  key={mgr.id}
                  style={[
                    styles.managerOptionItem,
                    assignManagerId === mgr.id && styles.managerOptionItemActive,
                  ]}
                  onPress={() => setAssignManagerId(mgr.id)}
                >
                  <Text
                    style={[
                      styles.managerOptionName,
                      assignManagerId === mgr.id && styles.managerOptionNameActive,
                    ]}
                  >
                    {mgr.full_name}
                  </Text>
                  <Text style={styles.managerOptionEmail}>{mgr.email}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setIsAssignModalOpen(false)}
                style={styles.modalBtn}
              />
              <Button
                title={isAssigning ? "Saving..." : "Confirm"}
                variant="primary"
                onPress={handleAssignManager}
                disabled={isAssigning || !assignManagerId}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    height: 44,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  createUserBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary,
    height: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    justifyContent: "center",
  },
  createUserBtnText: {
    color: colors.surface,
    fontWeight: "600",
    fontSize: 13,
  },
  filterChipsRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipSelected: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  filterChipTextSelected: {
    color: colors.surface,
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
  userCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  userHeader: {
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
  avatarText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "700",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...typography.subheading,
    color: colors.navy,
  },
  userEmail: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  userPhone: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  roleContainer: {
    alignItems: "flex-end",
    gap: 4,
  },
  activeLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.success,
  },
  inactiveLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.danger,
  },
  managerBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: spacing.xs,
    borderRadius: radii.sm,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  managerBannerText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  managerBannerName: {
    fontWeight: "600",
    color: colors.navy,
  },
  reassignLink: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
    paddingHorizontal: 4,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
  },
  statusToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
  },
  activateBtn: {
    backgroundColor: "#E8F5E9",
  },
  deactivateBtn: {
    backgroundColor: "#FFEBEE",
  },
  statusToggleText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.subheading,
    color: colors.navy,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    maxHeight: "85%",
  },
  modalTitle: {
    ...typography.heading,
    color: colors.navy,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.subheading,
    color: colors.navy,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  rolePickerRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  rolePickBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  rolePickBtnActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  rolePickBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  rolePickBtnTextActive: {
    color: colors.surface,
  },
  managerSelectSection: {
    marginBottom: spacing.md,
  },
  managerOptions: {
    gap: spacing.xs,
  },
  managerOptionItem: {
    padding: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  managerOptionItemActive: {
    borderColor: colors.primary,
    backgroundColor: "#E0F2F1",
  },
  managerOptionName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.navy,
  },
  managerOptionNameActive: {
    color: colors.primaryDark,
  },
  managerOptionEmail: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  managerPickScroll: {
    maxHeight: 250,
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalBtn: {
    flex: 1,
  },
  passwordFieldWrapper: {
    position: "relative",
  },
  eyeIconBtn: {
    position: "absolute",
    right: 12,
    top: 36,
    padding: 6,
    zIndex: 10,
  },
  pwCriteriaBox: {
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  pwCriteriaBoxAlert: {
    backgroundColor: "#FFF5F5",
    borderColor: "#FFCDD2",
  },
  pwCriteriaBoxValid: {
    backgroundColor: "#F1F8E9",
    borderColor: "#C8E6C9",
  },
  pwCriteriaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.xs,
  },
  pwCriteriaHeaderText: {
    fontSize: 12,
    fontWeight: "600",
  },
  pwCriteriaHeaderAlert: {
    color: colors.danger,
  },
  pwCriteriaHeaderValid: {
    color: colors.success,
  },
  criteriaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginVertical: 4,
  },
  criteriaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    width: "48%",
  },
  criteriaText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  criteriaTextMet: {
    color: colors.success,
    fontWeight: "600",
  },
  generatePwBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  generatePwText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "600",
  },
});
