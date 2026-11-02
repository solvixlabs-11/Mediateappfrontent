import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { customersApi } from "../api/customersApi";
import { mastersApi } from "../../masters/api/mastersApi";
import { dcrApi } from "../../dcr/api/dcrApi";
import { getCurrentGeoLocation } from "../../../shared/utils/location";

interface AreaMapping {
  id: number;
  name: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
}

const DEFAULT_AREAS: AreaMapping[] = [
  { id: 1, name: "GHATLODIYA", city: "AHMEDABAD", district: "AHMEDABAD", state: "GUJARAT", pincode: "380061" },
  { id: 2, name: "CHANAKYAPURI", city: "AHMEDABAD", district: "AHMEDABAD", state: "GUJARAT", pincode: "380061" },
  { id: 3, name: "NAVRANGPURA", city: "AHMEDABAD", district: "AHMEDABAD", state: "GUJARAT", pincode: "380009" },
  { id: 4, name: "BAPUNAGAR", city: "AHMEDABAD", district: "AHMEDABAD", state: "GUJARAT", pincode: "380024" },
  { id: 5, name: "MANINAGAR", city: "AHMEDABAD", district: "AHMEDABAD", state: "GUJARAT", pincode: "380008" },
  { id: 6, name: "BHUJ CENTRAL", city: "BHUJ", district: "KUTCH", state: "GUJARAT", pincode: "370001" },
  { id: 7, name: "STATION ROAD", city: "BHUJ", district: "KUTCH", state: "GUJARAT", pincode: "370001" },
  { id: 8, name: "KOTHRUD", city: "PUNE", district: "PUNE", state: "MAHARASHTRA", pincode: "411038" },
  { id: 9, name: "CAMP ROAD", city: "PUNE", district: "PUNE", state: "MAHARASHTRA", pincode: "411001" },
  { id: 10, name: "ANDHERI WEST", city: "MUMBAI", district: "MUMBAI SUBURBAN", state: "MAHARASHTRA", pincode: "400058" },
  { id: 11, name: "BORIVALI EAST", city: "MUMBAI", district: "MUMBAI SUBURBAN", state: "MAHARASHTRA", pincode: "400066" },
  { id: 12, name: "CONNAUGHT PLACE", city: "DELHI", district: "NEW DELHI", state: "DELHI", pincode: "110001" },
];

const CATEGORIES = ["A (PRIME DISTRIBUTOR)", "B (REGULAR STOCKIST)", "C (SUB-STOCKIST)", "SUPER STOCKIST", "C&F AGENT"];
const DISTRIBUTOR_TYPES = ["Full-Line Pharma Stockist", "Exclusive Franchise", "Semi-Wholesale Depot", "Hospital Supply Distributor", "Generic Medicine Stockist"];
const CREDIT_TERMS = ["15 Days Credit", "21 Days Standard", "30 Days Credit", "45 Days Extended", "PDC / Advance Only"];

