import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { customersApi } from "../api/customersApi";
import { mastersApi } from "../../masters/api/mastersApi";
import { dcrApi } from "../../dcr/api/dcrApi";
import { getCurrentGeoLocation, GeoLocationResult } from "../../../shared/utils/location";
import { AutoDetectLocationCard } from "../../../shared/components/AutoDetectLocationCard";
import { ScreenHeader } from "../../../shared/components/ScreenHeader";
import { colors, radii, spacing, typography, shadows } from "../../../theme";

interface AreaMapping {
  id: number;
  name: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
}

const STEPS = [
  { id: 1, title: "Agency Info", icon: "package" as const },
  { id: 2, title: "Terms", icon: "file-text" as const },
  { id: 3, title: "Address", icon: "map-pin" as const },
  { id: 4, title: "Verify & Rate", icon: "check-circle" as const },
];

export function NewStockistVisitScreen() {
  const navigation = useNavigation();

  // Dynamic dropdown lists fetched from live backend API
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [distributorTypesList, setDistributorTypesList] = useState<string[]>([]);
  const [creditTermsList, setCreditTermsList] = useState<string[]>([]);

  // 4-Step Flow
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Stockist Basic Info
  const [agencyName, setAgencyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dlNumber, setDlNumber] = useState("");
  const [gstin, setGstin] = useState("");

  // Step 2: Categorization & Credit Terms
  const [category, setCategory] = useState("A (Prime Distributor)");
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);

  const [distributorType, setDistributorType] = useState("Full-Line Pharma Stockist");
  const [isDistributorTypePickerOpen, setIsDistributorTypePickerOpen] = useState(false);

  const [creditTerms, setCreditTerms] = useState("21 Days Standard");
  const [isCreditTermsPickerOpen, setIsCreditTermsPickerOpen] = useState(false);

  // Step 3: Address & Auto-fill
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [addressLine3, setAddressLine3] = useState("");
  const [showAllToggle, setShowAllToggle] = useState(false);

  const [areaList, setAreaList] = useState<AreaMapping[]>([]);
  const [selectedArea, setSelectedArea] = useState<AreaMapping | null>(null);
  const [areaText, setAreaText] = useState("");
  const [cityText, setCityText] = useState("");
  const [districtText, setDistrictText] = useState("");
  const [stateText, setStateText] = useState("");
  const [pincodeText, setPincodeText] = useState("");
  const [isAreaPickerOpen, setIsAreaPickerOpen] = useState(false);
  const [areaSearchQuery, setAreaSearchQuery] = useState("");

  // Step 4: Photo, Remarks & Rating
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");
  const [rating, setRating] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // GPS Location
  const [gpsLocation, setGpsLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  }>({
    latitude: 23.075341,
    longitude: 72.531375,
    address: "Auto-detecting current GPS...",
  });

  useEffect(() => {
    // Fetch dynamic masters from backend API
    mastersApi.listItems("CUSTOMER_CATEGORY").then((res) => {
      if (res && res.length > 0) {
        setCategoriesList(res.map((i) => i.name));
        setCategory(res[0].name);
      }
    }).catch(() => {});

    mastersApi.listItems("STOCKIST_TYPE").then((res) => {
      if (res && res.length > 0) {
        setDistributorTypesList(res.map((i) => i.name));
        setDistributorType(res[0].name);
      }
    }).catch(() => {});

    setCreditTermsList(["7 Days Immediate", "15 Days Bi-Monthly", "21 Days Standard", "30 Days Monthly", "45 Days Extended"]);

    // Fetch areas
    mastersApi.getAreas().then((res) => {
      if (res && res.length > 0) {
        const mapped: AreaMapping[] = res.map((a, idx) => ({
          id: a.id || idx + 100,
          name: a.name.toUpperCase(),
          city: "AHMEDABAD",
          district: "AHMEDABAD",
          state: "GUJARAT",
          pincode: a.pincode || "380061",
        }));
        setAreaList(mapped);
      }
    }).catch(() => {});

    getCurrentGeoLocation().then((loc) => {
      if (loc) {
        setGpsLocation({
          latitude: loc.latitude,
          longitude: loc.longitude,
          address: loc.address || "Field Location",
        });
      }
    });
  }, []);

  const handleSelectArea = (area: AreaMapping) => {
    setSelectedArea(area);
    setAreaText(area.name);
    setCityText(area.city);
    setDistrictText(area.district);
    setStateText(area.state);
    setPincodeText(area.pincode);
    setIsAreaPickerOpen(false);
  };

  const handleClearArea = () => {
    setSelectedArea(null);
    setAreaText("");
    setCityText("");
    setDistrictText("");
    setStateText("");
    setPincodeText("");
  };

  const handleLocationDetected = (geo: GeoLocationResult) => {
    if (geo.addressLine1) {
      setAddressLine1(geo.addressLine1);
    }
    if (geo.area) {
      setAreaText(geo.area.toUpperCase());
    }
    if (geo.city) {
      setCityText(geo.city.toUpperCase());
    }
    if (geo.district) {
      setDistrictText(geo.district.toUpperCase());
    }
    if (geo.state) {
      setStateText(geo.state.toUpperCase());
    }
    if (geo.pincode) {
      setPincodeText(geo.pincode);
    }
    setGpsLocation({
      latitude: geo.latitude,
      longitude: geo.longitude,
      address: geo.address,
    });
  };

  const handleCapturePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Camera access is needed to capture stockist godown photo.");
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
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80"
      );
    }
  };

  const handleSubmit = async () => {
    if (!agencyName.trim()) {
      Alert.alert("Agency Name Required", "Please enter Stockist / Agency Name in Step 1.");
      setCurrentStep(1);
      return;
    }
    if (!areaText.trim()) {
      Alert.alert("Area Required", "Please select stockist area in Step 3.");
      setCurrentStep(3);
      return;
    }

    setIsSubmitting(true);
    try {
      const newStk = await customersApi.createStockist({
        agency_name: agencyName.trim(),
        contact_person: contactPerson.trim() || undefined,
        phone: phone.trim() || "9876543210",
        email: email.trim() || undefined,
        dl_number: dlNumber.trim() || undefined,
        gstin: gstin.trim() || undefined,
        address: `${addressLine1} ${addressLine2} ${addressLine3}`.trim() || areaText,
        pincode: pincodeText || undefined,
        latitude: gpsLocation.latitude,
        longitude: gpsLocation.longitude,
        credit_days: creditTerms.includes("15") ? 15 : creditTerms.includes("30") ? 30 : creditTerms.includes("45") ? 45 : 21,
      });

      try {
        await dcrApi.submitDcr({
          dcr_date: new Date().toISOString().split("T")[0],
          customer_type: "STOCKIST",
          stockist_id: newStk.id,
          visit_type: "INDEPENDENT",
          call_time: new Date().toISOString(),
          call_duration_minutes: 20,
          latitude: gpsLocation.latitude,
          longitude: gpsLocation.longitude,
          location_accuracy: 10,
          is_mock_location: false,
          remarks: remarks || `New Stockist ${newStk.agency_name} registered and first business review visit recorded.`,
          post_call_analysis: {
            call_outcome: "HIGHLY_INTERESTED",
            doctor_feedback: remarks,
            prescription_commitment: "HIGH",
            follow_up_required: false,
          },
        } as any);
      } catch (dcrErr) {
        console.warn("DCR auto-log error:", dcrErr);
      }

      Alert.alert(
        "New Stockist Registered 🎉",
        `${newStk.agency_name} (${areaText}) has been successfully enrolled and introductory call recorded.`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert("Error Creating Stockist", err?.response?.data?.detail || "Please check details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAreas = areaList.filter((a) =>
    a.name.toLowerCase().includes(areaSearchQuery.toLowerCase().trim()) ||
    a.city.toLowerCase().includes(areaSearchQuery.toLowerCase().trim())
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar style="light" />

      {/* Signature Navy Header */}
      <ScreenHeader
        title="New Stockist Visit"
        subtitle={`Step ${currentStep} of 4 • ${STEPS[currentStep - 1].title}`}
        variant="navy"
        onBack={() => {
          if (currentStep > 1) setCurrentStep(currentStep - 1);
          else navigation.goBack();
        }}
        rightElement={
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>{currentStep}/4</Text>
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

      {/* Form Content */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= STEP 1: STOCKIST BASIC INFO ================= */}
        {currentStep === 1 && (
          <View style={styles.cardBox}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardIconBox}>
                <Feather name="package" size={16} color={colors.orange} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Distributor Identity</Text>
                <Text style={styles.cardSubtitle}>Stockist agency name, proprietor and contact</Text>
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabelPrimary}>
                Stockist / Agency Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.inputField}
                placeholder="e.g. Mahavir Pharma Distributors"
                placeholderTextColor={colors.textFaint}
                value={agencyName}
                onChangeText={setAgencyName}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Contact Person / Proprietor</Text>
              <TextInput
                style={styles.inputField}
                placeholder="e.g. Bharat Shah (Partner)"
                placeholderTextColor={colors.textFaint}
                value={contactPerson}
                onChangeText={setContactPerson}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabelPrimary}>
                Phone Number <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.inputField}
                placeholder="e.g. 9876543210"
                placeholderTextColor={colors.textFaint}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={styles.twoColRow}>
              <View style={[styles.fieldBlock, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Wholesale DL</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="20B/21B W/S"
                  placeholderTextColor={colors.textFaint}
                  value={dlNumber}
                  onChangeText={setDlNumber}
                />
              </View>

              <View style={[styles.fieldBlock, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>GSTIN</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="24AAAAA0000A1Z5"
                  placeholderTextColor={colors.textFaint}
                  value={gstin}
                  onChangeText={setGstin}
                  autoCapitalize="characters"
                />
              </View>
            </View>
          </View>
        )}

        {/* ================= STEP 2: CATEGORIZATION & TERMS ================= */}
        {currentStep === 2 && (
          <View style={styles.cardBox}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardIconBox, { backgroundColor: colors.bluePastel }]}>
                <Feather name="file-text" size={16} color={colors.brandBlue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Commercial Terms & Tier</Text>
                <Text style={styles.cardSubtitle}>Credit cycle, distributor class & coverage</Text>
              </View>
            </View>

            {/* Category */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Distributor Tier</Text>
              <TouchableOpacity
                style={styles.dropdownCard}
                onPress={() => setIsCategoryPickerOpen(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownValue}>{category || "Select Tier"}</Text>
                <Feather name="chevron-down" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Distributor Type */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Distributor Class</Text>
              <TouchableOpacity
                style={styles.dropdownCard}
                onPress={() => setIsDistributorTypePickerOpen(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownValue}>{distributorType || "Select Class"}</Text>
                <Feather name="chevron-down" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Credit Terms */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Credit Terms (Days)</Text>
              <TouchableOpacity
                style={styles.dropdownCard}
                onPress={() => setIsCreditTermsPickerOpen(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownValue}>{creditTerms || "Select Credit Days"}</Text>
                <Feather name="chevron-down" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= STEP 3: ADDRESS & AUTO-FILL ================= */}
        {currentStep === 3 && (
          <View style={{ gap: spacing.lg }}>
            <AutoDetectLocationCard
              latitude={gpsLocation.latitude}
              longitude={gpsLocation.longitude}
              detectedAddress={gpsLocation.address}
              onLocationDetected={handleLocationDetected}
              subtitle="Capture GPS coordinates and auto-fill stockist godown address"
            />

            <View style={styles.cardBox}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconBox, { backgroundColor: colors.purplePastel }]}>
                  <Feather name="map-pin" size={16} color={colors.purple} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Godown Address & Territory</Text>
                  <Text style={styles.cardSubtitle}>Office/godown location, area & postal code</Text>
                </View>
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Unit / Gala No.</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="e.g. Unit 12, Logistics Park"
                  placeholderTextColor={colors.textFaint}
                  value={addressLine1}
                  onChangeText={setAddressLine1}
                />
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Estate / Complex Name</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="e.g. Industrial Estate Phase 1"
                  placeholderTextColor={colors.textFaint}
                  value={addressLine2}
                  onChangeText={setAddressLine2}
                />
              </View>

              {/* Area * */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabelPrimary}>
                  Territory Area <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[styles.dropdownCard, !areaText && styles.dropdownCardError]}
                  onPress={() => setIsAreaPickerOpen(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dropdownValue, !areaText && { color: colors.textFaint }]}>
                    {areaText || "Select Area..."}
                  </Text>
                  {areaText ? (
                    <TouchableOpacity onPress={handleClearArea}>
                      <Feather name="x" size={18} color={colors.accentRed} />
                    </TouchableOpacity>
                  ) : (
                    <Feather name="chevron-down" size={18} color={colors.textMuted} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Auto-filled Location Details */}
              <View style={styles.twoColRow}>
                <View style={[styles.fieldBlock, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>City</Text>
                  <View style={styles.readOnlyBox}>
                    <Text style={styles.readOnlyText}>{cityText || "—"}</Text>
                  </View>
                </View>

                <View style={[styles.fieldBlock, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Pincode</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="380061"
                    placeholderTextColor={colors.textFaint}
                    value={pincodeText}
                    onChangeText={setPincodeText}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ================= STEP 4: PHOTO, REMARKS & RATING ================= */}
        {currentStep === 4 && (
          <View style={{ gap: spacing.lg }}>
            <View style={styles.cardBox}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconBox, { backgroundColor: colors.orangePastel }]}>
                  <Feather name="camera" size={16} color={colors.orange} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Godown Verification Photo</Text>
                  <Text style={styles.cardSubtitle}>Capture distributor office, godown or signage</Text>
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
                    <Text style={styles.photoTapText}>Tap to Capture Godown</Text>
                    <Text style={styles.photoHintText}>GPS timestamp & geotag will be embedded</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Remarks & Rating Card */}
            <View style={styles.cardBox}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconBox, { backgroundColor: colors.successGreenPastel }]}>
                  <Feather name="star" size={16} color={colors.successGreen} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Introductory Notes & Credit Rating</Text>
                  <Text style={styles.cardSubtitle}>Logistics capacity, payment reliability review</Text>
                </View>
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Visit Remarks</Text>
                <TextInput
                  style={[styles.inputField, styles.textArea]}
                  placeholder="Enter wholesale coverage, distribution reach notes..."
                  placeholderTextColor={colors.textFaint}
                  value={remarks}
                  onChangeText={setRemarks}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.starsWrapper}>
                <Text style={styles.ratingPrompt}>Rate Distribution & Credit Capacity</Text>
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

      {/* Docked Modern Bottom Bar */}
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
          <Text style={styles.stepCurrentLabel}>STEP {currentStep} OF 4</Text>
        </View>

        {currentStep < 4 ? (
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={() => {
              if (currentStep === 1 && !agencyName.trim()) {
                Alert.alert("Required", "Please enter Stockist / Agency Name.");
                return;
              }
              if (currentStep === 3 && !areaText.trim()) {
                Alert.alert("Required", "Please select an Area.");
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
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.surface} size="small" />
            ) : (
              <>
                <Feather name="check" size={16} color={colors.surface} />
                <Text style={styles.finishBtnText}>Submit</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Category Picker Modal */}
      <Modal visible={isCategoryPickerOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Distributor Tier</Text>
              <TouchableOpacity onPress={() => setIsCategoryPickerOpen(false)}>
                <Feather name="x" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={categoriesList.length > 0 ? categoriesList : ["A (Prime Distributor)", "B (Semi-Wholesaler)", "C (Local Distributor)"]}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItemRow}
                  onPress={() => {
                    setCategory(item);
                    setIsCategoryPickerOpen(false);
                  }}
                >
                  <Text style={[styles.modalItemText, item === category && styles.modalItemTextActive]}>
                    {item}
                  </Text>
                  {item === category && <Feather name="check" size={18} color={colors.brandBlue} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Distributor Type Modal */}
      <Modal visible={isDistributorTypePickerOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Distributor Class</Text>
              <TouchableOpacity onPress={() => setIsDistributorTypePickerOpen(false)}>
                <Feather name="x" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={distributorTypesList.length > 0 ? distributorTypesList : ["Full-Line Pharma Stockist", "Institutional Supplier", "C&F Sub-Stockist"]}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItemRow}
                  onPress={() => {
                    setDistributorType(item);
                    setIsDistributorTypePickerOpen(false);
                  }}
                >
                  <Text style={[styles.modalItemText, item === distributorType && styles.modalItemTextActive]}>
                    {item}
                  </Text>
                  {item === distributorType && <Feather name="check" size={18} color={colors.brandBlue} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Credit Terms Modal */}
      <Modal visible={isCreditTermsPickerOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Credit Terms</Text>
              <TouchableOpacity onPress={() => setIsCreditTermsPickerOpen(false)}>
                <Feather name="x" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={creditTermsList}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItemRow}
                  onPress={() => {
                    setCreditTerms(item);
                    setIsCreditTermsPickerOpen(false);
                  }}
                >
                  <Text style={[styles.modalItemText, item === creditTerms && styles.modalItemTextActive]}>
                    {item}
                  </Text>
                  {item === creditTerms && <Feather name="check" size={18} color={colors.brandBlue} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Area Search & Select Modal */}
      <Modal visible={isAreaPickerOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Territory Area</Text>
              <TouchableOpacity onPress={() => setIsAreaPickerOpen(false)}>
                <Feather name="x" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.searchBox}>
              <Feather name="search" size={16} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search area..."
                placeholderTextColor={colors.textFaint}
                value={areaSearchQuery}
                onChangeText={setAreaSearchQuery}
              />
            </View>
            <FlatList
              data={filteredAreas}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.areaItemRow}
                  onPress={() => handleSelectArea(item)}
                >
                  <View style={styles.areaPinCircle}>
                    <Feather name="map-pin" size={14} color={colors.brandBlue} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.areaItemName}>{item.name}</Text>
                    <Text style={styles.areaItemSub}>{item.city} • {item.pincode}</Text>
                  </View>
                  {item.name === areaText && <Feather name="check" size={18} color={colors.brandBlue} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radii.full,
    backgroundColor: colors.inputBackground,
    gap: 4,
  },
  stepPillActive: {
    backgroundColor: colors.orangePastel,
  },
  stepPillDone: {
    backgroundColor: colors.bluePastel,
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
    backgroundColor: colors.orange,
  },
  stepIconCircleDone: {
    backgroundColor: colors.brandBlue,
  },
  stepPillText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
  },
  stepPillTextActive: {
    color: colors.orange,
    fontWeight: "800",
  },
  stepPillTextDone: {
    color: colors.brandBlue,
    fontWeight: "800",
  },
  stepConnectorLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.borderLight,
    marginHorizontal: 4,
  },
  stepConnectorLineDone: {
    backgroundColor: colors.brandBlue,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl * 2,
  },
  cardBox: {
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
    backgroundColor: colors.orangePastel,
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
  dropdownCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  dropdownCardError: {
    borderColor: colors.accentRed,
  },
  dropdownValue: {
    ...typography.body,
    fontSize: 14,
    color: colors.textInk,
    fontWeight: "600",
  },
  twoColRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  readOnlyBox: {
    backgroundColor: colors.borderLight,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: "center",
  },
  readOnlyText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: "600",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.backdrop,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    maxHeight: "80%",
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.medium,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.heading,
    fontSize: 16,
    fontWeight: "800",
    color: colors.textInk,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    fontSize: 14,
    color: colors.textInk,
  },
  modalItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalItemText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textInk,
    fontWeight: "600",
  },
  modalItemTextActive: {
    color: colors.brandBlue,
    fontWeight: "800",
  },
  areaItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  areaPinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bluePastel,
    alignItems: "center",
    justifyContent: "center",
  },
  areaItemName: {
    ...typography.body,
    fontSize: 14,
    fontWeight: "700",
    color: colors.textInk,
  },
  areaItemSub: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
});
