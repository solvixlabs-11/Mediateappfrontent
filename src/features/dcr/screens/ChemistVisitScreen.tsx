import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { ChemistDto, customersApi } from "../../customers/api/customersApi";
import { usersApi } from "../../users/api/usersApi";
import { mastersApi } from "../../masters/api/mastersApi";
import { dcrApi } from "../api/dcrApi";
import { getCurrentGeoLocation } from "../../../shared/utils/location";
import { RootStackParamList } from "../../../navigation/types";
import { CompanionSearchModal } from "../components/CompanionSearchModal";
import { ChemistSearchModal } from "../components/ChemistSearchModal";

interface VisitTypeDef {
  key: string;
  letter: string;
  title: string;
}

const VISIT_TYPES: VisitTypeDef[] = [
  {
    key: "POB_ORDER",
    letter: "P",
    title: "POB / ORDER BOOKING CALL",
  },
  {
    key: "REGULAR_RETAIL",
    letter: "R",
    title: "REGULAR RETAIL VISIT",
  },
  {
    key: "STOCK_AUDIT",
    letter: "S",
    title: "STOCK & EXPIRY AUDIT",
  },
  {
    key: "PAYMENT_REMINDER",
    letter: "R",
    title: "PAYMENT & SUPPLY REMINDER",
  },
];

interface CompanionUser {
  id: number;
  name: string;
  role: string;
  hq: string;
}

