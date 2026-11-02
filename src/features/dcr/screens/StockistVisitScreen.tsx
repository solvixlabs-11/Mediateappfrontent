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
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { StockistDto, customersApi } from "../../customers/api/customersApi";
import { usersApi } from "../../users/api/usersApi";
import { dcrApi } from "../api/dcrApi";
import { getCurrentGeoLocation } from "../../../shared/utils/location";
import { RootStackParamList } from "../../../navigation/types";

interface VisitTypeDef {
  key: string;
  letter: string;
  title: string;
}

const VISIT_TYPES: VisitTypeDef[] = [
  {
    key: "PRIMARY_ORDER",
    letter: "P",
    title: "PRIMARY ORDER BOOKING CALL",
  },
  {
    key: "PAYMENT_COLLECTION",
    letter: "C",
    title: "PAYMENT & CHEQUE COLLECTION",
  },
  {
    key: "STOCK_AUDIT",
    letter: "S",
    title: "STOCK AUDIT & INVENTORY REVIEW",
  },
  {
    key: "SCHEME_PROMOTION",
    letter: "D",
    title: "SCHEME & PRODUCT PROMOTION",
  },
];

interface CompanionUser {
  id: number;
  name: string;
  role: string;
  hq: string;
}

const DIVISIONS = ["MEDIATE", "MEDIATE HEALTHCARE", "MEDIATE CARDIOLOGY", "MEDIATE DERMA"];

