import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { EntityPicker } from "../../customers/components/EntityPicker";
import { LocationCard } from "../../customers/components/LocationCard";
import {
  ChemistDto,
  DoctorDto,
  HospitalDto,
  StockistDto,
  customersApi,
} from "../../customers/api/customersApi";
import { DcrVisitDto, dcrApi } from "../api/dcrApi";
import { colors, radii, spacing, typography } from "../../../shared/theme/tokens";

interface DcrFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmitted: (visit: DcrVisitDto) => void;
  initialPlannedVisitId?: number;
  initialCustomerType?: "DOCTOR" | "CHEMIST" | "HOSPITAL" | "STOCKIST" | string;
  initialCustomerId?: number;
}

export function DcrFormModal({
  visible,
  onClose,
  onSubmitted,
  initialPlannedVisitId,
  initialCustomerType = "DOCTOR",
  initialCustomerId,
}: DcrFormModalProps) {
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
    if (visible) {
      customersApi.listDoctors({ limit: 100 }).then(setDoctors).catch(() => {});
      customersApi.listChemists({ limit: 100 }).then(setChemists).catch(() => {});
      customersApi.listHospitals({ limit: 100 }).then(setHospitals).catch(() => {});
      customersApi.listStockists({ limit: 100 }).then(setStockists).catch(() => {});
    }
  }, [visible]);

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
          : "Visit submitted. (Outside customer geofence radius)."
      );

      onSubmitted(response);
      onClose();
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
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={colors.navy} />
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

          {/* GPS Coordinates & Geofencing Card */}
          <Text style={styles.sectionLabel}>Location & Geofencing</Text>
          <LocationCard
            latitude={latitude}
            longitude={longitude}
            onLocationCaptured={(coords) => {
              setLatitude(coords.latitude);
              setLongitude(coords.longitude);
            }}
          />

          {/* Call Duration & POB */}
          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1, marginRight: spacing.sm }]}>
              <Text style={styles.label}>Duration (Mins)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={callDuration}
                onChangeText={setCallDuration}
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>POB Order (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={pobAmount}
                onChangeText={setPobAmount}
              />
            </View>
          </View>

          {/* Post-Call Analysis (Feature 9) */}
          <View style={styles.analysisCard}>
            <Text style={styles.cardTitle}>Post-Call Analysis & Outcomes</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Doctor / Customer Outcome</Text>
              <View style={styles.outcomeRow}>
                {[
                  { id: "HIGHLY_INTERESTED", label: "High Interest" },
                  { id: "MODERATE", label: "Moderate" },
                  { id: "NOT_INTERESTED", label: "Low / Nil" },
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
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Prescription Commitment</Text>
              <View style={styles.outcomeRow}>
                {["HIGH", "MEDIUM", "LOW", "NIL"].map((c) => {
                  const active = commitment === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[styles.outcomePill, active && styles.outcomePillActive]}
                      onPress={() => setCommitment(c)}
                    >
                      <Text style={[styles.outcomeText, active && styles.outcomeTextActive]}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Doctor Feedback / Discussion Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Customer reaction, questions, or remarks..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                value={doctorFeedback}
                onChangeText={setDoctorFeedback}
              />
            </View>

            <View style={styles.followUpToggleRow}>
              <Text style={styles.followUpToggleText}>Schedule Follow-up Task?</Text>
              <Switch
                value={followUpRequired}
                onValueChange={setFollowUpRequired}
                trackColor={{ false: colors.greyLight, true: colors.primary }}
              />
            </View>

            {followUpRequired && (
              <View style={styles.followUpSubBox}>
                <Text style={styles.label}>Follow-up Action Notes</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Bring cardiology trial pack"
                  placeholderTextColor={colors.textSecondary}
                  value={followUpNotes}
                  onChangeText={setFollowUpNotes}
                />
              </View>
            )}
          </View>

          {/* Product & Sample Discussion (P4-B-01 & P4-B-02) */}
          <View style={styles.analysisCard}>
            <Text style={styles.cardTitle}>Promoted Products & Samples</Text>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Brand / Formulation Discussed</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Cardiomax 50mg / Medipres 10mg"
                placeholderTextColor={colors.textSecondary}
                value={productName}
                onChangeText={setProductName}
              />
            </View>
            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: spacing.sm }]}>
                <Text style={styles.label}>Samples Given (Units)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={sampleQuantity}
                  onChangeText={setSampleQuantity}
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Gift / Materials (Units)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={giftQuantity}
                  onChangeText={setGiftQuantity}
                />
              </View>
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={18} color="#fff" />
                <Text style={styles.submitBtnText}>Submit DCR to Server</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.title,
    fontSize: 18,
    color: colors.navy,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  sectionLabel: {
    ...typography.subheading,
    fontSize: 13,
    color: colors.navy,
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
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  typeTextActive: {
    color: "#fff",
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.subheading,
    fontSize: 13,
    color: colors.navy,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
  },
  textArea: {
    height: 70,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
  },
  visitModeRow: {
    flexDirection: "row",
    gap: spacing.sm,
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
    backgroundColor: colors.lightPrimary,
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
