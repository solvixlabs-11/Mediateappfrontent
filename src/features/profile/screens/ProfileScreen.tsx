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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { API_BASE_URL } from "../../../api/client";
import { ROUTES } from "../../../navigation/routes";
import { authApi } from "../../auth/api/authApi";
import { useAuthStore } from "../../auth/store";
import { usersApi } from "../../users/api/usersApi";
import { UserDetail } from "../../users/types";
import { colors, radii, shadows, spacing, typography } from "../../../theme";
import { PinDots } from "../../../shared/components/PinDots";
import { Keypad } from "../../../shared/components/Keypad";
import { secureStorage } from "../../../shared/services/secureStore";
import { ProductsCatalogScreen } from "../../products/screens/ProductsCatalogScreen";
import { OrdersScreen } from "../../orders/screens/OrdersScreen";
import { NotificationsModal } from "../../notifications/screens/NotificationsScreen";
import appConfig from "../../../../app.json";

export function ProfileScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [profile, setProfile] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Edit Contact Modal State
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

  // Change MPIN Modal State
  const [isMpinModalVisible, setIsMpinModalVisible] = useState(false);
  const [mpinStep, setMpinStep] = useState<1 | 2>(1);
  const [firstMpin, setFirstMpin] = useState("");
  const [confirmMpin, setConfirmMpin] = useState("");
  const [mpinError, setMpinError] = useState("");
  const [hasMpinShake, setHasMpinShake] = useState(false);
  const [isSavingMpin, setIsSavingMpin] = useState(false);

  // Enterprise Feature Modals State
  const [isProductsVisible, setIsProductsVisible] = useState(false);
  const [isOrdersVisible, setIsOrdersVisible] = useState(false);
  const [isNotifsVisible, setIsNotifsVisible] = useState(false);

  const appVersion = appConfig?.expo?.version || "1.0.0";

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
      setIsChangingPw(true);
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
              // Ignore network failure
            } finally {
              await logout();
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out from Mediate Healthcare?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => logout(),
        },
      ]
    );
  };

  const handleCallManager = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert("Cannot Place Call", "Your device could not open the phone dialer.");
    });
  };

  // MPIN Keypad handlers
  const activeMpin = mpinStep === 1 ? firstMpin : confirmMpin;

  const handleMpinDigit = async (digit: string) => {
    if (activeMpin.length >= 4) return;
    setHasMpinShake(false);
    setMpinError("");

    const newPin = activeMpin + digit;

    if (mpinStep === 1) {
      setFirstMpin(newPin);
      if (newPin.length === 4) {
        setTimeout(() => {
          setMpinStep(2);
        }, 180);
      }
    } else {
      setConfirmMpin(newPin);
      if (newPin.length === 4) {
        if (newPin === firstMpin) {
          try {
            setIsSavingMpin(true);
            await secureStorage.setMpin(newPin);
            Alert.alert("Success", "Your 4-digit MPIN has been updated successfully!");
            setIsMpinModalVisible(false);
            setFirstMpin("");
            setConfirmMpin("");
            setMpinStep(1);
          } catch {
            Alert.alert("Error", "Could not save MPIN to secure storage.");
          } finally {
            setIsSavingMpin(false);
          }
        } else {
          setHasMpinShake(true);
          setMpinError("MPIN does not match. Try again.");
          setTimeout(() => {
            setConfirmMpin("");
          }, 600);
        }
      }
    }
  };

  const handleMpinDelete = () => {
    setHasMpinShake(false);
    setMpinError("");
    if (mpinStep === 1) {
      setFirstMpin((prev) => prev.slice(0, -1));
    } else {
      setConfirmMpin((prev) => prev.slice(0, -1));
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingCenter]}>
        <ActivityIndicator size="large" color={colors.navy} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const avatarUrl = profile?.profile_picture_url
    ? `${API_BASE_URL}${profile.profile_picture_url}`
    : null;

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "MR";

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 36, 48) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO SECTION with Curved Bottom and Decorative Translucent Circles */}
        <LinearGradient
          colors={colors.navyGradient}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 0.9, y: 0.9 }}
          style={[styles.heroGradient, { paddingTop: Math.max(insets.top + 10, 36) }]}
        >
          {/* Decorative Translucent Circles */}
          <View style={styles.decorativeCircleLeft} pointerEvents="none" />
          <View style={styles.decorativeCircleRight} pointerEvents="none" />

          {/* Top Bar with Back Button & Centered Title */}
          <View style={styles.heroTopBar}>
            {navigation?.canGoBack && navigation.canGoBack() ? (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.heroBackBtn}
                activeOpacity={0.7}
                accessibilityLabel="Go back"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Feather name="chevron-left" size={22} color={colors.surface} />
              </TouchableOpacity>
            ) : (
              <View style={styles.heroBackPlaceholder} />
            )}
            <Text style={styles.heroTitle}>My Profile</Text>
            <View style={styles.heroBackPlaceholder} />
          </View>

          {/* Large Centered Avatar with Translucent Ring & Red Camera Badge */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarRing}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitialsText}>{initials}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.cameraBadge}
              onPress={handlePickImage}
              disabled={isUploadingPhoto}
              activeOpacity={0.8}
              accessibilityLabel="Change profile picture"
            >
              {isUploadingPhoto ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Feather name="camera" size={15} color={colors.surface} />
              )}
            </TouchableOpacity>
          </View>

          {/* User Name & Email */}
          <Text style={styles.userName} numberOfLines={2}>
            {profile?.full_name}
          </Text>
          <Text style={styles.userEmail} numberOfLines={1}>
            {profile?.email}
          </Text>

          {/* Role Chip and Status Chip */}
          <View style={styles.chipsRow}>
            <View style={styles.roleChip}>
              <Text style={styles.roleChipText}>
                {profile?.role.name || user?.role || "Medical Representative"}
              </Text>
            </View>

            <View
              style={[
                styles.statusChip,
                profile?.is_active === false && styles.statusChipInactive,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  profile?.is_active === false && styles.statusDotInactive,
                ]}
              />
              <Text style={styles.statusChipText}>
                {profile?.is_active === false ? "Inactive" : "Active"}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* CONTACT CARD (Overlapping Hero) */}
        <View style={styles.contactCard}>
          <View style={styles.contactCardHeader}>
            <Text style={styles.contactCardTitle}>Contact</Text>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => setIsEditModalVisible(true)}
              activeOpacity={0.75}
              accessibilityLabel="Edit contact details"
            >
              <Feather name="edit-2" size={13} color={colors.brandBlue} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contactRow}>
            <View style={[styles.contactIconBox, { backgroundColor: colors.bluePastel }]}>
              <Feather name="mail" size={17} color={colors.brandBlue} />
            </View>
            <View style={styles.contactTextCol}>
              <Text style={styles.contactLabel}>Official email</Text>
              <Text style={styles.contactValue} numberOfLines={1}>
                {profile?.email || user?.email}
              </Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.contactRow}>
            <View style={[styles.contactIconBox, { backgroundColor: colors.tealPastel }]}>
              <Feather name="phone" size={17} color={colors.teal} />
            </View>
            <View style={styles.contactTextCol}>
              <Text style={styles.contactLabel}>Mobile number</Text>
              <Text style={styles.contactValue} numberOfLines={1}>
                {profile?.phone || "Not configured"}
              </Text>
            </View>
          </View>
        </View>

        {/* REPORTING MANAGER SECTION */}
        {profile?.role.code === "MR" && (
          <View style={styles.sectionWrapper}>
            <Text style={styles.sectionLabel}>REPORTING MANAGER</Text>
            <View style={styles.sectionCard}>
              {profile.current_manager ? (
                <View style={styles.managerRow}>
                  <View style={styles.managerAvatar}>
                    <Feather name="user" size={20} color={colors.surface} />
                  </View>
                  <View style={styles.managerTextCol}>
                    <Text style={styles.managerName}>{profile.current_manager.full_name}</Text>
                    <Text style={styles.managerEmail}>{profile.current_manager.email}</Text>
                    {profile.current_manager.phone ? (
                      <Text style={styles.managerPhone}>{profile.current_manager.phone}</Text>
                    ) : null}
                  </View>
                  {profile.current_manager.phone ? (
                    <TouchableOpacity
                      style={styles.callManagerFab}
                      onPress={() => handleCallManager(profile.current_manager!.phone!)}
                      activeOpacity={0.8}
                      accessibilityLabel="Call reporting manager"
                    >
                      <Feather name="phone" size={20} color={colors.surface} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : (
                <View style={styles.emptyManagerRow}>
                  <Feather name="info" size={16} color={colors.textFaint} />
                  <Text style={styles.emptyManagerText}>
                    No reporting manager currently assigned.
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* WORKSPACE SECTION */}
        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionLabel}>WORKSPACE</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setIsProductsVisible(true)}
              activeOpacity={0.7}
              accessibilityLabel="Open Products and E-Detailing"
            >
              <View style={[styles.menuIconBox, { backgroundColor: colors.bluePastel }]}>
                <Feather name="tablet" size={17} color={colors.brandBlue} />
              </View>
              <Text style={styles.menuLabel}>Products & E-Detailing</Text>
              <Feather name="chevron-right" size={18} color={colors.textFaint} />
            </TouchableOpacity>

            <View style={styles.cardDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setIsOrdersVisible(true)}
              activeOpacity={0.7}
              accessibilityLabel="Open Commercial Orders and POB"
            >
              <View style={[styles.menuIconBox, { backgroundColor: colors.tealPastel }]}>
                <Feather name="shopping-bag" size={17} color={colors.teal} />
              </View>
              <Text style={styles.menuLabel}>Commercial Orders & POB</Text>
              <Feather name="chevron-right" size={18} color={colors.textFaint} />
            </TouchableOpacity>

            <View style={styles.cardDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate(ROUTES.ReportsCatalog as any)}
              activeOpacity={0.7}
              accessibilityLabel="Open Performance and Reports"
            >
              <View style={[styles.menuIconBox, { backgroundColor: colors.purplePastel }]}>
                <Feather name="bar-chart-2" size={17} color={colors.purple} />
              </View>
              <Text style={styles.menuLabel}>Performance & Reports</Text>
              <Feather name="chevron-right" size={18} color={colors.textFaint} />
            </TouchableOpacity>

            <View style={styles.cardDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setIsNotifsVisible(true)}
              activeOpacity={0.7}
              accessibilityLabel="Open Notification Center"
            >
              <View style={[styles.menuIconBox, { backgroundColor: colors.orangePastel }]}>
                <Feather name="bell" size={17} color={colors.orange} />
              </View>
              <Text style={styles.menuLabel}>Notification Center</Text>
              <Feather name="chevron-right" size={18} color={colors.textFaint} />
            </TouchableOpacity>
          </View>
        </View>

        {/* SECURITY & SESSIONS SECTION */}
        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionLabel}>SECURITY & SESSIONS</Text>
          <View style={styles.menuCard}>
            {/* Change MPIN with SecureStore Integration */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMpinStep(1);
                setFirstMpin("");
                setConfirmMpin("");
                setMpinError("");
                setIsMpinModalVisible(true);
              }}
              activeOpacity={0.7}
              accessibilityLabel="Change MPIN"
            >
              <View style={[styles.menuIconBox, { backgroundColor: colors.bluePastel }]}>
                <Feather name="grid" size={17} color={colors.brandBlue} />
              </View>
              <Text style={styles.menuLabel}>Change MPIN</Text>
              <Feather name="chevron-right" size={18} color={colors.textFaint} />
            </TouchableOpacity>

            <View style={styles.cardDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setIsPwModalVisible(true)}
              activeOpacity={0.7}
              accessibilityLabel="Change Login Password"
            >
              <View style={[styles.menuIconBox, { backgroundColor: colors.inputBackground }]}>
                <Feather name="lock" size={17} color={colors.navy} />
              </View>
              <Text style={styles.menuLabel}>Change Login Password</Text>
              <Feather name="chevron-right" size={18} color={colors.textFaint} />
            </TouchableOpacity>

            <View style={styles.cardDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleLogoutAll}
              activeOpacity={0.7}
              accessibilityLabel="Log Out All Other Devices"
            >
              <View style={[styles.menuIconBox, { backgroundColor: colors.dangerPastel }]}>
                <Feather name="shield" size={17} color={colors.accentRed} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.accentRed }]}>
                Log Out All Other Devices
              </Text>
              <Feather name="chevron-right" size={18} color={colors.textFaint} />
            </TouchableOpacity>
          </View>
        </View>

        {/* SIGN OUT BUTTON (White rounded card button with red icon & text) */}
        <TouchableOpacity
          style={styles.signOutCard}
          onPress={handleSignOut}
          activeOpacity={0.8}
          accessibilityLabel="Sign out"
        >
          <Feather name="log-out" size={18} color={colors.accentRed} />
          <Text style={styles.signOutCardText}>Sign out</Text>
        </TouchableOpacity>

        {/* APP VERSION FOOTER */}
        <Text style={styles.appVersionFooter}>
          Mediate MR App · version {appVersion}
        </Text>
      </ScrollView>

      {/* EDIT CONTACT DETAILS MODAL */}
      <Modal visible={isEditModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheetContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Edit Contact Details</Text>
              <TouchableOpacity
                onPress={() => setIsEditModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>FULL NAME</Text>
            <TextInput
              style={styles.inputField}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your Full Name"
              placeholderTextColor={colors.textFaint}
            />

            <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
            <TextInput
              style={styles.inputField}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="+91..."
              placeholderTextColor={colors.textFaint}
              keyboardType="phone-pad"
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Text style={styles.modalSaveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CHANGE LOGIN PASSWORD MODAL */}
      <Modal visible={isPwModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheetContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity
                onPress={() => setIsPwModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>CURRENT PASSWORD</Text>
            <TextInput
              style={styles.inputField}
              value={currentPw}
              onChangeText={setCurrentPw}
              placeholder="••••••••"
              placeholderTextColor={colors.textFaint}
              secureTextEntry
            />

            <Text style={styles.fieldLabel}>NEW PASSWORD</Text>
            <TextInput
              style={styles.inputField}
              value={newPw}
              onChangeText={setNewPw}
              placeholder="Minimum 6 characters"
              placeholderTextColor={colors.textFaint}
              secureTextEntry
            />

            <Text style={styles.fieldLabel}>CONFIRM NEW PASSWORD</Text>
            <TextInput
              style={styles.inputField}
              value={confirmPw}
              onChangeText={setConfirmPw}
              placeholder="Re-enter new password"
              placeholderTextColor={colors.textFaint}
              secureTextEntry
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsPwModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleChangePassword}
                disabled={isChangingPw}
              >
                {isChangingPw ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Text style={styles.modalSaveBtnText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CHANGE MPIN MODAL (Full 2-Step Keypad Flow with SecureStore Integration) */}
      <Modal visible={isMpinModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheetContent, styles.mpinModalContent]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {mpinStep === 1 ? "Create New MPIN" : "Confirm New MPIN"}
              </Text>
              <TouchableOpacity
                onPress={() => setIsMpinModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.mpinSubtitle}>
              {mpinStep === 1
                ? "Enter a 4-digit security PIN for instant quick login."
                : "Re-enter the 4-digit PIN to confirm and save."}
            </Text>

            <View style={styles.pinDotsWrap}>
              <PinDots
                length={4}
                value={activeMpin}
                hasError={hasMpinShake}
              />
            </View>

            {mpinError ? (
              <Text style={styles.mpinErrorText}>{mpinError}</Text>
            ) : (
              <Text style={styles.mpinHintText}>
                {mpinStep === 1 ? "Step 1 of 2" : "Step 2 of 2"}
              </Text>
            )}

            <View style={styles.keypadWrapper}>
              <Keypad
                onPressDigit={handleMpinDigit}
                onPressDelete={handleMpinDelete}
                disabled={isSavingMpin}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ENTERPRISE CATALOG & NOTIFICATION MODALS */}
      <ProductsCatalogScreen
        visible={isProductsVisible}
        onClose={() => setIsProductsVisible(false)}
        onSelectProductForOrder={() => {
          setIsProductsVisible(false);
          setIsOrdersVisible(true);
        }}
      />

      <OrdersScreen
        visible={isOrdersVisible}
        onClose={() => setIsOrdersVisible(false)}
      />

      <NotificationsModal
        visible={isNotifsVisible}
        onClose={() => setIsNotifsVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingCenter: {
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: "600",
  },
  scrollContent: {
    flexGrow: 1,
  },
  // HERO SECTION
  heroGradient: {
    minHeight: 318,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingHorizontal: spacing.lg,
    paddingBottom: 42,
    position: "relative",
    overflow: "hidden",
    alignItems: "center",
  },
  decorativeCircleLeft: {
    position: "absolute",
    top: -20,
    left: -40,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  decorativeCircleRight: {
    position: "absolute",
    top: 30,
    right: -60,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  heroTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: spacing.md,
  },
  heroBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.translucentWhite,
    alignItems: "center",
    justifyContent: "center",
  },
  heroBackPlaceholder: {
    width: 44,
    height: 44,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.surface,
    textAlign: "center",
  },
  avatarContainer: {
    position: "relative",
    width: 96,
    height: 96,
    marginBottom: spacing.xs + 2,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surface,
    borderWidth: 4,
    borderColor: colors.translucentWhiteHigh,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitialsText: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.navy,
  },
  cameraBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accentRed,
    borderWidth: 3,
    borderColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  userName: {
    fontSize: 21,
    fontWeight: "800",
    color: colors.surface,
    textAlign: "center",
    marginTop: 4,
  },
  userEmail: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.emailSubtitle,
    textAlign: "center",
    marginTop: 2,
  },
  chipsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
  },
  roleChip: {
    backgroundColor: colors.translucentWhite,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.surface,
  },
  statusChip: {
    backgroundColor: colors.successGreen,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: radii.full,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusChipInactive: {
    backgroundColor: colors.accentRed,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surface,
  },
  statusDotInactive: {
    backgroundColor: colors.surface,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.surface,
  },
  // CONTACT CARD
  contactCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 18,
    marginHorizontal: 16,
    marginTop: -28,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  contactCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  contactCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textInk,
  },
  editBtn: {
    backgroundColor: colors.tintBlue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.brandBlue,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 4,
  },
  contactIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  contactTextCol: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textInk,
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.inputBackground,
    marginVertical: 10,
  },
  // SECTION WRAPPERS & HEADERS
  sectionWrapper: {
    marginTop: 18,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textFaint,
    letterSpacing: 0.8,
    marginHorizontal: 20,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  // MANAGER ROW
  managerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  managerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  managerTextCol: {
    flex: 1,
    marginHorizontal: 12,
  },
  managerName: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textInk,
  },
  managerEmail: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textMuted,
    marginTop: 1,
  },
  managerPhone: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.teal,
    marginTop: 2,
  },
  callManagerFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.successGreen,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },
  emptyManagerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  emptyManagerText: {
    fontSize: 13,
    color: colors.textMuted,
    flex: 1,
  },
  // MENU CARDS (WORKSPACE & SECURITY)
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: colors.textInk,
  },
  // SIGN OUT CARD
  signOutCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 18,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...shadows.card,
  },
  signOutCardText: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.accentRed,
  },
  appVersionFooter: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textFaint,
    textAlign: "center",
    marginTop: 14,
  },
  // MODAL STYLING
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 21, 56, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalSheetContent: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radii.xxl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  mpinModalContent: {
    paddingBottom: spacing.lg,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textInk,
  },
  mpinSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  pinDotsWrap: {
    alignItems: "center",
    marginVertical: spacing.md,
  },
  mpinHintText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textFaint,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  mpinErrorText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.accentRed,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  keypadWrapper: {
    alignItems: "center",
    width: "100%",
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: spacing.xs,
  },
  inputField: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    fontSize: 14,
    color: colors.textInk,
    backgroundColor: colors.inputBackground,
    marginBottom: spacing.sm,
  },
  modalActionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.lg,
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
  modalSaveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radii.lg,
    backgroundColor: colors.navy,
  },
  modalSaveBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface,
  },
});