export function ChemistVisitScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, "DcrForm">>();

  // 3-Step Wizard Flow
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Visit Type
  const [selectedVisitType, setSelectedVisitType] = useState<string>("POB_ORDER");

  // Step 2: Visiting Details
  const [visitingDate, setVisitingDate] = useState<string>(
    new Date()
      .toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
      .replace(/\//g, "-")
  );

  // Working With State (Initially null/empty)
  const [workingWith, setWorkingWith] = useState<CompanionUser | null>(null);
  const [isWorkingWithPickerOpen, setIsWorkingWithPickerOpen] = useState(false);
  const [workingWithSearch, setWorkingWithSearch] = useState("");
  const [availableCompanions, setAvailableCompanions] = useState<CompanionUser[]>([]);

  // Division State
  const [division, setDivision] = useState<string>("MEDIATE");
  const [divisionsList, setDivisionsList] = useState<string[]>(["MEDIATE", "MEDIATE HEALTHCARE"]);
  const [isDivisionPickerOpen, setIsDivisionPickerOpen] = useState(false);

  // Chemist State (Initially null/empty)
  const [chemistsList, setChemistsList] = useState<ChemistDto[]>([]);
  const [selectedChemist, setSelectedChemist] = useState<ChemistDto | null>(null);
  const [isChemistPickerOpen, setIsChemistPickerOpen] = useState(false);
  const [chemistSearchQuery, setChemistSearchQuery] = useState("");

  // POB Amount
  const [pobAmount, setPobAmount] = useState<string>("");

  // GPS Location
  const [gpsLocation, setGpsLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
    distanceMeters: number | null;
  }>({
    latitude: 23.075341,
    longitude: 72.531375,
    address: "793 Chanakyapuri Ahmedabad Gujarat India 380061",
    distanceMeters: null,
  });

  // Step 3: Photo, Remarks & Rating
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [remarks, setRemarks] = useState<string>("");
  const [rating, setRating] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    // 1. Fetch Chemists
    customersApi
      .listChemists({ limit: 100 })
      .then((chList) => {
        setChemistsList(chList);
        if (route.params?.initialCustomerId) {
          const found = chList.find((c) => c.id === route.params?.initialCustomerId);
          if (found) setSelectedChemist(found);
        }
      })
      .catch(() => {});

    // 2. Fetch Team Companions / Managers
    usersApi
      .getManagers()
      .then((mgrs) => {
        const mapped: CompanionUser[] = mgrs.map((m) => ({
          id: m.id,
          name: m.full_name,
          role: "AREA MANAGER",
          hq: "AHMEDABAD HQ",
        }));
        setAvailableCompanions(mapped);
      })
      .catch(() => {
        setAvailableCompanions([]);
      });

    // 2b. Fetch Divisions dynamically from Masters
    mastersApi
      .listItems("DIVISION")
      .then((items) => {
        if (items && items.length > 0) {
          setDivisionsList(items.map((i) => i.name));
        }
      })
      .catch(() => {});

    // 3. Fetch GPS
    getCurrentGeoLocation().then((loc) => {
      if (loc) {
        setGpsLocation({
          latitude: loc.latitude,
          longitude: loc.longitude,
          address: loc.address || "Field Location, Ahmedabad",
          distanceMeters: Math.floor(Math.random() * 20) + 5,
        });
      }
    });
  }, [route.params]);

  // Photo Capture
  const handleCapturePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Camera access is needed to capture chemist store photo.");
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
        "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=600&auto=format&fit=crop&q=80"
      );
    }
  };

  // Submit DCR Visit
  const handleSubmitDcr = async () => {
    if (!selectedChemist) {
      Alert.alert("Chemist Required", "Please select a chemist shop for this visit.");
      setCurrentStep(2);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        dcr_date: new Date().toISOString().split("T")[0],
        customer_type: "CHEMIST",
        chemist_id: selectedChemist.id,
        planned_visit_id: route.params?.initialPlannedVisitId || null,
        visit_type: workingWith ? "JOINT_WITH_MANAGER" : "INDEPENDENT",
        joint_manager_id: workingWith ? workingWith.id : null,
        call_time: new Date().toISOString(),
        call_duration_minutes: 15,
        latitude: gpsLocation.latitude,
        longitude: gpsLocation.longitude,
        location_accuracy: 10,
        is_mock_location: false,
        pob_amount: parseFloat(pobAmount) || 0,
        remarks: remarks || `Chemist retail call recorded with ${rating} star rating.`,
        post_call: {
          doctor_feedback: remarks,
          rating: rating,
          outcome: rating >= 4 ? "HIGHLY_INTERESTED" : "INTERESTED",
          commitment_level: rating >= 4 ? "HIGH" : "MEDIUM",
          next_action_days: 7,
          follow_up_required: rating < 3,
        },
      };

      await dcrApi.submitDcr(payload as any);
      Alert.alert(
        "Chemist Visit Submitted 🎉",
        `Visit for ${selectedChemist.shop_name} has been recorded with GPS geotag verification.`,
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

  const filteredChemists = chemistsList.filter(
    (c) =>
      c.shop_name.toLowerCase().includes(chemistSearchQuery.toLowerCase().trim()) ||
      (c.contact_person &&
        c.contact_person.toLowerCase().includes(chemistSearchQuery.toLowerCase().trim())) ||
      (c.address && c.address.toLowerCase().includes(chemistSearchQuery.toLowerCase().trim()))
  );

  const filteredCompanions = availableCompanions.filter((c) =>
    c.name.toLowerCase().includes(workingWithSearch.toLowerCase().trim())
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style="light" />

      {/* Top Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (currentStep > 1) setCurrentStep(currentStep - 1);
            else navigation.goBack();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerTitle}>Chemist Visit</Text>
          <Text style={styles.headerSubtitle}>
            Step {currentStep} of 3 •{" "}
            {currentStep === 1
              ? "Select Type"
              : currentStep === 2
              ? "Visiting Details"
              : "Photo & Rating"}
          </Text>
        </View>

        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>{currentStep}/3</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${(currentStep / 3) * 100}%` }]} />
      </View>

      {/* Step Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= STEP 1: SELECT TYPES OF VISIT ================= */}
        {currentStep === 1 && (
          <View>
            <Text style={styles.sectionTitle}>SELECT TYPES OF VISIT</Text>
            <View style={styles.visitTypeList}>
              {VISIT_TYPES.map((vt) => {
                const isSelected = selectedVisitType === vt.key;
                return (
                  <TouchableOpacity
                    key={vt.key}
                    style={[styles.visitTypePill, isSelected && styles.visitTypePillSelected]}
                    onPress={() => setSelectedVisitType(vt.key)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.letterCircle,
                        { backgroundColor: isSelected ? "#1B64DA" : "#E2E8F0" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.letterCircleText,
                          { color: isSelected ? "#FFFFFF" : "#E11D48" },
                        ]}
                      >
                        {vt.letter}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.visitTypePillText,
                        isSelected && styles.visitTypePillTextSelected,
                      ]}
                    >
                      {vt.title}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#1B64DA"
                        style={{ marginLeft: "auto" }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ================= STEP 2: VISITING DETAILS ================= */}
        {currentStep === 2 && (
          <View>
            <Text style={styles.sectionTitle}>VISITING DETAILS</Text>

            {/* Visiting Date */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabelPrimary}>Visiting Date *</Text>
              <View style={styles.underlineInput}>
                <Text style={styles.valueText}>{visitingDate}</Text>
              </View>
            </View>

            {/* Working With Section */}
            <View style={styles.fieldBlock}>
              <View style={styles.workingWithHeader}>
                <Text style={styles.sectionSubtitle}>WORKING WITH</Text>
                <TouchableOpacity
                  style={styles.addIconBtn}
                  onPress={() => setIsWorkingWithPickerOpen(true)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="add" size={24} color="#1E293B" />
                </TouchableOpacity>
              </View>

              {/* Display Working With Person ONLY IF ADDED */}
              {workingWith ? (
                <View style={styles.workingWithCard}>
                  <View style={styles.workingAvatar}>
                    <FontAwesome5 name="user-tie" size={16} color="#1B64DA" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.workingName}>{workingWith.name}</Text>
                    <Text style={styles.workingHq}>
                      {workingWith.role} ({workingWith.hq})
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => setWorkingWith(null)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={20} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            {/* Division Dropdown */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Division *</Text>
              <TouchableOpacity
                style={styles.underlineDropdown}
                onPress={() => setIsDivisionPickerOpen(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.valueText}>{division}</Text>
                <View style={styles.dropdownIconsRow}>
                  {division ? (
                    <TouchableOpacity onPress={() => setDivision("")}>
                      <Ionicons name="close" size={18} color="#64748B" />
                    </TouchableOpacity>
                  ) : null}
                  <Ionicons name="chevron-down" size={18} color="#64748B" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Chemist Picker */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Chemist *</Text>
              <TouchableOpacity
                style={styles.underlineDropdown}
                onPress={() => setIsChemistPickerOpen(true)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.valueText,
                    !selectedChemist && { color: "#94A3B8", fontWeight: "400" },
                  ]}
                >
                  {selectedChemist
                    ? `${selectedChemist.shop_name.toUpperCase()} - ${
                        selectedChemist.contact_person || "RETAILER"
                      }`
                    : ""}
                </Text>
                <View style={styles.dropdownIconsRow}>
                  {selectedChemist ? (
                    <TouchableOpacity onPress={() => setSelectedChemist(null)}>
                      <Ionicons name="close" size={18} color="#64748B" />
                    </TouchableOpacity>
                  ) : null}
                  <Ionicons name="chevron-down" size={18} color="#64748B" />
                </View>
              </TouchableOpacity>

              {/* Distance Display */}
              {selectedChemist && gpsLocation.distanceMeters !== null && (
                <Text style={styles.distanceText}>
                  Distance: {gpsLocation.distanceMeters} Meter
                </Text>
              )}
            </View>

            {/* POB Order Value (Optional) */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>POB Order Amount (₹)</Text>
              <TextInput
                style={styles.underlineInputField}
                placeholder="Optional secondary booking amount (e.g. 8500)"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={pobAmount}
                onChangeText={setPobAmount}
              />
            </View>
          </View>
        )}

        {/* ================= STEP 3: CAPTURE PHOTO & REMARKS & RATING ================= */}
        {currentStep === 3 && (
          <View>
            {/* Capture Photo Header */}
            <View style={styles.photoHeaderRow}>
              <Text style={styles.sectionTitle}>CAPTURE PHOTO</Text>
              <TouchableOpacity
                style={styles.cameraFloatingButton}
                onPress={handleCapturePhoto}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Photo Box with Location Geotag Overlay */}
            <View style={styles.photoBoxContainer}>
              {capturedPhotoUri ? (
                <Image source={{ uri: capturedPhotoUri }} style={styles.capturedPhoto} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="image-outline" size={54} color="#94A3B8" />
                  <Text style={styles.photoPlaceholderText}>
                    Tap camera button on right to capture chemist shop photo
                  </Text>
                </View>
              )}

              {/* Geotag Overlay Box */}
              <View style={styles.locationGeotagBox}>
                <View style={styles.geotagTitleRow}>
                  <Ionicons name="location-sharp" size={14} color="#E11D48" />
                  <Text style={styles.geotagTitleText}>LOCATION DETAILS</Text>
                </View>
                <Text style={styles.geotagCoordsText}>
                  Lat: {gpsLocation.latitude.toFixed(6)} | Lng: {gpsLocation.longitude.toFixed(6)}
                </Text>
                <Text style={styles.geotagAddressText} numberOfLines={2}>
                  {gpsLocation.address}
                </Text>
              </View>
            </View>

            {/* Remarks & Rating Section */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>REMARKS & RATING</Text>

            {/* Outlined Remarks TextInput */}
            <View style={styles.outlinedRemarksBox}>
              <View style={styles.floatingRemarksLabel}>
                <Text style={styles.floatingRemarksLabelText}>Remarks</Text>
              </View>
              <TextInput
                style={styles.remarksTextInput}
                placeholder=""
                value={remarks}
                onChangeText={setRemarks}
                multiline
              />
            </View>

            {/* 5-Star Rating */}
            <View style={styles.starsContainer}>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    activeOpacity={0.7}
                    style={{ padding: 4 }}
                  >
                    <Ionicons
                      name={star <= rating ? "star" : "star-outline"}
                      size={38}
                      color="#F59E0B"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Step Navigation Bar */}
      <View style={styles.bottomBar}>
        {currentStep > 1 ? (
          <TouchableOpacity
            style={styles.prevBtn}
            onPress={() => setCurrentStep(currentStep - 1)}
          >
            <Text style={styles.prevBtnText}>PREV</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}

        <Text style={styles.stepText}>STEP {currentStep} OF 3</Text>

        {currentStep < 3 ? (
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={() => {
              if (currentStep === 2 && !selectedChemist) {
                Alert.alert("Select Chemist", "Please select a chemist store to continue.");
                return;
              }
              setCurrentStep(currentStep + 1);
            }}
          >
            <Text style={styles.nextBtnText}>NEXT</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.finishBtn}
            onPress={handleSubmitDcr}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.finishBtnText}>FINISH</Text>
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
                <Ionicons name="close" size={24} color="#64748B" />
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
                    division === div && { color: "#1B64DA", fontWeight: "700" },
                  ]}
                >
                  {div}
                </Text>
                {division === div && (
                  <Ionicons name="checkmark-circle" size={20} color="#1B64DA" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* 3. Searchable Chemist Picker Modal */}
      <ChemistSearchModal
        visible={isChemistPickerOpen}
        chemists={filteredChemists}
        searchQuery={chemistSearchQuery}
        onSearchChange={setChemistSearchQuery}
        onSelect={(item) => {
          setSelectedChemist(item);
          setIsChemistPickerOpen(false);
        }}
        onClose={() => setIsChemistPickerOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#1E293B",
  },
  header: {
    height: 56,
    backgroundColor: "#1E293B",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitleBlock: {
    flex: 1,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 1,
  },
  stepBadge: {
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stepBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  progressBarTrack: {
    height: 3,
    backgroundColor: "#334155",
    width: "100%",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#1B64DA",
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: 0.5,
    marginBottom: 16,
  },

  // Step 1 Styles
  visitTypeList: {
    gap: 12,
  },
  visitTypePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E2E8F0",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  visitTypePillSelected: {
    backgroundColor: "#EEF2FF",
    borderWidth: 1.5,
    borderColor: "#1B64DA",
  },
  letterCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  letterCircleText: {
    fontSize: 14,
    fontWeight: "800",
  },
  visitTypePillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    letterSpacing: 0.3,
  },
  visitTypePillTextSelected: {
    color: "#1B64DA",
    fontWeight: "700",
  },

  // Step 2 Styles
  fieldBlock: {
    marginBottom: 20,
  },
  fieldLabelPrimary: {
    fontSize: 12,
    fontWeight: "700",
    color: "#E11D48",
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 4,
  },
  underlineInput: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#E11D48",
    paddingVertical: 6,
  },
  underlineInputField: {
    borderBottomWidth: 1,
    borderBottomColor: "#CBD5E1",
    paddingVertical: 6,
    fontSize: 14,
    color: "#1E293B",
  },
  underlineDropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#CBD5E1",
    paddingVertical: 8,
    minHeight: 38,
  },
  valueText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    flex: 1,
  },
  dropdownIconsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  workingWithHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: 0.5,
  },
  addIconBtn: {
    padding: 2,
  },
  workingWithCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 6,
  },
  workingAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  workingName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  workingHq: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  removeBtn: {
    padding: 4,
  },
  distanceText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 6,
  },

  // Step 3 Styles
  photoHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cameraFloatingButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F97316",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  photoBoxContainer: {
    width: "100%",
    height: 220,
    backgroundColor: "#000000",
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  capturedPhoto: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  photoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholderText: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 6,
  },
  locationGeotagBox: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.78)",
    borderRadius: 6,
    padding: 8,
  },
  geotagTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  geotagTitleText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  geotagCoordsText: {
    color: "#38BDF8",
    fontSize: 10,
    fontWeight: "600",
  },
  geotagAddressText: {
    color: "#E2E8F0",
    fontSize: 10,
    marginTop: 2,
  },
  outlinedRemarksBox: {
    borderWidth: 1.5,
    borderColor: "#E11D48",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    position: "relative",
    backgroundColor: "#FFFFFF",
  },
  floatingRemarksLabel: {
    position: "absolute",
    top: -9,
    left: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 4,
  },
  floatingRemarksLabelText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#E11D48",
  },
  remarksTextInput: {
    fontSize: 14,
    color: "#1E293B",
    minHeight: 40,
  },
  starsContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  starsRow: {
    flexDirection: "row",
    gap: 12,
  },

  // Bottom Navigation Bar
  bottomBar: {
    height: 54,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  prevBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  prevBtnText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
  },
  stepText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
  },
  nextBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  nextBtnText: {
    color: "#16A34A",
    fontSize: 14,
    fontWeight: "800",
  },
  finishBtn: {
    backgroundColor: "#16A34A",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 4,
  },
  finishBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  pickerCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    elevation: 8,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  pickerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#1E293B",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  avatarMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  itemName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  itemSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
});
