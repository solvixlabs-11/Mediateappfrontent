import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/types";
import { ROUTES } from "../../../navigation/routes";
import { customersApi, DoctorDto } from "../api/customersApi";
import { ScreenHeader } from "../../../shared/components/ScreenHeader";
import { colors, radii, spacing, typography, shadows } from "../../../theme";

type CustomerDetailRouteProp = RouteProp<RootStackParamList, "CustomerDetail">;

export function CustomerDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<CustomerDetailRouteProp>();
  const { customerId, customerType, customerName } = route.params;

  const [doctor, setDoctor] = useState<DoctorDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCustomer() {
      setIsLoading(true);
      setError(null);
      try {
        if (customerType === "DOCTOR") {
          const data = await customersApi.getDoctor(customerId);
          setDoctor(data);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load customer details");
      } finally {
        setIsLoading(false);
      }
    }
    loadCustomer();
  }, [customerId, customerType]);

  const handleCall = (phone?: string | null) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleEmail = (email?: string | null) => {
    if (email) {
      Linking.openURL(`mailto:${email}`);
    }
  };

  const titleLabel =
    customerType === "DOCTOR"
      ? "Doctor Profile"
      : customerType === "CHEMIST"
      ? "Chemist Profile"
      : customerType === "HOSPITAL"
      ? "Hospital Profile"
      : "Stockist Profile";

  const displayName = doctor?.full_name || customerName || "Customer Profile";
  const initials = displayName
    .replace(/^Dr\.?\s*/i, "")
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "DR";

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar style="light" />

      <ScreenHeader
        title={titleLabel}
        subtitle={customerType === "DOCTOR" ? "Physician details & affiliations" : "Account details"}
        variant="navy"
        onBack={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() =>
              navigation.navigate(ROUTES.DcrForm, {
                initialCustomerType: customerType,
                initialCustomerId: customerId,
              })
            }
            activeOpacity={0.8}
          >
            <Feather name="plus" size={14} color={colors.surface} />
            <Text style={styles.headerActionText}>Log Call</Text>
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.navy} />
          <Text style={styles.loadingText}>Loading profile details...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <View style={styles.errorIconCircle}>
            <Feather name="alert-circle" size={32} color={colors.accentRed} />
          </View>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              if (customerType === "DOCTOR") {
                setIsLoading(true);
                setError(null);
                customersApi
                  .getDoctor(customerId)
                  .then(setDoctor)
                  .catch((err: any) => setError(err?.message || "Failed to load"))
                  .finally(() => setIsLoading(false));
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : doctor ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Profile Bento Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>

            <Text style={styles.doctorName}>{doctor.full_name}</Text>
            {doctor.qualification ? (
              <Text style={styles.qualification}>{doctor.qualification}</Text>
            ) : null}

            <View style={styles.badgeRow}>
              {doctor.specialization ? (
                <View style={styles.specBadge}>
                  <Text style={styles.specText}>{doctor.specialization}</Text>
                </View>
              ) : null}
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>Tier {doctor.category}</Text>
              </View>
            </View>

            {/* Quick Action Pills */}
            <View style={styles.actionRow}>
              {doctor.phone ? (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.successGreenPastel }]}
                  onPress={() => handleCall(doctor.phone)}
                  activeOpacity={0.8}
                >
                  <Feather name="phone" size={16} color={colors.successGreen} />
                  <Text style={[styles.actionBtnText, { color: colors.successGreen }]}>Call</Text>
                </TouchableOpacity>
              ) : null}

              {doctor.email ? (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.bluePastel }]}
                  onPress={() => handleEmail(doctor.email)}
                  activeOpacity={0.8}
                >
                  <Feather name="mail" size={16} color={colors.brandBlue} />
                  <Text style={[styles.actionBtnText, { color: colors.brandBlue }]}>Email</Text>
                </TouchableOpacity>
              ) : null}

              {doctor.latitude && doctor.longitude ? (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.orangePastel }]}
                  onPress={() =>
                    Linking.openURL(
                      `https://www.google.com/maps/search/?api=1&query=${doctor.latitude},${doctor.longitude}`
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Feather name="navigation" size={16} color={colors.orange} />
                  <Text style={[styles.actionBtnText, { color: colors.orange }]}>Navigate</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Contact & Clinic Card */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Contact & Clinic</Text>

            <View style={styles.detailRow}>
              <View style={[styles.detailIconBox, { backgroundColor: colors.bluePastel }]}>
                <Feather name="phone" size={15} color={colors.brandBlue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>Phone Number</Text>
                <Text style={styles.detailText}>{doctor.phone || "Not specified"}</Text>
              </View>
            </View>

            {doctor.email ? (
              <View style={styles.detailRow}>
                <View style={[styles.detailIconBox, { backgroundColor: colors.tealPastel }]}>
                  <Feather name="mail" size={15} color={colors.teal} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailLabel}>Email Address</Text>
                  <Text style={styles.detailText}>{doctor.email}</Text>
                </View>
              </View>
            ) : null}

            {doctor.clinic_name ? (
              <View style={styles.detailRow}>
                <View style={[styles.detailIconBox, { backgroundColor: colors.purplePastel }]}>
                  <Feather name="briefcase" size={15} color={colors.purple} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailLabel}>Clinic / Chamber</Text>
                  <Text style={styles.detailText}>{doctor.clinic_name}</Text>
                </View>
              </View>
            ) : null}

            {doctor.address ? (
              <View style={[styles.detailRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <View style={[styles.detailIconBox, { backgroundColor: colors.orangePastel }]}>
                  <Feather name="map-pin" size={15} color={colors.orange} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailLabel}>Clinic Address</Text>
                  <Text style={styles.detailText}>{doctor.address}</Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Mapped Hospitals */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Hospital Affiliations</Text>
            {doctor.hospitals && doctor.hospitals.length > 0 ? (
              doctor.hospitals.map((h) => (
                <View key={h.hospital_id} style={styles.hospitalCard}>
                  <View style={styles.hospitalHeader}>
                    <Text style={styles.hospitalName}>{h.hospital_name}</Text>
                    {h.is_primary && (
                      <View style={styles.primaryBadge}>
                        <Text style={styles.primaryBadgeText}>Primary</Text>
                      </View>
                    )}
                  </View>
                  {h.department ? (
                    <Text style={styles.hospitalMeta}>Department: {h.department}</Text>
                  ) : null}
                  {h.visiting_hours ? (
                    <Text style={styles.hospitalMeta}>Hours: {h.visiting_hours}</Text>
                  ) : null}
                </View>
              ))
            ) : (
              <Text style={styles.emptyHospitalText}>No hospital affiliations recorded.</Text>
            )}
          </View>

          {/* Geofence Info */}
          {doctor.latitude && doctor.longitude ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Geofence Verification</Text>
              <View style={styles.geoBox}>
                <Feather name="shield" size={18} color={colors.successGreen} />
                <Text style={styles.geoText}>
                  {doctor.latitude.toFixed(6)}° N, {doctor.longitude.toFixed(6)}° E
                </Text>
              </View>
            </View>
          ) : null}

          {/* Log Visit CTA */}
          <TouchableOpacity
            style={styles.logVisitBtn}
            onPress={() =>
              navigation.navigate(ROUTES.DcrForm, {
                initialCustomerType: customerType,
                initialCustomerId: customerId,
              })
            }
            activeOpacity={0.8}
          >
            <Feather name="file-plus" size={18} color={colors.surface} />
            <Text style={styles.logVisitText}>Log Visit / DCR</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
            <Text style={styles.doctorName}>{displayName}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{customerType}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.logVisitBtn}
            onPress={() =>
              navigation.navigate(ROUTES.DcrForm, {
                initialCustomerType: customerType,
                initialCustomerId: customerId,
              })
            }
            activeOpacity={0.8}
          >
            <Feather name="file-plus" size={18} color={colors.surface} />
            <Text style={styles.logVisitText}>Log Visit / DCR</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    gap: 4,
  },
  headerActionText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "700",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  errorIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accentRedPastel,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.textInk,
    textAlign: "center",
    fontWeight: "600",
  },
  retryBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
  },
  retryBtnText: {
    ...typography.button,
    color: colors.surface,
    fontWeight: "700",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl * 2,
    gap: spacing.lg,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.soft,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.bluePastel,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  avatarInitials: {
    ...typography.title,
    fontSize: 24,
    fontWeight: "800",
    color: colors.navy,
  },
  doctorName: {
    ...typography.heading,
    fontSize: 20,
    fontWeight: "800",
    color: colors.textInk,
    textAlign: "center",
  },
  qualification: {
    ...typography.body,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: "center",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  specBadge: {
    backgroundColor: colors.bluePastel,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  specText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: "700",
    color: colors.brandBlue,
  },
  categoryBadge: {
    backgroundColor: colors.tealPastel,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  categoryText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: "700",
    color: colors.teal,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xl,
    width: "100%",
    justifyContent: "center",
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: radii.lg,
  },
  actionBtnText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: "800",
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.soft,
  },
  sectionTitle: {
    ...typography.heading,
    fontSize: 16,
    fontWeight: "800",
    color: colors.textInk,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  detailIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  detailLabel: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  detailText: {
    ...typography.body,
    fontSize: 14,
    fontWeight: "600",
    color: colors.textInk,
    marginTop: 2,
  },
  hospitalCard: {
    backgroundColor: colors.inputBackground,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  hospitalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hospitalName: {
    ...typography.body,
    fontSize: 14,
    fontWeight: "700",
    color: colors.textInk,
    flex: 1,
  },
  primaryBadge: {
    backgroundColor: colors.successGreenPastel,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  primaryBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.successGreen,
  },
  hospitalMeta: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  emptyHospitalText: {
    ...typography.body,
    fontSize: 13,
    color: colors.textFaint,
  },
  geoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.successGreenPastel,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
  },
  geoText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: "700",
    color: colors.successGreen,
  },
  logVisitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.navy,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    ...shadows.soft,
  },
  logVisitText: {
    ...typography.button,
    fontSize: 15,
    fontWeight: "800",
    color: colors.surface,
  },
});
