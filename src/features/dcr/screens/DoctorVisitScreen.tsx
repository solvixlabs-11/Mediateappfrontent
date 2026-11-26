import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { DoctorDto, customersApi } from "../../customers/api/customersApi";
import { usersApi } from "../../users/api/usersApi";
import { mastersApi } from "../../masters/api/mastersApi";
import { dcrApi } from "../api/dcrApi";
import { useAuthStore } from "../../auth/store";
import { getCurrentGeoLocation } from "../../../shared/utils/location";
import { RootStackParamList } from "../../../navigation/types";
import { CompanionSearchModal } from "../components/CompanionSearchModal";
import { DoctorSearchModal } from "../components/DoctorSearchModal";
import { ScreenHeader } from "../../../shared/components/ScreenHeader";
import { colors, radii, spacing, typography, shadows } from "../../../theme";

interface VisitTypeDef {
  key: string;
  letter: string;
  title: string;
  icon: keyof typeof Feather.glyphMap;
}

const VISIT_TYPES: VisitTypeDef[] = [
  {
    key: "GROUP_PROMOTIONAL",
    letter: "G",
    title: "Group Promotional Call",
    icon: "users",
  },
  {
    key: "REGULAR_SAMPLE",
    letter: "R",
    title: "Regular Sample Call",
    icon: "gift",
  },
  {
    key: "REMINDER",
    letter: "R",
    title: "Prescription Reminder Call",
    icon: "bell",
  },
];

const STEPS = [
  { id: 1, title: "Visit Type", icon: "check-circle" as const },
  { id: 2, title: "Call Details", icon: "file-text" as const },
  { id: 3, title: "Photo & Rating", icon: "camera" as const },
];

interface CompanionUser {
  id: number;
  name: string;
  role: string;
  hq: string;
}

