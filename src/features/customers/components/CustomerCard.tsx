import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, radii, shadows, spacing, typography } from "../../../theme";

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
  const getIconMeta = () => {
    switch (data.type) {
      case "DOCTOR":
        return { name: "user" as const, color: colors.brandBlue, bg: colors.bluePastel };
      case "CHEMIST":
        return { name: "shopping-bag" as const, color: colors.teal, bg: colors.tealPastel };
      case "HOSPITAL":
        return { name: "plus-square" as const, color: colors.purple, bg: colors.purplePastel };
      case "STOCKIST":
        return { name: "package" as const, color: colors.orange, bg: colors.orangePastel };
      default:
        return { name: "user" as const, color: colors.brandBlue, bg: colors.bluePastel };
    }
  };

  const iconMeta = getIconMeta();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
      disabled={!onPress}
    >
      <View style={styles.topRow}>
        <View style={styles.iconAndTitle}>
          <View style={[styles.avatar, { backgroundColor: iconMeta.bg }]}>
            <Feather name={iconMeta.name} size={18} color={iconMeta.color} />
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
            <Feather
              name={data.inGeofence ? "check-circle" : "alert-circle"}
              size={12}
              color={data.inGeofence ? colors.teal : colors.accentRed}
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
          <Feather name="map-pin" size={13} color={colors.textFaint} />
          <Text style={styles.infoText} numberOfLines={1}>
            {data.address}
          </Text>
        </View>
      ) : null}

      {/* Footer: Phone / Code */}
      <View style={styles.footerRow}>
        <View style={styles.codePill}>
          <Text style={styles.codeText}>{data.code || `#${data.id}`}</Text>
        </View>

        {data.phone ? (
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => onCallPress && onCallPress(data.phone!)}
            activeOpacity={0.7}
          >
            <Feather name="phone" size={13} color={colors.brandBlue} />
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
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
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
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  nameBlock: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textInk,
  },
  subheading: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textMuted,
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.bluePastel,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.brandBlue,
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  geofenceIn: {
    backgroundColor: colors.tealPastel,
  },
  geofenceOut: {
    backgroundColor: "#FEE2E2",
  },
  geofenceText: {
    fontSize: 11,
    fontWeight: "700",
  },
  geofenceInText: {
    color: colors.teal,
  },
  geofenceOutText: {
    color: colors.accentRed,
  },
  distanceText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  infoText: {
    fontSize: 12,
    color: colors.textMuted,
    flex: 1,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.inputBackground,
  },
  codePill: {
    backgroundColor: colors.inputBackground,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  codeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textFaint,
    letterSpacing: 0.5,
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.bluePastel,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.md,
  },
  callText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.brandBlue,
  },
  extraText: {
    fontSize: 11,
    color: colors.textFaint,
  },
});
