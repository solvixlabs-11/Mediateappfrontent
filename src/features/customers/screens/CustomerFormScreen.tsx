import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/types";
import { useMasterStore } from "../../masters/store";
import { EntityPicker } from "../components/EntityPicker";
import { AutoDetectLocationCard } from "../../../shared/components/AutoDetectLocationCard";
import { ScreenHeader } from "../../../shared/components/ScreenHeader";
import { customersApi } from "../api/customersApi";
import { colors, radii, spacing, typography, shadows } from "../../../theme";

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

  const customerTypeName =
    customerType === "DOCTOR"
      ? "Doctor"
      : customerType === "CHEMIST"
      ? "Chemist"
      : customerType === "HOSPITAL"
      ? "Hospital"
      : "Stockist";

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
      {/* Signature Navy Header */}
      <ScreenHeader
        title={`${mode === "edit" ? "Edit" : "New"} ${customerTypeName}`}
        subtitle={`Directory enrollment & profile`}
        variant="navy"
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Card 1: Basic Identity */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconBadge}>
              <Feather name="user-check" size={16} color={colors.brandBlue} />
            </View>
            <Text style={styles.sectionTitle}>Basic Information</Text>
          </View>

          {/* Full / Entity Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              {customerType === "CHEMIST"
                ? "Pharmacy / Shop Name"
                : customerType === "HOSPITAL"
                ? "Hospital Name"
                : "Doctor Full Name"}{" "}
              <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder={
                customerType === "DOCTOR"
                  ? "e.g. Dr. Full Name"
                  : customerType === "CHEMIST"
                  ? "e.g. Apollo Pharmacy"
                  : "e.g. City General Hospital"
              }
              placeholderTextColor={colors.textFaint}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          {/* Clinic / Practice Name (Doctor only) */}
          {customerType === "DOCTOR" && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Clinic / Hospital Affiliation</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Sharma Heart & Care Clinic"
                placeholderTextColor={colors.textFaint}
                value={clinicName}
                onChangeText={setClinicName}
              />
            </View>
          )}
        </View>

        {/* Card 2: Professional & Classification (Doctor only) */}
        {customerType === "DOCTOR" && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIconBadge, { backgroundColor: colors.tealPastel }]}>
                <Feather name="award" size={16} color={colors.teal} />
              </View>
              <Text style={styles.sectionTitle}>Qualifications & Tier</Text>
            </View>

            {/* Qualifications */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Qualifications</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. MBBS, MD (Cardiology)"
                placeholderTextColor={colors.textFaint}
                value={qualification}
                onChangeText={setQualification}
              />
            </View>

            {/* Specialization */}
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

            {/* Category / Tier */}
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
          </View>
        )}

        {/* Card 3: Contact & Assignment */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconBadge, { backgroundColor: colors.orangePastel }]}>
              <Feather name="phone-call" size={16} color={colors.orange} />
            </View>
            <Text style={styles.sectionTitle}>Contact & Territory</Text>
          </View>

          {/* Contact Details Row */}
          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1, marginRight: spacing.sm }]}>
              <Text style={styles.label}>
                Phone Number <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Mobile number"
                placeholderTextColor={colors.textFaint}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>

            <View style={[styles.fieldGroup, { flex: 1.1 }]}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="email@example.com"
                placeholderTextColor={colors.textFaint}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

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
        </View>

        {/* Card 4: Location & Address */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconBadge, { backgroundColor: colors.purplePastel }]}>
              <Feather name="map-pin" size={16} color={colors.purple} />
            </View>
            <Text style={styles.sectionTitle}>Geotag & Address</Text>
          </View>

          {/* Auto-Detect Location Card */}
          <AutoDetectLocationCard
            latitude={latitude}
            longitude={longitude}
            detectedAddress={address}
            onLocationDetected={(geo) => {
              setLatitude(geo.latitude);
              setLongitude(geo.longitude);
              if (geo.address) {
                setAddress(geo.address);
              }
            }}
            title="Auto-Detect GPS Location"
            subtitle={`Geotag premises & auto-fill address`}
          />

          {/* Full Address */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              {customerType === "DOCTOR"
                ? "Clinic / Chamber Address"
                : customerType === "CHEMIST"
                ? "Pharmacy Address"
                : "Premises Address"}
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Room/Shop no., Building, Road, Landmark..."
              placeholderTextColor={colors.textFaint}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.surface} size="small" />
          ) : (
            <>
              <Feather name="check" size={18} color={colors.surface} />
              <Text style={styles.submitBtnText}>
                {mode === "edit" ? "Save Changes" : `Create ${customerTypeName}`}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl * 2,
    gap: spacing.lg,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.soft,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  sectionIconBadge: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: colors.bluePastel,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    ...typography.heading,
    fontSize: 16,
    fontWeight: "800",
    color: colors.textInk,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
  },
  label: {
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
  input: {
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
  submitBtn: {
    backgroundColor: colors.navy,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
    ...shadows.soft,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    ...typography.button,
    fontSize: 15,
    fontWeight: "800",
    color: colors.surface,
    letterSpacing: 0.5,
  },
});
