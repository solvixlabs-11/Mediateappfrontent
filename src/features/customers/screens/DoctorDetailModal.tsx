import React from "react";
import {
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DoctorDto } from "../api/customersApi";
import { colors, radii, spacing, typography } from "../../../shared/theme/tokens";

interface DoctorDetailModalProps {
  doctor: DoctorDto | null;
  visible: boolean;
  onClose: () => void;
  onLogVisitPress?: (doctor: DoctorDto) => void;
}

export function DoctorDetailModal({
  doctor,
  visible,
  onClose,
  onLogVisitPress,
}: DoctorDetailModalProps) {
  if (!doctor) return null;

  const handleCall = () => {
    if (doctor.phone) {
      Linking.openURL(`tel:${doctor.phone}`);
    }
  };

  const handleEmail = () => {
    if (doctor.email) {
      Linking.openURL(`mailto:${doctor.email}`);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color={colors.navy} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Doctor Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Main Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={36} color={colors.primary} />
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
                <Text style={styles.categoryText}>Category {doctor.category}</Text>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.actionRow}>
              {doctor.phone ? (
                <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
                  <Ionicons name="call" size={18} color={colors.primary} />
                  <Text style={styles.actionBtnText}>Call</Text>
                </TouchableOpacity>
              ) : null}

              {doctor.email ? (
                <TouchableOpacity style={styles.actionBtn} onPress={handleEmail}>
                  <Ionicons name="mail" size={18} color={colors.secondary} />
                  <Text style={[styles.actionBtnText, { color: colors.secondary }]}>Email</Text>
                </TouchableOpacity>
              ) : null}

              {doctor.latitude && doctor.longitude ? (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() =>
                    Linking.openURL(
                      `https://www.google.com/maps/search/?api=1&query=${doctor.latitude},${doctor.longitude}`
                    )
                  }
                >
                  <Ionicons name="navigate" size={18} color={colors.navy} />
                  <Text style={[styles.actionBtnText, { color: colors.navy }]}>Navigate</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact & Clinic</Text>
            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.detailText}>{doctor.phone || "Not specified"}</Text>
            </View>
            {doctor.email ? (
              <View style={styles.detailRow}>
                <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.detailText}>{doctor.email}</Text>
              </View>
            ) : null}
            {doctor.clinic_name ? (
              <View style={styles.detailRow}>
                <Ionicons name="medkit-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.detailText}>{doctor.clinic_name}</Text>
              </View>
            ) : null}
            {doctor.address ? (
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.detailText}>{doctor.address}</Text>
              </View>
            ) : null}
          </View>

          {/* Mapped Hospitals */}
          <View style={styles.section}>
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

          {/* Geofence info */}
          {doctor.latitude && doctor.longitude ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Geofence Location</Text>
              <View style={styles.geoBox}>
                <Ionicons name="shield-checkmark" size={18} color={colors.secondary} />
                <Text style={styles.geoText}>
                  Coordinates: {doctor.latitude.toFixed(6)}° N, {doctor.longitude.toFixed(6)}° E
                </Text>
              </View>
            </View>
          ) : null}
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
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.lightPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  doctorName: {
    ...typography.title,
    fontSize: 20,
    color: colors.navy,
    textAlign: "center",
  },
  qualification: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  specBadge: {
    backgroundColor: colors.lightPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  specText: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.primary,
  },
  categoryBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  categoryText: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.navy,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  actionBtnText: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.primary,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.navy,
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  detailText: {
    ...typography.body,
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  hospitalCard: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hospitalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hospitalName: {
    ...typography.body,
    fontWeight: "600",
    color: colors.navy,
  },
  primaryBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  primaryBadgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
  hospitalMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyHospitalText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  geoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: "#DEF7EC",
    padding: spacing.sm,
    borderRadius: radii.md,
  },
  geoText: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: "600",
  },
});