export function NewStockistVisitScreen() {
  const navigation = useNavigation();

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
  const [category, setCategory] = useState("A (PRIME DISTRIBUTOR)");
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

  const [areaList, setAreaList] = useState<AreaMapping[]>(DEFAULT_AREAS);
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
    address: "793 Chanakyapuri Ahmedabad Gujarat India 380061",
  });

  useEffect(() => {
    mastersApi
      .getAreas()
      .then((res) => {
        if (res && res.length > 0) {
          const mapped: AreaMapping[] = res.map((a, idx) => ({
            id: a.id || idx + 100,
            name: a.name.toUpperCase(),
            city: "AHMEDABAD",
            district: "AHMEDABAD",
            state: "GUJARAT",
            pincode: a.pincode || "380061",
          }));
          setAreaList([...DEFAULT_AREAS, ...mapped]);
        }
      })
      .catch(() => {});

    getCurrentGeoLocation().then((loc) => {
      if (loc) {
        setGpsLocation({
          latitude: loc.latitude,
          longitude: loc.longitude,
          address: loc.address || "Field Location, Ahmedabad",
        });
      }
    });
  }, []);

  // Automatic Location Auto-Fill on Area Selection
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

  // Photo Capture
  const handleCapturePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Camera access is needed to capture stockist office photo.");
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
        "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=600&auto=format&fit=crop&q=80"
      );
    }
  };

  // Submit New Stockist & First Visit
  const handleSubmit = async () => {
    if (!agencyName.trim()) {
      Alert.alert("Agency Name Required", "Please enter Stockist / Agency Name in Step 1.");
      setCurrentStep(1);
      return;
    }
    if (!areaText.trim()) {
      Alert.alert("Area Required", "Please select stockist location area in Step 3.");
      setCurrentStep(3);
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create Stockist Entity
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

      // 2. Log Initial DCR Visit
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
          post_call: {
            doctor_feedback: remarks,
            rating: rating || 5,
            outcome: "HIGHLY_INTERESTED",
            commitment_level: "HIGH",
            next_action_days: 7,
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
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <RNStatusBar barStyle="light-content" backgroundColor="#1E293B" />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (currentStep > 1) setCurrentStep(currentStep - 1);
            else navigation.goBack();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerTitle}>New Stockist Visit</Text>
          <Text style={styles.headerSubtitle}>
            Step {currentStep} of 4 •{" "}
            {currentStep === 1
              ? "Basic Info"
              : currentStep === 2
              ? "Distributor Details"
              : currentStep === 3
              ? "Address Details"
              : "Photo & Rating"}
          </Text>
        </View>

        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>{currentStep}/4</Text>
        </View>
      </View>

      {/* Progress Track */}
      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${(currentStep / 4) * 100}%` }]} />
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
            <Text style={styles.sectionHeaderTitle}>STOCKIST BASIC INFORMATION</Text>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabelPrimary}>Stockist / Agency Name *</Text>
              <TextInput
                style={styles.underlineInput}
                placeholder="e.g. Mahavir Pharma Distributors Pvt Ltd"
                placeholderTextColor="#94A3B8"
                value={agencyName}
                onChangeText={setAgencyName}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Contact Person / Proprietor Name</Text>
              <TextInput
                style={styles.underlineInput}
                placeholder="e.g. Haresh Shah"
                placeholderTextColor="#94A3B8"
                value={contactPerson}
                onChangeText={setContactPerson}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabelPrimary}>Mobile / Phone Number *</Text>
              <TextInput
                style={styles.underlineInput}
                placeholder="e.g. 9876543210"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <TextInput
                style={styles.underlineInput}
                placeholder="e.g. agency@pharmaagency.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Drug License (DL) Number</Text>
              <TextInput
                style={styles.underlineInput}
                placeholder="e.g. DL-20B-998811"
                placeholderTextColor="#94A3B8"
                value={dlNumber}
                onChangeText={setDlNumber}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>GSTIN Number</Text>
              <TextInput
                style={styles.underlineInput}
                placeholder="e.g. 24AABCM8899K1Z4"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                value={gstin}
                onChangeText={setGstin}
              />
            </View>
          </View>
        )}

        {/* ================= STEP 2: DISTRIBUTOR CATEGORIZATION & TERMS ================= */}
        {currentStep === 2 && (
          <View>
            <Text style={styles.sectionHeaderTitle}>DISTRIBUTOR DETAILS & CREDIT TERMS</Text>

            <View style={styles.cardBox}>
              {/* Category */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Stockist Category</Text>
                <TouchableOpacity
                  style={styles.underlineDropdown}
                  onPress={() => setIsCategoryPickerOpen(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.valueText}>{category}</Text>
                  <View style={styles.iconsRow}>
                    {category ? (
                      <TouchableOpacity onPress={() => setCategory("")}>
                        <Ionicons name="close" size={18} color="#64748B" />
                      </TouchableOpacity>
                    ) : null}
                    <Ionicons name="chevron-down" size={18} color="#64748B" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Distributorship Type */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Distributorship Type</Text>
                <TouchableOpacity
                  style={styles.underlineDropdown}
                  onPress={() => setIsDistributorTypePickerOpen(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.valueText}>{distributorType}</Text>
                  <View style={styles.iconsRow}>
                    {distributorType ? (
                      <TouchableOpacity onPress={() => setDistributorType("")}>
                        <Ionicons name="close" size={18} color="#64748B" />
                      </TouchableOpacity>
                    ) : null}
                    <Ionicons name="chevron-down" size={18} color="#64748B" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Credit Terms */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Standard Credit Terms</Text>
                <TouchableOpacity
                  style={styles.underlineDropdown}
                  onPress={() => setIsCreditTermsPickerOpen(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.valueText}>{creditTerms}</Text>
                  <View style={styles.iconsRow}>
                    {creditTerms ? (
                      <TouchableOpacity onPress={() => setCreditTerms("")}>
                        <Ionicons name="close" size={18} color="#64748B" />
                      </TouchableOpacity>
                    ) : null}
                    <Ionicons name="chevron-down" size={18} color="#64748B" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ================= STEP 3: ADDRESS DETAILS & AUTO-FILL ================= */}
        {currentStep === 3 && (
          <View>
            <Text style={styles.sectionHeaderTitle}>ADDRESS DETAILS</Text>

            <View style={styles.cardBox}>
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Address Line 1</Text>
                <TextInput
                  style={styles.underlineInput}
                  placeholder=""
                  value={addressLine1}
                  onChangeText={setAddressLine1}
                />
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Address Line 2</Text>
                <TextInput
                  style={styles.underlineInput}
                  placeholder=""
                  value={addressLine2}
                  onChangeText={setAddressLine2}
                />
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Address Line 3</Text>
                <TextInput
                  style={styles.underlineInput}
                  placeholder=""
                  value={addressLine3}
                  onChangeText={setAddressLine3}
                />
              </View>

              {/* SHOW ALL Switch Toggle */}
              <View style={styles.toggleRow}>
                <View>
                  <Text style={styles.toggleTitle}>SHOW ALL</Text>
                  <Text style={styles.toggleSubtitle}>Areas, Cities, District</Text>
                </View>
                <Switch
                  value={showAllToggle}
                  onValueChange={setShowAllToggle}
                  trackColor={{ false: "#CBD5E1", true: "#1B64DA" }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Area * (With Auto-Fill Trigger) */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabelPrimary}>Area*</Text>
                <TouchableOpacity
                  style={[styles.underlineDropdown, { borderBottomColor: areaText ? "#E11D48" : "#CBD5E1" }]}
                  onPress={() => setIsAreaPickerOpen(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.valueText, !areaText && { color: "#94A3B8" }]}>
                    {areaText || "Select Area..."}
                  </Text>
                  {areaText ? (
                    <TouchableOpacity onPress={handleClearArea}>
                      <Ionicons name="close" size={20} color="#E11D48" />
                    </TouchableOpacity>
                  ) : (
                    <Ionicons name="chevron-down" size={18} color="#64748B" />
                  )}
                </TouchableOpacity>
                {!areaText && <Text style={styles.errorText}>Area required</Text>}
              </View>

              {/* City * (Auto-filled) */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>City*</Text>
                <View style={styles.underlineDropdown}>
                  <Text style={[styles.valueText, { color: cityText ? "#64748B" : "#94A3B8" }]}>
                    {cityText || ""}
                  </Text>
                  {cityText ? (
                    <TouchableOpacity onPress={() => setCityText("")}>
                      <Ionicons name="close" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              {/* District * (Auto-filled) */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>District*</Text>
                <View style={styles.underlineDropdown}>
                  <Text style={[styles.valueText, { color: districtText ? "#64748B" : "#94A3B8" }]}>
                    {districtText || ""}
                  </Text>
                  {districtText ? (
                    <TouchableOpacity onPress={() => setDistrictText("")}>
                      <Ionicons name="close" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              {/* State * (Auto-filled) */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>State *</Text>
                <View style={styles.underlineDropdown}>
                  <Text style={[styles.valueText, { color: stateText ? "#64748B" : "#94A3B8" }]}>
                    {stateText || ""}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#64748B" />
                </View>
              </View>

              {/* Pincode */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Pincode</Text>
                <TextInput
                  style={styles.underlineInput}
                  placeholder=""
                  value={pincodeText}
                  onChangeText={setPincodeText}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        )}

        {/* ================= STEP 4: CAPTURE PHOTO, REMARKS & RATING ================= */}
        {currentStep === 4 && (
          <View>
            {/* Capture Photo Header */}
            <View style={styles.photoHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>CAPTURE PHOTO</Text>
              <TouchableOpacity
                style={styles.cameraFloatingButton}
                onPress={handleCapturePhoto}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Photo Illustration / Preview Container */}
            <View style={styles.photoContainer}>
              {capturedPhotoUri ? (
                <Image source={{ uri: capturedPhotoUri }} style={styles.capturedPhoto} />
              ) : (
                <View style={styles.photoIllustrationWrapper}>
                  <View style={styles.photoIllustrationCircle}>
                    <MaterialCommunityIcons name="office-building-outline" size={48} color="#1B64DA" />
                  </View>
                  <Text style={styles.capturePhotoText}>Capture Stockist Office Photo</Text>
                </View>
              )}
            </View>

            {/* Remarks & Rating Section */}
            <Text style={[styles.sectionHeaderTitle, { marginTop: 24 }]}>REMARKS & RATING</Text>

            {/* Outlined Remarks Box */}
            <View style={styles.outlinedRemarksBox}>
              <TextInput
                style={styles.remarksTextInput}
                placeholder="Remarks"
                placeholderTextColor="#94A3B8"
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
                      color={star <= rating ? "#F59E0B" : "#94A3B8"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Step Bar */}
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

        <Text style={styles.stepText}>STEP {currentStep} OF 4</Text>

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
          >
            <Text style={styles.nextBtnText}>NEXT</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.finishBtn}
            onPress={handleSubmit}
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

      {/* Area Picker Modal */}
      <Modal visible={isAreaPickerOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Area (Auto-fills Location)</Text>
              <TouchableOpacity onPress={() => setIsAreaPickerOpen(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search area (e.g. Ghatlodiya, Navrangpura)..."
                value={areaSearchQuery}
                onChangeText={setAreaSearchQuery}
              />
            </View>

            <FlatList
              data={filteredAreas}
              keyExtractor={(item) => item.id.toString()}
              style={{ maxHeight: 340 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.areaItemRow}
                  onPress={() => handleSelectArea(item)}
                >
                  <View style={styles.areaPinCircle}>
                    <Ionicons name="location-sharp" size={16} color="#1B64DA" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.areaItemName}>{item.name}</Text>
                    <Text style={styles.areaItemSub}>
                      {item.city}, {item.district}, {item.state} • {item.pincode}
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward-circle" size={22} color="#1B64DA" />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Category Modal */}
      <Modal visible={isCategoryPickerOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setIsCategoryPickerOpen(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={CATEGORIES}
              keyExtractor={(it) => it}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.itemRow}
                  onPress={() => {
                    setCategory(item);
                    setIsCategoryPickerOpen(false);
                  }}
                >
                  <Text style={[styles.itemName, category === item && styles.itemNameActive]}>
                    {item}
                  </Text>
                  {category === item && (
                    <Ionicons name="checkmark-circle" size={20} color="#1B64DA" />
                  )}
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
              <Text style={styles.modalTitle}>Select Distributorship Type</Text>
              <TouchableOpacity onPress={() => setIsDistributorTypePickerOpen(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={DISTRIBUTOR_TYPES}
              keyExtractor={(it) => it}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.itemRow}
                  onPress={() => {
                    setDistributorType(item);
                    setIsDistributorTypePickerOpen(false);
                  }}
                >
                  <Text style={[styles.itemName, distributorType === item && styles.itemNameActive]}>
                    {item}
                  </Text>
                  {distributorType === item && (
                    <Ionicons name="checkmark-circle" size={20} color="#1B64DA" />
                  )}
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
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={CREDIT_TERMS}
              keyExtractor={(it) => it}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.itemRow}
                  onPress={() => {
                    setCreditTerms(item);
                    setIsCreditTermsPickerOpen(false);
                  }}
                >
                  <Text style={[styles.itemName, creditTerms === item && styles.itemNameActive]}>
                    {item}
                  </Text>
                  {creditTerms === item && (
                    <Ionicons name="checkmark-circle" size={20} color="#1B64DA" />
                  )}
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
  backBtn: {
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
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  cardBox: {
    backgroundColor: "#FFFFFF",
  },
  fieldBlock: {
    marginBottom: 20,
  },
  fieldLabelPrimary: {
    fontSize: 12,
    color: "#1E293B",
    fontWeight: "700",
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
    marginBottom: 4,
  },
  underlineInput: {
    borderBottomWidth: 1,
    borderBottomColor: "#CBD5E1",
    paddingVertical: 8,
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "600",
  },
  underlineDropdown: {
    borderBottomWidth: 1,
    borderBottomColor: "#CBD5E1",
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 38,
  },
  valueText: {
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "600",
  },
  iconsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  toggleSubtitle: {
    fontSize: 11,
    color: "#64748B",
  },
  errorText: {
    fontSize: 11,
    color: "#E11D48",
    marginTop: 4,
  },
  photoHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cameraFloatingButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1B64DA",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1B64DA",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  photoContainer: {
    width: "100%",
    height: 220,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  capturedPhoto: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  photoIllustrationWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  photoIllustrationCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  capturePhotoText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  outlinedRemarksBox: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    padding: 12,
    minHeight: 90,
  },
  remarksTextInput: {
    fontSize: 13,
    color: "#1E293B",
    textAlignVertical: "top",
    minHeight: 60,
  },
  starsContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bottomBar: {
    height: 60,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  stepText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  prevBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#F1F5F9",
  },
  prevBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  nextBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#1B64DA",
  },
  nextBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  finishBtn: {
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#16A34A",
    minWidth: 80,
    alignItems: "center",
  },
  finishBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#1E293B",
  },
  areaItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  areaPinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  areaItemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  areaItemSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  itemName: {
    fontSize: 14,
    color: "#334155",
  },
  itemNameActive: {
    color: "#1B64DA",
    fontWeight: "700",
  },
});
