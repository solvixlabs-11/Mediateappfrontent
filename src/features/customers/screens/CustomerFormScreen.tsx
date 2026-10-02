import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/types";
import { useMasterStore } from "../../masters/store";
import { EntityPicker } from "../components/EntityPicker";
import { LocationCard } from "../components/LocationCard";
import { customersApi } from "../api/customersApi";
import { colors, radii, spacing, typography } from "../../../shared/theme/tokens";

type CustomerFormRouteProp = RouteProp<RootStackParamList, "CustomerForm">;

export function CustomerFormScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<CustomerFormRouteProp>();
  const customerType = route.params?.customerType || "DOCTOR";
  const mode = route.params?.mode || "create";

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

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      Alert.alert("Validation Error", "Name is required.");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Validation Error", "Phone number is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (customerType === "DOCTOR") {
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

        Alert.alert("Success", `Dr. ${newDoctor.full_name} has been added successfully!`, [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else if (customerType === "CHEMIST") {
        const newChemist = await customersApi.createChemist({
          shop_name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          territory_id: territoryId ? Number(territoryId) : undefined,
          latitude: latitude ?? undefined,
          longitude: longitude ?? undefined,
        });
        Alert.alert("Success", `Chemist ${newChemist.shop_name} has been added successfully!`, [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else if (customerType === "HOSPITAL") {
        const newHospital = await customersApi.createHospital({
          name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          territory_id: territoryId ? Number(territoryId) : undefined,
          latitude: latitude ?? undefined,
          longitude: longitude ?? undefined,
        });
        Alert.alert("Success", `Hospital ${newHospital.name} has been added successfully!`, [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to save customer.";
      Alert.alert("Error", errorMsg);
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
        >
          <Ionicons name="arrow-back" size={24} color={colors.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mode === "edit" ? "Edit" : "Add New"}{" "}
          {customerType === "DOCTOR"
            ? "Doctor"
            : customerType === "CHEMIST"
            ? "Chemist"
            : customerType === "HOSPITAL"
            ? "Hospital"
            : "Stockist"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            {customerType === "CHEMIST"
              ? "Shop Name"
              : customerType === "HOSPITAL"
              ? "Hospital Name"
              : "Full Name"}{" "}
            <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder={
              customerType === "DOCTOR"
                ? "e.g. Dr. Rajesh Sharma"
                : customerType === "CHEMIST"
                ? "e.g. Apollo Pharmacy"
                : "e.g. City General Hospital"
            }
            placeholderTextColor={colors.textSecondary}
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        {/* Qualification (Doctors only) */}
        {customerType === "DOCTOR" && (
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
        )}

        {/* Specialization (Doctors only) */}
        {customerType === "DOCTOR" && (
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
        )}

        {/* Category Dropdown (Doctors only) */}
        {customerType === "DOCTOR" && (
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
        )}

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
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>

          <View style={[styles.fieldGroup, { flex: 1.2 }]}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="doctor@example.com"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Clinic / Practice Name */}
        {customerType === "DOCTOR" && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Clinic / Consulting Chamber Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Sharma Heart & Care Clinic"
              placeholderTextColor={colors.textSecondary}
              value={clinicName}
              onChangeText={setClinicName}
            />
          </View>
        )}

        {/* Full Address */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Clinic Address</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Room/Shop no., Building, Road, Landmark..."
            placeholderTextColor={colors.textSecondary}
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Location / Geofence Section */}
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
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.submitBtnText}>
                {mode === "edit" ? "Save Changes" : "Create Record"}
              </Text>
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
    paddingVertical: spacing.md,
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
  row: {
    flexDirection: "row",
  },
  label: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.navy,
    marginBottom: spacing.xs,
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
    paddingVertical: spacing.sm + 2,
    ...typography.body,
    fontSize: 14,
    color: colors.text,
  },
  textArea: {
    minHeight: 64,
    textAlignVertical: "top",
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    marginTop: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    ...typography.body,
    fontWeight: "700",
    color: "#fff",
  },
});
