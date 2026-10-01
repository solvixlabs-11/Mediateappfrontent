import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMasterStore } from "../../masters/store";
import { EntityPicker } from "../components/EntityPicker";
import { LocationCard } from "../components/LocationCard";
import { customersApi, DoctorDto } from "../api/customersApi";
import { colors, radii, spacing, typography } from "../../../shared/theme/tokens";

interface AddDoctorModalProps {
  visible: boolean;
  onClose: () => void;
  onDoctorCreated: (doctor: DoctorDto) => void;
}

export function AddDoctorModal({
  visible,
  onClose,
  onDoctorCreated,
}: AddDoctorModalProps) {
  const { specializations, customerCategories, territories } = useMasterStore();

  const [fullName, setFullName] = useState("");
  const [qualification, setQualification] = useState("");
  const [specialization, setSpecialization] = useState<string | number>("");
  const [category, setCategory] = useState<string | number>("A");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [address, setAddress] = useState("");
  const [territoryId, setTerritoryId] = useState<string | number>("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFullName("");
    setQualification("");
    setSpecialization("");
    setCategory("A");
    setPhone("");
    setEmail("");
    setClinicName("");
    setAddress("");
    setTerritoryId("");
    setLatitude(null);
    setLongitude(null);
  };

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      Alert.alert("Validation Error", "Doctor's full name is required.");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Validation Error", "Doctor's phone number is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newDoctor = await customersApi.createDoctor({
        full_name: fullName.trim(),
        qualification: qualification.trim() || undefined,
        specialization: specialization ? String(specialization) : undefined,
        category: category ? String(category) : "A",
        phone: phone.trim(),
        email: email.trim() || undefined,
        clinic_name: clinicName.trim() || undefined,
        address: address.trim() || undefined,
        territory_id: territoryId ? Number(territoryId) : undefined,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
      });

      Alert.alert("Success", `Dr. ${newDoctor.full_name} has been added successfully!`);
      resetForm();
      onDoctorCreated(newDoctor);
      onClose();
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to add doctor.";
      Alert.alert("Error", errorMsg);
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
          <Text style={styles.headerTitle}>Add New Doctor</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Doctor Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Full Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Dr. Rajesh Sharma"
              placeholderTextColor={colors.textSecondary}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          {/* Qualification */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Qualifications</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. MBBS, MD (Cardiology)"
              placeholderTextColor={colors.textSecondary}
              value={qualification}
              onChangeText={setQualification}
            />
          </View>

          {/* Specialization Dropdown (Dynamic from Backend Masters) */}
          <EntityPicker
            label="Specialization"
            placeholder="Select specialization..."
            items={specializations.map((s) => ({
              id: s.name,
              label: s.name,
              sublabel: s.description || undefined,
            }))}
            selectedValue={specialization}
            onValueChange={setSpecialization}
          />

          {/* Category Dropdown (Dynamic from Backend Masters) */}
          <EntityPicker
            label="Doctor Category / Tier"
            placeholder="Select category..."
            items={
              customerCategories.length > 0
                ? customerCategories.map((c) => ({
                    id: c.code,
                    label: c.name,
                    sublabel: c.description || undefined,
                  }))
                : [
                    { id: "A", label: "Core (Tier 1 - High Volume)" },
                    { id: "B", label: "General (Tier 2 - Regular)" },
                    { id: "C", label: "Potential (Tier 3 - Developmental)" },
                  ]
            }
            selectedValue={category}
            onValueChange={setCategory}
            required
          />

          {/* Territory Picker */}
          {territories.length > 0 && (
            <EntityPicker
              label="Assigned Territory"
              placeholder="Select territory..."
              items={territories.map((t) => ({
                id: t.id,
                label: t.name,
                sublabel: `HQ: ${t.headquarters}`,
              }))}
              selectedValue={territoryId}
              onValueChange={setTerritoryId}
            />
          )}

          {/* Contact Details */}
          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1, marginRight: spacing.sm }]}>
              <Text style={styles.label}>
                Phone <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Mobile number"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Clinic & Address */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Clinic / Hospital Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Metro Heart Clinic"
              placeholderTextColor={colors.textSecondary}
              value={clinicName}
              onChangeText={setClinicName}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Clinic street address and landmarks"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              value={address}
              onChangeText={setAddress}
            />
          </View>

          {/* GPS Coordinates & Geofence Tagging */}
          <LocationCard
            latitude={latitude}
            longitude={longitude}
            onLocationCaptured={(coords) => {
              setLatitude(coords.latitude);
              setLongitude(coords.longitude);
            }}
          />

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="person-add" size={18} color="#fff" />
                <Text style={styles.submitButtonText}>Save Doctor to Database</Text>
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
  fieldGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.subheading,
    fontSize: 13,
    color: colors.navy,
    marginBottom: 6,
  },
  required: {
    color: colors.error,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
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
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...typography.button,
    color: "#fff",
    fontSize: 15,
  },
});