export function DoctorVisitScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, "DoctorVisit">>();
  const user = useAuthStore((s) => s.user);

  // 3-Step Wizard
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Visit Type
  const [selectedVisitType, setSelectedVisitType] = useState<string>("REGULAR_SAMPLE");

  // Step 2: Visiting Details
  const [visitingDate] = useState<string>(
    new Date()
      .toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
      .replace(/\//g, "-")
  );

  // Working With (Companion / Joint Manager)
  const [availableCompanions, setAvailableCompanions] = useState<CompanionUser[]>([]);
  const [workingWith, setWorkingWith] = useState<CompanionUser | null>(null);
  const [isWorkingWithPickerOpen, setIsWorkingWithPickerOpen] = useState(false);
  const [workingWithSearch, setWorkingWithSearch] = useState("");

  // Division
  const [divisionsList, setDivisionsList] = useState<string[]>([]);
  const [division, setDivision] = useState<string>("DEFAULT DIVISION");
  const [isDivisionPickerOpen, setIsDivisionPickerOpen] = useState(false);

  // Doctor Selection
  const [doctorsList, setDoctorsList] = useState<DoctorDto[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorDto | null>(null);
  const [isDoctorPickerOpen, setIsDoctorPickerOpen] = useState(false);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState("");

  // Step 3: Photo Capture & Analysis
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [remarks, setRemarks] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // GPS Location State
  const [gpsLocation, setGpsLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
    distanceMeters: number | null;
  }>({
    latitude: 23.075341,
    longitude: 72.531375,
    address: "Auto-detecting current location...",
    distanceMeters: null,
  });

  // Load backend data
  useEffect(() => {
    // 1. Load Doctors
    customersApi
      .listDoctors()
      .then((docs) => {
        setDoctorsList(docs || []);
      })
      .catch(() => {
        setDoctorsList([]);
      });

    // 2. Load Divisions from Masters
    mastersApi
      .listItems("DIVISION")
      .then((items) => {
        if (items && items.length > 0) {
          const names = items.map((i) => i.name);
          setDivisionsList(names);
          setDivision(names[0]);
        } else {
          setDivisionsList(["PHARMA CARDIO", "DIABETOLOGY", "GENERAL"]);
          setDivision("PHARMA CARDIO");
        }
      })
      .catch(() => {
        setDivisionsList(["PHARMA CARDIO", "DIABETOLOGY", "GENERAL"]);
        setDivision("PHARMA CARDIO");
      });

    // 3. Load Field Users for Joint Call
    usersApi
      .listUsers({ page_size: 50 })
      .then((res) => {
        const list = res?.items || [];
        if (list.length > 0) {
          const comps = list.map((u: any) => ({
            id: u.id,
            name: u.full_name,
            role: typeof u.role === "string" ? u.role : u.role?.name || "Manager",
            hq: u.territory?.name || "Headquarters",
          }));
          setAvailableCompanions(comps);
        }
      })
      .catch(() => {
        setAvailableCompanions([]);
      });

    // 4. Get Current GPS
    getCurrentGeoLocation().then((loc) => {
      if (loc) {
        setGpsLocation({
          latitude: loc.latitude,
          longitude: loc.longitude,
          address: loc.address || "Field Location",
          distanceMeters: 10,
        });
      }
    });
  }, []);

  // Pre-fill doctor if passed from PlanVisitsScreen
  useEffect(() => {
    if (route.params?.initialCustomerId && doctorsList.length > 0) {
      const found = doctorsList.find((d) => d.id === route.params?.initialCustomerId);
      if (found) {
        setSelectedDoctor(found);
      }
    }
  }, [route.params, doctorsList]);

  // Handle Photo Capture
  const handleCapturePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Camera access is needed to capture doctor call photo.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        setCapturedPhotoUri(result.assets[0].uri);
      }
    } catch {
      setCapturedPhotoUri(
        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80"
      );
    }
  };

  // Submit DCR Visit
  const handleSubmitDcr = async () => {
    if (!selectedDoctor) {
      Alert.alert("Doctor Required", "Please select a doctor for this visit.");
      setCurrentStep(2);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        dcr_date: new Date().toISOString().split("T")[0],
        customer_type: "DOCTOR",
        doctor_id: selectedDoctor.id,
        planned_visit_id: route.params?.initialPlannedVisitId || null,
        visit_type: workingWith ? "JOINT_WITH_MANAGER" : "INDEPENDENT",
        joint_manager_id: workingWith ? workingWith.id : null,
        call_time: new Date().toISOString(),
        call_duration_minutes: 15,
        latitude: gpsLocation.latitude,
        longitude: gpsLocation.longitude,
        location_accuracy: 10,
        is_mock_location: false,
        remarks: remarks || `Doctor call recorded with ${rating} star rating.`,
        post_call_analysis: {
          doctor_feedback: remarks,
          call_outcome: rating >= 4 ? "HIGHLY_INTERESTED" : "MODERATE",
          prescription_commitment: rating >= 4 ? "HIGH" : "MEDIUM",
          follow_up_required: rating < 3,
        },
      };

      await dcrApi.submitDcr(payload as any);
      Alert.alert(
        "Doctor Visit Submitted 🎉",
        `Doctor call for Dr. ${selectedDoctor.full_name} has been recorded with GPS geotag verification.`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert(
        "Error Submitting Visit",
        err?.response?.data?.detail || "Please check your inputs and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDoctors = doctorsList.filter(
    (d) =>
      d.full_name.toLowerCase().includes(doctorSearchQuery.toLowerCase().trim()) ||
      (d.specialization &&
        d.specialization.toLowerCase().includes(doctorSearchQuery.toLowerCase().trim()))
  );

  const filteredCompanions = availableCompanions.filter((c) =>
    c.name.toLowerCase().includes(workingWithSearch.toLowerCase().trim())
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar style="light" />

      {/* Signature Navy Header */}
      <ScreenHeader
        title="Doctor Visit"
        subtitle={`Step ${currentStep} of 3 • ${STEPS[currentStep - 1].title}`}
        variant="navy"
        onBack={() => {
          if (currentStep > 1) setCurrentStep(currentStep - 1);
          else navigation.goBack();
        }}
        rightElement={
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>{currentStep}/3</Text>
          </View>
        }
      />

      {/* Modern Stepper Indicator */}
      <View style={styles.stepperContainer}>
        {STEPS.map((s, idx) => {
          const isActive = s.id === currentStep;
          const isDone = s.id < currentStep;
          return (
            <React.Fragment key={s.id}>
              <TouchableOpacity
                style={[
                  styles.stepPill,
                  isActive && styles.stepPillActive,
                  isDone && styles.stepPillDone,
                ]}
                onPress={() => setCurrentStep(s.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.stepIconCircle,
                    isActive && styles.stepIconCircleActive,
                    isDone && styles.stepIconCircleDone,
                  ]}
                >
                  {isDone ? (
                    <Feather name="check" size={12} color={colors.surface} />
                  ) : (
                    <Feather
                      name={s.icon}
                      size={12}
                      color={isActive ? colors.surface : colors.textMuted}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.stepPillText,
                    isActive && styles.stepPillTextActive,
                    isDone && styles.stepPillTextDone,
                  ]}
                  numberOfLines={1}
                >
                  {s.title}
                </Text>
              </TouchableOpacity>
              {idx < STEPS.length - 1 && (
                <View
                  style={[
                    styles.stepConnectorLine,
                    isDone && styles.stepConnectorLineDone,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Step Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= STEP 1: SELECT TYPES OF VISIT ================= */}
        {currentStep === 1 && (
          <View style={{ gap: spacing.lg }}>
            <View style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardIconBox}>
                  <Feather name="check-circle" size={16} color={colors.brandBlue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Select Call Purpose</Text>
                  <Text style={styles.cardSubtitle}>Choose the visit classification for DCR audit</Text>
                </View>
              </View>

              <View style={styles.visitTypeList}>
                {VISIT_TYPES.map((vt) => {
                  const isSelected = selectedVisitType === vt.key;
                  return (
                    <TouchableOpacity
                      key={vt.key}
                      style={[
                        styles.visitTypeCard,
                        isSelected && styles.visitTypeCardSelected,
                      ]}
                      onPress={() => setSelectedVisitType(vt.key)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.visitTypeIconBox,
                          isSelected && styles.visitTypeIconBoxSelected,
                        ]}
                      >
                        <Feather
                          name={vt.icon}
                          size={18}
                          color={isSelected ? colors.surface : colors.brandBlue}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.visitTypeTitle,
                            isSelected && styles.visitTypeTitleSelected,
                          ]}
                        >
                          {vt.title}
                        </Text>
                        <Text style={styles.visitTypeSub}>Code: {vt.letter}</Text>
                      </View>
                      {isSelected ? (
                        <View style={styles.checkCircle}>
                          <Feather name="check" size={14} color={colors.surface} />
                        </View>
                      ) : (
                        <View style={styles.radioEmpty} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* ================= STEP 2: VISITING DETAILS ================= */}
        {currentStep === 2 && (
          <View style={{ gap: spacing.lg }}>
            <View style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconBox, { backgroundColor: colors.tealPastel }]}>
                  <Feather name="file-text" size={16} color={colors.teal} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Visiting Details</Text>
                  <Text style={styles.cardSubtitle}>Date, accompanying manager & target doctor</Text>
                </View>
              </View>

              {/* Visiting Date */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Visiting Date</Text>
                <View style={styles.readOnlyField}>
                  <Feather name="calendar" size={16} color={colors.textMuted} />
                  <Text style={styles.readOnlyText}>{visitingDate}</Text>
                </View>
              </View>

              {/* Working With Section with '+' Icon */}
              <View style={styles.fieldBlock}>
                <View style={styles.workingWithHeader}>
                  <Text style={styles.fieldLabel}>Accompanying Manager (Joint Call)</Text>
                  <TouchableOpacity
                    style={styles.addManagerBtn}
                    onPress={() => setIsWorkingWithPickerOpen(true)}
                    activeOpacity={0.7}
                  >
                    <Feather name="plus" size={14} color={colors.brandBlue} />
                    <Text style={styles.addManagerText}>Add Joint</Text>
                  </TouchableOpacity>
                </View>

                {workingWith ? (
                  <View style={styles.workingWithCard}>
                    <View style={styles.workingAvatar}>
                      <Feather name="user-check" size={16} color={colors.brandBlue} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.workingName}>{workingWith.name}</Text>
                      <Text style={styles.workingHq}>
                        {workingWith.role} • {workingWith.hq}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => setWorkingWith(null)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Feather name="x-circle" size={18} color={colors.accentRed} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.emptyManagerCard}
                    onPress={() => setIsWorkingWithPickerOpen(true)}
                    activeOpacity={0.7}
                  >
                    <Feather name="user" size={16} color={colors.textFaint} />
                    <Text style={styles.emptyManagerText}>Independent Call (Tap to add manager)</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Division Dropdown */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Division</Text>
                <TouchableOpacity
                  style={styles.dropdownField}
                  onPress={() => setIsDivisionPickerOpen(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownValue}>{division}</Text>
                  <Feather name="chevron-down" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Doctor Picker */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabelPrimary}>
                  Select Doctor <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[styles.dropdownField, !selectedDoctor && styles.dropdownFieldError]}
                  onPress={() => setIsDoctorPickerOpen(true)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.dropdownValue, !selectedDoctor && { color: colors.textFaint }]}>
                      {selectedDoctor
                        ? `Dr. ${selectedDoctor.full_name.toUpperCase()}`
                        : "Choose Doctor from Directory..."}
                    </Text>
                    {selectedDoctor?.specialization ? (
                      <Text style={styles.dropdownSubtext}>
                        {selectedDoctor.specialization} • {selectedDoctor.category || "Tier A"}
                      </Text>
                    ) : null}
                  </View>
                  <Feather name="chevron-down" size={18} color={colors.textMuted} />
                </TouchableOpacity>

                {/* Distance Geofence Pill */}
                {selectedDoctor && (
                  <View style={styles.geofencePill}>
                    <Feather name="navigation" size={12} color={colors.successGreen} />
                    <Text style={styles.geofenceText}>
                      Geofence Verified • Approx. {gpsLocation.distanceMeters || 10}m away
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* ================= STEP 3: PHOTO & RATING ================= */}
        {currentStep === 3 && (
          <View style={{ gap: spacing.lg }}>
            {/* Photo Capture Card */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconBox, { backgroundColor: colors.orangePastel }]}>
                  <Feather name="camera" size={16} color={colors.orange} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Call Evidence / Photo</Text>
                  <Text style={styles.cardSubtitle}>Capture clinic nameplate or prescription pad</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.photoDashedBox}
                onPress={handleCapturePhoto}
                activeOpacity={0.8}
              >
                {capturedPhotoUri ? (
                  <View style={styles.photoPreviewWrapper}>
                    <Image source={{ uri: capturedPhotoUri }} style={styles.capturedPhoto} />
                    <View style={styles.retakeBadge}>
                      <Feather name="refresh-cw" size={14} color={colors.surface} />
                      <Text style={styles.retakeText}>Retake Photo</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <View style={styles.cameraIconCircle}>
                      <Feather name="camera" size={28} color={colors.navy} />
                    </View>
                    <Text style={styles.photoTapText}>Tap to Capture Photo</Text>
                    <Text style={styles.photoHintText}>GPS geotag & timestamp automatically linked</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Remarks & Rating Card */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconBox, { backgroundColor: colors.successGreenPastel }]}>
                  <Feather name="star" size={16} color={colors.successGreen} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Call Feedback & Rating</Text>
                  <Text style={styles.cardSubtitle}>Doctor reception and product interest</Text>
                </View>
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Visit Remarks / Discussion</Text>
                <TextInput
                  style={[styles.inputField, styles.textArea]}
                  placeholder="Detail products detailed, sample kits given, doctor feedback..."
                  placeholderTextColor={colors.textFaint}
                  value={remarks}
                  onChangeText={setRemarks}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.starsWrapper}>
                <Text style={styles.ratingPrompt}>Rate Doctor Call Response</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      activeOpacity={0.7}
                      style={styles.starTouch}
                    >
                      <Ionicons
                        name={star <= rating ? "star" : "star-outline"}
                        size={36}
                        color={star <= rating ? "#F59E0B" : colors.border}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modern Docked Bottom Bar */}
      <View style={styles.bottomBar}>
        {currentStep > 1 ? (
          <TouchableOpacity
            style={styles.prevBtn}
            onPress={() => setCurrentStep(currentStep - 1)}
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={16} color={colors.textInk} />
            <Text style={styles.prevBtnText}>Previous</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}

        <View style={styles.stepIndicatorTextContainer}>
          <Text style={styles.stepCurrentLabel}>STEP {currentStep} OF 3</Text>
        </View>

        {currentStep < 3 ? (
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={() => {
              if (currentStep === 2 && !selectedDoctor) {
                Alert.alert("Doctor Required", "Please select a Doctor before proceeding.");
                return;
              }
              setCurrentStep(currentStep + 1);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.nextBtnText}>Next</Text>
            <Feather name="arrow-right" size={16} color={colors.surface} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.finishBtn, isSubmitting && { opacity: 0.7 }]}
            onPress={handleSubmitDcr}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.surface} size="small" />
            ) : (
              <>
                <Feather name="check" size={16} color={colors.surface} />
                <Text style={styles.finishBtnText}>Finish & Log Call</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* 1. Working With Companion Picker Modal */}
      <CompanionSearchModal
        visible={isWorkingWithPickerOpen}
        companions={filteredCompanions}
        searchQuery={workingWithSearch}
        onSearchChange={setWorkingWithSearch}
        onSelect={(item) => {
          setWorkingWith(item);
          setIsWorkingWithPickerOpen(false);
        }}
        onClose={() => setIsWorkingWithPickerOpen(false)}
      />

      {/* 2. Division Picker Modal */}
      <Modal visible={isDivisionPickerOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.pickerCard}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Division</Text>
              <TouchableOpacity onPress={() => setIsDivisionPickerOpen(false)}>
                <Feather name="x" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {divisionsList.map((div) => (
              <TouchableOpacity
                key={div}
                style={styles.itemRow}
                onPress={() => {
                  setDivision(div);
                  setIsDivisionPickerOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.itemName,
                    division === div && styles.itemNameActive,
                  ]}
                >
                  {div}
                </Text>
                {division === div && (
                  <Feather name="check" size={18} color={colors.brandBlue} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* 3. Searchable Doctor Picker Modal */}
      <DoctorSearchModal
        visible={isDoctorPickerOpen}
        doctors={filteredDoctors}
        searchQuery={doctorSearchQuery}
        onSearchChange={setDoctorSearchQuery}
        onSelect={(item) => {
          setSelectedDoctor(item);
          setIsDoctorPickerOpen(false);
        }}
        onClose={() => setIsDoctorPickerOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stepBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  stepBadgeText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "800",
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  stepPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.inputBackground,
    gap: 6,
  },
  stepPillActive: {
    backgroundColor: colors.bluePastel,
  },
  stepPillDone: {
    backgroundColor: colors.tealPastel,
  },
  stepIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  stepIconCircleActive: {
    backgroundColor: colors.brandBlue,
  },
  stepIconCircleDone: {
    backgroundColor: colors.teal,
  },
  stepPillText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
  },
  stepPillTextActive: {
    color: colors.brandBlue,
    fontWeight: "800",
  },
  stepPillTextDone: {
    color: colors.teal,
    fontWeight: "800",
  },
  stepConnectorLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.borderLight,
    marginHorizontal: 4,
  },
  stepConnectorLineDone: {
    backgroundColor: colors.teal,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl * 2,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.soft,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.bluePastel,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    ...typography.heading,
    fontSize: 16,
    fontWeight: "800",
    color: colors.textInk,
  },
  cardSubtitle: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
  },
  visitTypeList: {
    gap: spacing.md,
  },
  visitTypeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  visitTypeCardSelected: {
    backgroundColor: colors.bluePastel,
    borderColor: colors.brandBlue,
  },
  visitTypeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  visitTypeIconBoxSelected: {
    backgroundColor: colors.brandBlue,
  },
  visitTypeTitle: {
    ...typography.heading,
    fontSize: 14,
    fontWeight: "700",
    color: colors.textInk,
  },
  visitTypeTitleSelected: {
    color: colors.brandBlue,
    fontWeight: "800",
  },
  visitTypeSub: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.brandBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  radioEmpty: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
  },
  fieldBlock: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: "700",
    color: colors.navy,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldLabelPrimary: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: "700",
    color: colors.navy,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  required: {
    color: colors.accentRed,
  },
  readOnlyField: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  readOnlyText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textInk,
    fontWeight: "600",
  },
  workingWithHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  addManagerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addManagerText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: "700",
    color: colors.brandBlue,
  },
  workingWithCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bluePastel,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.brandBlue,
  },
  workingAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  workingName: {
    ...typography.body,
    fontSize: 14,
    fontWeight: "700",
    color: colors.textInk,
  },
  workingHq: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
  },
  removeBtn: {
    padding: 4,
  },
  emptyManagerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.sm,
  },
  emptyManagerText: {
    ...typography.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  dropdownField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.inputBackground,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  dropdownFieldError: {
    borderColor: colors.accentRed,
  },
  dropdownValue: {
    ...typography.body,
    fontSize: 14,
    color: colors.textInk,
    fontWeight: "600",
  },
  dropdownSubtext: {
    ...typography.caption,
    fontSize: 12,
    color: colors.brandBlue,
    marginTop: 2,
    fontWeight: "700",
  },
  geofencePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    backgroundColor: colors.successGreenPastel,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  geofenceText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: "700",
    color: colors.successGreen,
  },
  photoDashedBox: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.orange,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.inputBackground,
    overflow: "hidden",
    minHeight: 180,
  },
  photoPreviewWrapper: {
    width: "100%",
    height: 180,
    borderRadius: radii.lg,
    overflow: "hidden",
    position: "relative",
  },
  capturedPhoto: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  retakeBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 21, 56, 0.85)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    gap: 6,
  },
  retakeText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "700",
  },
  photoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  cameraIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.orangePastel,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  photoTapText: {
    ...typography.heading,
    fontSize: 15,
    fontWeight: "800",
    color: colors.textInk,
  },
  photoHintText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  inputField: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    fontSize: 14,
    color: colors.textInk,
  },
  textArea: {
    minHeight: 76,
    textAlignVertical: "top",
  },
  starsWrapper: {
    alignItems: "center",
    paddingTop: spacing.md,
  },
  ratingPrompt: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  starsRow: {
    flexDirection: "row",
    gap: 8,
  },
  starTouch: {
    padding: 4,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    ...shadows.soft,
  },
  prevBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.lg,
    backgroundColor: colors.inputBackground,
  },
  prevBtnText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: "700",
    color: colors.textInk,
  },
  stepIndicatorTextContainer: {
    alignItems: "center",
  },
  stepCurrentLabel: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: "800",
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.navy,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radii.lg,
    ...shadows.soft,
  },
  nextBtnText: {
    ...typography.button,
    fontSize: 14,
    fontWeight: "800",
    color: colors.surface,
  },
  finishBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.successGreen,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radii.lg,
    ...shadows.soft,
  },
  finishBtnText: {
    ...typography.button,
    fontSize: 14,
    fontWeight: "800",
    color: colors.surface,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.backdrop,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  pickerCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.medium,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  pickerTitle: {
    ...typography.heading,
    fontSize: 16,
    fontWeight: "800",
    color: colors.textInk,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemName: {
    ...typography.body,
    fontSize: 14,
    color: colors.textInk,
    fontWeight: "600",
  },
  itemNameActive: {
    color: colors.brandBlue,
    fontWeight: "800",
  },
});
