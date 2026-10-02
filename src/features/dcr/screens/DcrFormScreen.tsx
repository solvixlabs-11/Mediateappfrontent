import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { EntityPicker } from "../../customers/components/EntityPicker";
import { LocationCard } from "../../customers/components/LocationCard";
import {
  ChemistDto,
  DoctorDto,
  HospitalDto,
  StockistDto,
  customersApi,
} from "../../customers/api/customersApi";
import { dcrApi } from "../api/dcrApi";
import { RootStackParamList } from "../../../navigation/types";
import { colors, radii, spacing, typography } from "../../../shared/theme/tokens";

export function DcrFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, "DcrForm">>();

  const initialPlannedVisitId = route.params?.initialPlannedVisitId;
  const initialCustomerType = route.params?.initialCustomerType || "DOCTOR";
  const initialCustomerId = route.params?.initialCustomerId;

  const [customerType, setCustomerType] = useState<"DOCTOR" | "CHEMIST" | "HOSPITAL" | "STOCKIST">(
    (initialCustomerType as "DOCTOR" | "CHEMIST" | "HOSPITAL" | "STOCKIST") || "DOCTOR"
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | string>(
    initialCustomerId || ""
  );

  // Dynamic customer lists from backend
  const [doctors, setDoctors] = useState<DoctorDto[]>([]);
  const [chemists, setChemists] = useState<ChemistDto[]>([]);
  const [hospitals, setHospitals] = useState<HospitalDto[]>([]);
  const [stockists, setStockists] = useState<StockistDto[]>([]);

  // Call Details
  const [visitType, setVisitType] = useState("INDEPENDENT");
  const [callDuration, setCallDuration] = useState("15");
  const [pobAmount, setPobAmount] = useState("");
  const [remarks, setRemarks] = useState("");

  // GPS
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Post-Call Analysis
  const [callOutcome, setCallOutcome] = useState("HIGHLY_INTERESTED");
  const [commitment, setCommitment] = useState("HIGH");
  const [doctorFeedback, setDoctorFeedback] = useState("");
  const [nextVisitDays, setNextVisitDays] = useState("7");
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpNotes, setFollowUpNotes] = useState("");

  // Product Discussion & Samples
  const [productName, setProductName] = useState("");
  const [sampleQuantity, setSampleQuantity] = useState("0");
  const [giftQuantity, setGiftQuantity] = useState("0");

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    customersApi.listDoctors({ limit: 100 }).then(setDoctors).catch(() => {});
    customersApi.listChemists({ limit: 100 }).then(setChemists).catch(() => {});
    customersApi.listHospitals({ limit: 100 }).then(setHospitals).catch(() => {});
    customersApi.listStockists({ limit: 100 }).then(setStockists).catch(() => {});
  }, []);

  useEffect(() => {
    if (initialCustomerType)
      setCustomerType(initialCustomerType as "DOCTOR" | "CHEMIST" | "HOSPITAL" | "STOCKIST");
    if (initialCustomerId) setSelectedCustomerId(initialCustomerId);
  }, [initialCustomerType, initialCustomerId]);

  const getEntityPickerItems = () => {
    switch (customerType) {
      case "DOCTOR":
        return doctors.map((d) => ({
          id: d.id,
          label: d.full_name,
          sublabel: `${d.specialization || "General"} • Tier ${d.category}`,
        }));
      case "CHEMIST":
        return chemists.map((c) => ({
          id: c.id,
          label: c.shop_name,
          sublabel: c.address || "Chemist / Pharmacy",
        }));
      case "HOSPITAL":
        return hospitals.map((h) => ({
          id: h.id,
          label: h.name,
          sublabel: h.type || "Hospital",
        }));
      case "STOCKIST":
        return stockists.map((s) => ({
          id: s.id,
          label: s.agency_name,
          sublabel: `Distributor • Credit: ${s.credit_days}d`,
        }));
      default:
        return [];
    }
  };

  const handleSubmit = async () => {
    if (!selectedCustomerId) {
      Alert.alert("Validation", `Please select a ${customerType.toLowerCase()}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + (parseInt(nextVisitDays) || 7));
      const nextDateStr = nextDate.toISOString().split("T")[0];

      const payload: any = {
        dcr_date: todayStr,
        customer_type: customerType,
        planned_visit_id: initialPlannedVisitId,
        visit_type: visitType,
        call_duration_minutes: parseInt(callDuration) || 15,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        remarks: remarks.trim() || undefined,
        pob_amount: parseFloat(pobAmount) || 0.0,
        client_uuid: `dcr-uuid-${Date.now()}`,
        post_call_analysis: {
          call_outcome: callOutcome,
          doctor_feedback: doctorFeedback.trim() || undefined,
          prescription_commitment: commitment,
          next_visit_date: nextDateStr,
          follow_up_required: followUpRequired,
          follow_up_notes: followUpNotes.trim() || undefined,
        },
        product_details: productName.trim()
          ? [
              {
                product_name: productName.trim(),
                sample_quantity: parseInt(sampleQuantity) || 0,
                gift_quantity: parseInt(giftQuantity) || 0,
              },
            ]
          : [],
      };

      if (customerType === "DOCTOR") payload.doctor_id = Number(selectedCustomerId);
      if (customerType === "CHEMIST") payload.chemist_id = Number(selectedCustomerId);
      if (customerType === "HOSPITAL") payload.hospital_id = Number(selectedCustomerId);
      if (customerType === "STOCKIST") payload.stockist_id = Number(selectedCustomerId);

      const response = await dcrApi.submitDcr(payload);

      Alert.alert(
        response.is_geofence_verified ? "DCR Verified" : "DCR Recorded",
        response.is_geofence_verified
          ? "Visit submitted and server geofence verified successfully!"
          : "Visit submitted. (Outside customer geofence radius).",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.detail || err?.message || "Failed to submit DCR."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Call Report (DCR)</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Customer Type Segment */}
        <Text style={styles.sectionLabel}>Customer Category</Text>
        <View style={styles.typeRow}>
          {(["DOCTOR", "CHEMIST", "HOSPITAL", "STOCKIST"] as const).map((t) => {
            const active = customerType === t;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.typePill, active && styles.typePillActive]}
                onPress={() => {
                  setCustomerType(t);
                  setSelectedCustomerId("");
                }}
              >
                <Text style={[styles.typeText, active && styles.typeTextActive]}>
                  {t === "DOCTOR"
                    ? "Doctor"
                    : t === "CHEMIST"
                    ? "Chemist"
                    : t === "HOSPITAL"
                    ? "Hospital"
                    : "Stockist"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Dynamic Customer Picker */}
        <EntityPicker
          label={`Select ${customerType}`}
          placeholder={`Choose ${customerType.toLowerCase()} from directory...`}
          items={getEntityPickerItems()}
          selectedValue={selectedCustomerId}
          onValueChange={setSelectedCustomerId}
          required
        />

        {/* Visit Type */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Visit Mode</Text>
          <View style={styles.visitModeRow}>
            {[
              { id: "INDEPENDENT", label: "Independent Call" },
              { id: "JOINT_WITH_MANAGER", label: "Joint with Manager" },
            ].map((m) => {
              const active = visitType === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.visitModeBtn, active && styles.visitModeBtnActive]}
                  onPress={() => setVisitType(m.id)}
                >
                  <Text style={[styles.visitModeText, active && styles.visitModeTextActive]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Duration & POB */}
        <View style={styles.row}>
          <View style={[styles.fieldGroup, { flex: 1, marginRight: spacing.sm }]}>
            <Text style={styles.label}>Call Duration (mins)</Text>
            <TextInput
              style={styles.input}
              value={callDuration}
              onChangeText={setCallDuration}
              keyboardType="numeric"
              placeholder="15"
            />
          </View>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>POB Order Value (₹)</Text>
            <TextInput
              style={styles.input}
              value={pobAmount}
              onChangeText={setPobAmount}
              keyboardType="numeric"
              placeholder="0.00"
            />
          </View>
        </View>

        {/* Location & Geofence Capture */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Live Geolocation Verification</Text>
          <LocationCard
            onLocationCaptured={(loc) => {
              setLatitude(loc.latitude);
              setLongitude(loc.longitude);
            }}
          />
        </View>

        {/* Product Discussion & Detailing */}
        <View style={styles.analysisCard}>
          <Text style={styles.cardTitle}>Promoted Products & Detailing</Text>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Key Brand / Molecule Promoted</Text>
            <TextInput
              style={styles.input}
              value={productName}
              onChangeText={setProductName}
              placeholder="e.g. Mediate-Cardio 10mg / Amoxi-Clav"
            />
          </View>
          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1, marginRight: spacing.sm }]}>
              <Text style={styles.label}>Samples Given</Text>
              <TextInput
                style={styles.input}
                value={sampleQuantity}
                onChangeText={setSampleQuantity}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>Gifts / LBL Given</Text>
              <TextInput
                style={styles.input}
                value={giftQuantity}
                onChangeText={setGiftQuantity}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>
        </View>

        {/* Post-Call Analysis (Structured MR Buddy Format) */}
        <View style={styles.analysisCard}>
          <Text style={styles.cardTitle}>Post-Call Analysis (Audit)</Text>

          {/* Call Outcome */}
          <Text style={styles.label}>Doctor/Client Response</Text>
          <View style={styles.outcomeRow}>
            {[
              { id: "HIGHLY_INTERESTED", label: "Very Positive" },
              { id: "NEUTRAL", label: "Neutral" },
              { id: "OBJECTION_RAISED", label: "Objection" },
            ].map((o) => {
              const active = callOutcome === o.id;
              return (
                <TouchableOpacity
                  key={o.id}
                  style={[styles.outcomePill, active && styles.outcomePillActive]}
                  onPress={() => setCallOutcome(o.id)}
                >
                  <Text style={[styles.outcomeText, active && styles.outcomeTextActive]}>
                    {o.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Rx Commitment */}
          <Text style={[styles.label, { marginTop: spacing.md }]}>Rx Commitment Level</Text>
          <View style={styles.outcomeRow}>
            {[
              { id: "HIGH", label: "High Support" },
              { id: "MEDIUM", label: "Occasional" },
              { id: "LOW", label: "Minimal/Trial" },
            ].map((c) => {
              const active = commitment === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.outcomePill, active && styles.outcomePillActive]}
                  onPress={() => setCommitment(c.id)}
                >
                  <Text style={[styles.outcomeText, active && styles.outcomeTextActive]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Doctor Feedback */}
          <View style={[styles.fieldGroup, { marginTop: spacing.md }]}>
            <Text style={styles.label}>Detailed Feedback / Clinical Insights</Text>
            <TextInput
              style={[styles.input, { height: 60 }]}
              value={doctorFeedback}
              onChangeText={setDoctorFeedback}
              placeholder="e.g. Doctor willing to switch 5 patients to our molecule; requested clinical trial reprint..."
              multiline
            />
          </View>

          {/* Next Visit & Follow-Up */}
          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1, marginRight: spacing.sm }]}>
              <Text style={styles.label}>Follow-up In (Days)</Text>
              <TextInput
                style={styles.input}
                value={nextVisitDays}
                onChangeText={setNextVisitDays}
                keyboardType="numeric"
                placeholder="7"
              />
            </View>
          </View>

          {/* Follow-up flag */}
          <View style={styles.followUpToggleRow}>
            <Text style={styles.followUpToggleText}>Create Actionable Follow-up Task</Text>
            <Switch
              value={followUpRequired}
              onValueChange={setFollowUpRequired}
              trackColor={{ false: "#CBD5E1", true: colors.primary }}
            />
          </View>

          {followUpRequired && (
            <View style={styles.followUpSubBox}>
              <Text style={styles.label}>Follow-up Action Note</Text>
              <TextInput
                style={styles.input}
                value={followUpNotes}
                onChangeText={setFollowUpNotes}
                placeholder="e.g. Deliver sample batch #401 to clinic assistant"
              />
            </View>
          )}
        </View>

        {/* General Remarks */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>General DCR Remarks</Text>
          <TextInput
            style={[styles.input, { height: 60 }]}
            value={remarks}
            onChangeText={setRemarks}
            placeholder="Add general field remarks..."
            multiline
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-done" size={20} color="#fff" />
              <Text style={styles.submitBtnText}>Submit DCR Visit Report</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    ...typography.subheading,
    color: colors.navy,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  sectionLabel: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  typeRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  typePill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typePillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  typeTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: "600",
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.textPrimary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  visitModeRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  visitModeBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  visitModeBtnActive: {
    backgroundColor: "#E6F4F1",
    borderColor: colors.primary,
  },
  visitModeText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
  },
  visitModeTextActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  analysisCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    ...typography.subheading,
    color: colors.navy,
    marginBottom: spacing.md,
  },
  outcomeRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  outcomePill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.background,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outcomePillActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  outcomeText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
  },
  outcomeTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  followUpToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  followUpToggleText: {
    ...typography.subheading,
    fontSize: 13,
    color: colors.navy,
  },
  followUpSubBox: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    ...typography.button,
    color: "#fff",
    fontSize: 15,
  },
});
