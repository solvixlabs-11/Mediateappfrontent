import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing, typography } from "../../../shared/theme/tokens";

export interface CustomerCardData {
  id: number;
  type: "DOCTOR" | "CHEMIST" | "HOSPITAL" | "STOCKIST";
  code?: string;
  name: string;
  subheading?: string | null;
  badgeLabel?: string | null;
  address?: string | null;
  phone?: string | null;
  distanceMeters?: number | null;
  inGeofence?: boolean | null;
  extraInfo?: string | null;
}

interface CustomerCardProps {
  data: CustomerCardData;
  onPress?: () => void;
  onCallPress?: (phone: string) => void;
}

export function CustomerCard({ data, onPress, onCallPress }: CustomerCardProps) {
  const getIconName = () => {
    switch (data.type) {
      case "DOCTOR":
        return "person";
      case "CHEMIST":
        return "flask";
      case "HOSPITAL":
        return "business";
      case "STOCKIST":
        return "cube";
      default:
        return "medkit";
    }
  };

  const getTypeColor = () => {
    switch (data.type) {
      case "DOCTOR":
        return colors.primary;
      case "CHEMIST":
        return colors.secondary;
      case "HOSPITAL":
        return colors.navy;
      case "STOCKIST":
        return "#D97706";
      default:
        return colors.primary;
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.topRow}>
        <View style={styles.iconAndTitle}>
          <View style={[styles.avatar, { backgroundColor: `${getTypeColor()}15` }]}>
            <Ionicons name={getIconName()} size={20} color={getTypeColor()} />
          </View>
          <View style={styles.nameBlock}>
            <Text style={styles.name} numberOfLines={1}>
              {data.name}
            </Text>
            {data.subheading ? (
              <Text style={styles.subheading} numberOfLines={1}>
                {data.subheading}
              </Text>
            ) : null}
          </View>
        </View>

        {data.badgeLabel ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{data.badgeLabel}</Text>
          </View>
        ) : null}
      </View>

      {/* Geofence & Distance Banner if present */}
      {data.distanceMeters !== undefined && data.distanceMeters !== null && (
        <View style={styles.distanceRow}>
          <View
            style={[
              styles.geofenceChip,
              data.inGeofence ? styles.geofenceIn : styles.geofenceOut,
            ]}
          >
            <Ionicons
              name={data.inGeofence ? "checkmark-circle" : "alert-circle"}
              size={12}
              color={data.inGeofence ? colors.secondary : colors.error}
            />
            <Text
              style={[
                styles.geofenceText,
                data.inGeofence ? styles.geofenceInText : styles.geofenceOutText,
              ]}
            >
              {data.inGeofence ? "Inside Geofence" : "Outside Geofence"}
            </Text>
          </View>

          <Text style={styles.distanceText}>
            {data.distanceMeters < 1000
              ? `${Math.round(data.distanceMeters)}m away`
              : `${(data.distanceMeters / 1000).toFixed(1)}km away`}
          </Text>
        </View>
      )}

      {/* Address & Meta */}
      {data.address ? (
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.infoText} numberOfLines={1}>
            {data.address}
          </Text>
        </View>
      ) : null}

      {/* Footer: Phone / Code */}
      <View style={styles.footerRow}>
        <Text style={styles.codeText}>{data.code || `#${data.id}`}</Text>

        {data.phone ? (
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => onCallPress && onCallPress(data.phone!)}
            activeOpacity={0.6}
          >
            <Ionicons name="call" size={12} color={colors.primary} />
            <Text style={styles.callText}>{data.phone}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.extraText}>{data.extraInfo || ""}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  iconAndTitle: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: spacing.sm,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  nameBlock: {
    flex: 1,
  },
  name: {
    ...typography.subheading,
    fontSize: 15,
    color: colors.navy,
  },
  subheading: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  badge: {
    backgroundColor: colors.lightPrimary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  badgeText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: "600",
    color: colors.primary,
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  geofenceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  geofenceIn: {
    backgroundColor: "#DEF7EC",
  },
  geofenceOut: {
    backgroundColor: "#FDE8E8",
  },
  geofenceText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: "600",
  },
  geofenceInText: {
    color: colors.secondary,
  },
  geofenceOutText: {
    color: colors.error,
  },
  distanceText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing.xs + 2,
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  codeText: {
    ...typography.caption,
    color: colors.grey,
    fontWeight: "600",
    fontSize: 11,
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.lightPrimary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  callText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
    fontSize: 11,
  },
  extraText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
});