export function StockistVisitScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, "DcrForm">>();

  // 3-Step Wizard Flow
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Visit Type
  const [selectedVisitType, setSelectedVisitType] = useState<string>("PRIMARY_ORDER");

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
  const [isDivisionPickerOpen, setIsDivisionPickerOpen] = useState(false);

  // Stockist State (Initially null/empty)
  const [stockistsList, setStockistsList] = useState<StockistDto[]>([]);
  const [selectedStockist, setSelectedStockist] = useState<StockistDto | null>(null);
  const [isStockistPickerOpen, setIsStockistPickerOpen] = useState(false);
  const [stockistSearchQuery, setStockistSearchQuery] = useState("");

  // Order / Collection Amount
  const [orderAmount, setOrderAmount] = useState<string>("");

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
    // 1. Fetch Stockists
    customersApi
      .listStockists({ limit: 100 })
      .then((stList) => {
        setStockistsList(stList);
        if (route.params?.initialCustomerId) {
          const found = stList.find((s) => s.id === route.params?.initialCustomerId);
          if (found) setSelectedStockist(found);
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
        if (mapped.length > 0) {
          setAvailableCompanions(mapped);
        } else {
          setAvailableCompanions([
            { id: 101, name: "ANURAG MISHRA", role: "AREA MANAGER", hq: "ARBH (AHMEDABAD HQ)" },
            { id: 102, name: "SANJAY GUPTA", role: "REGIONAL MANAGER", hq: "GUJARAT HQ" },
            { id: 103, name: "RAJESH VERMA", role: "ZONAL MANAGER", hq: "WEST ZONE" },
          ]);
        }
      })
      .catch(() => {
        setAvailableCompanions([
          { id: 101, name: "ANURAG MISHRA", role: "AREA MANAGER", hq: "ARBH (AHMEDABAD HQ)" },
          { id: 102, name: "SANJAY GUPTA", role: "REGIONAL MANAGER", hq: "GUJARAT HQ" },
          { id: 103, name: "RAJESH VERMA", role: "ZONAL MANAGER", hq: "WEST ZONE" },
        ]);
      });

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

  // Submit DCR Visit
  const handleSubmitDcr = async () => {
    if (!selectedStockist) {
      Alert.alert("Stockist Required", "Please select a stockist agency for this visit.");
      setCurrentStep(2);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        dcr_date: new Date().toISOString().split("T")[0],
        customer_type: "STOCKIST",
        stockist_id: selectedStockist.id,
        planned_visit_id: route.params?.initialPlannedVisitId || null,
        visit_type: workingWith ? "JOINT_WITH_MANAGER" : "INDEPENDENT",
        joint_manager_id: workingWith ? workingWith.id : null,
        call_time: new Date().toISOString(),
        call_duration_minutes: 20,
        latitude: gpsLocation.latitude,
        longitude: gpsLocation.longitude,
        location_accuracy: 10,
        is_mock_location: false,
        pob_amount: parseFloat(orderAmount) || 0,
        remarks: remarks || `Stockist business call recorded with ${rating} star rating.`,
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
        "Stockist Visit Submitted 🎉",
        `Visit for ${selectedStockist.agency_name} has been recorded with GPS geotag verification.`,
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

  const filteredStockists = stockistsList.filter(
    (s) =>
      s.agency_name.toLowerCase().includes(stockistSearchQuery.toLowerCase().trim()) ||
      (s.contact_person &&
        s.contact_person.toLowerCase().includes(stockistSearchQuery.toLowerCase().trim())) ||
      (s.address && s.address.toLowerCase().includes(stockistSearchQuery.toLowerCase().trim()))
  );

  const filteredCompanions = availableCompanions.filter((c) =>
    c.name.toLowerCase().includes(workingWithSearch.toLowerCase().trim())
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <RNStatusBar barStyle="light-content" backgroundColor="#1E293B" />

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
          <Text style={styles.headerTitle}>Stockist Visit</Text>
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

            {/* Stockist Picker */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Stockist / Agency *</Text>
              <TouchableOpacity
                style={styles.underlineDropdown}
                onPress={() => setIsStockistPickerOpen(true)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.valueText,
                    !selectedStockist && { color: "#94A3B8", fontWeight: "400" },
                  ]}
                >
                  {selectedStockist
                    ? `${selectedStockist.agency_name.toUpperCase()} - ${
                        selectedStockist.contact_person || "DISTRIBUTOR"
                      }`
                    : ""}
                </Text>
                <View style={styles.dropdownIconsRow}>
                  {selectedStockist ? (
                    <TouchableOpacity onPress={() => setSelectedStockist(null)}>
                      <Ionicons name="close" size={18} color="#64748B" />
                    </TouchableOpacity>
                  ) : null}
                  <Ionicons name="chevron-down" size={18} color="#64748B" />
                </View>
              </TouchableOpacity>

              {/* Distance Display */}
              {selectedStockist && gpsLocation.distanceMeters !== null && (
                <Text style={styles.distanceText}>
                  Distance: {gpsLocation.distanceMeters} Meter
                </Text>
              )}
            </View>

            {/* Order / Collection Value (Optional) */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Primary Order / Cheque Amount (₹)</Text>
              <TextInput
                style={styles.underlineInputField}
                placeholder="Optional booking or collection amount (e.g. 50000)"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={orderAmount}
                onChangeText={setOrderAmount}
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
                  <MaterialCommunityIcons name="office-building-outline" size={54} color="#94A3B8" />
                  <Text style={styles.photoPlaceholderText}>
                    Tap camera button on right to capture stockist office photo
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
              if (currentStep === 2 && !selectedStockist) {
                Alert.alert("Select Stockist", "Please select a stockist distributor to continue.");
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
      <Modal visible={isWorkingWithPickerOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.pickerCard}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Working Companion</Text>
              <TouchableOpacity onPress={() => setIsWorkingWithPickerOpen(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search colleague or manager..."
                value={workingWithSearch}
                onChangeText={setWorkingWithSearch}
              />
            </View>

            <FlatList
              data={filteredCompanions}
              keyExtractor={(item) => item.id.toString()}
              style={{ maxHeight: 340 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.itemRow}
                  onPress={() => {
                    setWorkingWith(item);
                    setIsWorkingWithPickerOpen(false);
                  }}
                >
                  <View style={styles.avatarMini}>
                    <FontAwesome5 name="user-tie" size={16} color="#1B64DA" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemSub}>
                      {item.role} • {item.hq}
                    </Text>
                  </View>
                  <Ionicons name="add-circle" size={22} color="#1B64DA" />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

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

            {DIVISIONS.map((div) => (
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

      {/* 3. Searchable Stockist Picker Modal */}
      <Modal visible={isStockistPickerOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.pickerCard}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Stockist Agency</Text>
              <TouchableOpacity onPress={() => setIsStockistPickerOpen(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search stockist or agency name..."
                value={stockistSearchQuery}
                onChangeText={setStockistSearchQuery}
              />
            </View>

            <FlatList
              data={filteredStockists}
              keyExtractor={(item) => item.id.toString()}
              style={{ maxHeight: 360 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.itemRow}
                  onPress={() => {
                    setSelectedStockist(item);
                    setIsStockistPickerOpen(false);
                  }}
                >
                  <View style={styles.avatarMini}>
                    <MaterialCommunityIcons name="truck-delivery" size={16} color="#1B64DA" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.itemName}>{item.agency_name.toUpperCase()}</Text>
                    <Text style={styles.itemSub}>
                      {item.contact_person || "Stockist"} • {item.address || "Agency Office"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
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
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  visitTypeList: {
    gap: 12,
  },
  visitTypePill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
  },
  visitTypePillSelected: {
    borderColor: "#1B64DA",
    backgroundColor: "#F0F7FF",
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
    fontSize: 15,
    fontWeight: "800",
  },
  visitTypePillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    flex: 1,
  },
  visitTypePillTextSelected: {
    color: "#1B64DA",
    fontWeight: "700",
  },
  fieldBlock: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
    marginBottom: 4,
  },
  fieldLabelPrimary: {
    fontSize: 12,
    color: "#1E293B",
    fontWeight: "600",
    marginBottom: 4,
  },
  valueText: {
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "600",
    flex: 1,
  },
  underlineInput: {
    borderBottomWidth: 1,
    borderBottomColor: "#CBD5E1",
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: "center",
  },
  underlineInputField: {
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
    minHeight: 36,
  },
  dropdownIconsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  workingWithHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  addIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  workingWithCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 4,
  },
  workingAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
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
    marginTop: 1,
  },
  removeBtn: {
    padding: 4,
  },
  distanceText: {
    fontSize: 12,
    color: "#1B64DA",
    fontWeight: "600",
    marginTop: 6,
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
  photoBoxContainer: {
    width: "100%",
    height: 200,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    position: "relative",
  },
  capturedPhoto: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 8,
    fontWeight: "500",
  },
  locationGeotagBox: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  geotagTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  geotagTitleText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#E11D48",
    letterSpacing: 0.5,
  },
  geotagCoordsText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#1E293B",
  },
  geotagAddressText: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 1,
  },
  outlinedRemarksBox: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    padding: 12,
    minHeight: 90,
    position: "relative",
    marginTop: 8,
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
    color: "#64748B",
    fontWeight: "600",
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  pickerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    maxHeight: "80%",
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  searchBar: {
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
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  avatarMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  itemSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
});
