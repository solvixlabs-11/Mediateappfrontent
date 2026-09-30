import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { API_BASE_URL } from "../../../api/client";
import { authApi } from "../../auth/api/authApi";
import { useAuthStore } from "../../auth/store";
import { usersApi } from "../../users/api/usersApi";
import { UserDetail } from "../../users/types";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { Header } from "../../../shared/components/Header";
import { Input } from "../../../shared/components/Input";
import { ScreenContainer } from "../../../shared/components/ScreenContainer";
import { StatusChip } from "../../../shared/components/StatusChip";
import { colors, radii, spacing, typography } from "../../../shared/theme/tokens";

export function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [profile, setProfile] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Edit Modal State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Change Password Modal State
  const [isPwModalVisible, setIsPwModalVisible] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [isChangingPw, setIsChangingPw] = useState(false);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const data = await usersApi.getProfile();
      setProfile(data);
      setEditName(data.full_name);
      setEditPhone(data.phone || "");
    } catch {
      Alert.alert("Error", "Unable to load profile from server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Camera roll access is needed to upload a photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      try {
        setIsUploadingPhoto(true);
        const filename = asset.fileName || `avatar_${Date.now()}.jpg`;
        const mimeType = asset.mimeType || "image/jpeg";

        const uploadedFile = await usersApi.uploadFile(asset.uri, filename, mimeType);
        await usersApi.updateProfile({ profile_picture_file_id: uploadedFile.id });
        await fetchProfile();
        Alert.alert("Success", "Profile photo updated successfully!");
      } catch {
        Alert.alert("Upload Failed", "Could not upload profile picture. Please try again.");
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Validation", "Name cannot be empty.");
      return;
    }

    try {
      setIsSaving(true);
      const updated = await usersApi.updateProfile({
        full_name: editName.trim(),
        phone: editPhone.trim() || undefined,
      });
      setProfile(updated);
      setIsEditModalVisible(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch {
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw) {
      Alert.alert("Validation", "Please fill in all fields.");
      return;
    }
    if (newPw.length < 6) {
      Alert.alert("Validation", "New password must be at least 6 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert("Validation", "New passwords do not match.");
      return;
    }

    try {
      await authApi.changePassword({
        old_password: currentPw,
        new_password: newPw,
      });
      setIsPwModalVisible(false);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      Alert.alert("Success", "Password changed successfully!");
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : "Failed to change password";
      Alert.alert("Error", errorMsg || "Failed to change password.");
    } finally {
      setIsChangingPw(false);
    }
  };

  const handleLogoutAll = () => {
    Alert.alert(
      "Log Out All Devices",
      "Are you sure you want to invalidate all sessions across all devices?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out All",
          style: "destructive",
          onPress: async () => {
            try {
              await authApi.logoutAll();
            } catch {
              // Ignore network failure to ensure clean logout
            } finally {
              await logout();
            }
          },
        },
      ]
    );
  };

  const handleCallManager = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert("Cannot Place Call", "Your device could not open the phone dialer.");
    });
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <Header title="My Profile" subtitle="Mediate Healthcare" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading profile data...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const avatarUrl = profile?.profile_picture_url
    ? `${API_BASE_URL}${profile.profile_picture_url}`
    : null;

  return (
    <ScreenContainer>
      <Header
        title="My Profile"
        subtitle={`Role: ${profile?.role.name || user?.role || "Representative"}`}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Hero Avatar Card */}
        <Card style={styles.avatarCard}>
          <View style={styles.avatarWrapper}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {profile?.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase() || "MH"}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.cameraBadge}
              onPress={handlePickImage}
              disabled={isUploadingPhoto}
              activeOpacity={0.8}
            >
              {isUploadingPhoto ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Ionicons name="camera" size={16} color={colors.surface} />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{profile?.full_name}</Text>
          <Text style={styles.userEmail}>{profile?.email}</Text>

          <View style={styles.chipRow}>
            <StatusChip
              status={profile?.role.code || user?.role || "MR"}
              label={profile?.role.name || "Medical Representative"}
            />
            {profile?.is_active && (
              <View style={styles.activePill}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={styles.activeText}>Active</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => setIsEditModalVisible(true)}
          >
            <Ionicons name="pencil" size={14} color={colors.primary} />
            <Text style={styles.editProfileBtnText}>Edit Contact Details</Text>
          </TouchableOpacity>
        </Card>

        {/* Contact Information */}
        <Card style={styles.sectionCard}>
          <Text style={styles.cardHeaderTitle}>Contact Information</Text>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={18} color={colors.navy} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Official Email</Text>
              <Text style={styles.infoValue}>{profile?.email}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color={colors.navy} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Mobile Number</Text>
              <Text style={styles.infoValue}>{profile?.phone || "Not configured"}</Text>
            </View>
          </View>
        </Card>

        {/* Reporting Manager Section (Feature 33 for MRs) */}
        {profile?.role.code === "MR" && (
          <Card style={styles.sectionCard}>
            <Text style={styles.cardHeaderTitle}>Reporting Manager</Text>
            {profile.current_manager ? (
              <View style={styles.managerCard}>
                <View style={styles.managerInfo}>
                  <View style={styles.managerIconCircle}>
                    <Ionicons name="person" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.managerDetails}>
                    <Text style={styles.managerName}>{profile.current_manager.full_name}</Text>
                    <Text style={styles.managerSubtext}>{profile.current_manager.email}</Text>
                    {profile.current_manager.phone && (
                      <Text style={styles.managerPhone}>{profile.current_manager.phone}</Text>
                    )}
                  </View>
                </View>

                {profile.current_manager.phone && (
                  <TouchableOpacity
                    style={styles.callManagerBtn}
                    onPress={() => handleCallManager(profile.current_manager!.phone!)}
                  >
                    <Ionicons name="call" size={16} color={colors.surface} />
                    <Text style={styles.callManagerBtnText}>Call Manager</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.noManagerBox}>
                <Ionicons name="alert-circle-outline" size={20} color={colors.grey} />
                <Text style={styles.noManagerText}>
                  No reporting manager is currently assigned. Please contact Head Office.
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* Security & Authentication */}
        <Card style={styles.sectionCard}>
          <Text style={styles.cardHeaderTitle}>Security & Sessions</Text>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => setIsPwModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.actionLeft}>
              <Ionicons name="key-outline" size={20} color={colors.navy} />
              <Text style={styles.actionLabel}>Change Login Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.grey} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleLogoutAll}
            activeOpacity={0.7}
          >
            <View style={styles.actionLeft}>
              <Ionicons name="shield-half-outline" size={20} color={colors.danger} />
              <Text style={[styles.actionLabel, { color: colors.danger }]}>
                Log Out All Other Devices
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.grey} />
          </TouchableOpacity>
        </Card>

        {/* Sign Out Button */}
        <Button
          title="Sign Out"
          variant="danger"
          onPress={logout}
          style={styles.signOutBtn}
        />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={isEditModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <Input
              label="Full Name"
              value={editName}
              onChangeText={setEditName}
              placeholder="Your Full Name"
            />
            <Input
              label="Phone Number"
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="+91..."
              keyboardType="phone-pad"
            />
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setIsEditModalVisible(false)}
                style={styles.modalBtn}
              />
              <Button
                title={isSaving ? "Saving..." : "Save Changes"}
                variant="primary"
                onPress={handleSaveProfile}
                disabled={isSaving}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={isPwModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <Input
              label="Current Password"
              value={currentPw}
              onChangeText={setCurrentPw}
              placeholder="••••••••"
              secureTextEntry
            />
            <Input
              label="New Password"
              value={newPw}
              onChangeText={setNewPw}
              placeholder="Minimum 6 characters"
              secureTextEntry
            />
            <Input
              label="Confirm New Password"
              value={confirmPw}
              onChangeText={setConfirmPw}
              placeholder="Re-enter new password"
              secureTextEntry
            />
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setIsPwModalVisible(false)}
                style={styles.modalBtn}
              />
              <Button
                title={isChangingPw ? "Changing..." : "Update Password"}
                variant="primary"
                onPress={handleChangePassword}
                disabled={isChangingPw}
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
  scrollContent: {
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
  avatarCard: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    marginBottom: spacing.md,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: spacing.md,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.navy,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.surface,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.surface,
  },
  userName: {
    ...typography.heading,
    color: colors.navy,
    marginBottom: spacing.xs,
  },
  userEmail: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  activeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.success,
  },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: colors.greyLight,
  },
  editProfileBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  cardHeaderTitle: {
    ...typography.subheading,
    color: colors.navy,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  infoValue: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  managerCard: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  managerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  managerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  managerDetails: {
    flex: 1,
  },
  managerName: {
    ...typography.subheading,
    color: colors.navy,
  },
  managerSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  managerPhone: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "500",
    marginTop: 2,
  },
  callManagerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
  },
  callManagerBtnText: {
    color: colors.surface,
    fontWeight: "600",
    fontSize: 14,
  },
  noManagerBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.greyLight,
    borderRadius: radii.sm,
  },
  noManagerText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  actionLabel: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  signOutBtn: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
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
  },
  modalTitle: {
    ...typography.heading,
    color: colors.navy,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalBtn: {
    flex: 1,
  },
});
