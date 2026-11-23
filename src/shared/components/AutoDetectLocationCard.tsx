import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing, typography } from "../theme/tokens";
import { getCurrentGeoLocation, GeoLocationResult } from "../utils/location";

export interface AutoDetectLocationCardProps {
  onLocationDetected: (data: GeoLocationResult) => void;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  detectedAddress?: string | null;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  autoFillHint?: string;
}

export function AutoDetectLocationCard({
  onLocationDetected,
  latitude,
  longitude,
  accuracy,
  detectedAddress,
  title = "Auto-Detect Location (GPS)",
  subtitle = "Detect current GPS coordinates & auto-fill address details",
  buttonLabel = "Auto-Detect Location",
  autoFillHint = "Auto-fills Address, Area, City, State & Pincode",
}: AutoDetectLocationCardProps) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastAccuracy, setLastAccuracy] = useState<number | null>(accuracy ?? null);
  const [addressPreview, setAddressPreview] = useState<string | null>(detectedAddress ?? null);

  const hasCoords =
    latitude !== undefined &&
    latitude !== null &&
    longitude !== undefined &&
    longitude !== null &&
    latitude !== 0 &&
    longitude !== 0;

  const handleDetect = async () => {
    setIsDetecting(true);
    try {
      const geo = await getCurrentGeoLocation();
      setLastAccuracy(geo.accuracy);
      setAddressPreview(geo.address);
      onLocationDetected(geo);

      Alert.alert(
        "Location Captured",
        `GPS location detected successfully!\n\n📍 ${geo.address || `${geo.latitude.toFixed(4)}, ${geo.longitude.toFixed(4)}`}\n\nAddress fields have been auto-filled.`,
        [{ text: "OK" }]
      );
    } catch (err: any) {
      console.warn("Location detection error:", err);
      Alert.alert(
        "Location Warning",
        "Could not acquire high-precision GPS. Applied default HQ location coordinates."
      );
    } finally {
      setIsDetecting(false);
    }
  };

  const handleOpenMaps = () => {
    if (!latitude || !longitude) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url).catch((err) => {
      console.warn("Failed to open maps url:", err);
    });
  };

  return (
    <View style={[styles.card, hasCoords && styles.cardActive]}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrapper}>
          <View style={[styles.iconCircle, hasCoords && styles.iconCircleActive]}>
            <Ionicons
              name={hasCoords ? "location" : "location-outline"}
              size={18}
              color={hasCoords ? colors.success : colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardSubtitle}>{subtitle}</Text>
          </View>
        </View>

        {hasCoords && (
          <View style={styles.verifiedTag}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={styles.verifiedTagText}>Captured</Text>
          </View>
        )}
      </View>

      {/* Detected Details Box */}
      {hasCoords ? (
        <View style={styles.detailsContainer}>
          <View style={styles.coordsRow}>
            <View style={styles.coordPill}>
              <Text style={styles.coordLabel}>LAT:</Text>
              <Text style={styles.coordValue}>{latitude.toFixed(6)}°</Text>
            </View>
            <View style={styles.coordPill}>
              <Text style={styles.coordLabel}>LNG:</Text>
              <Text style={styles.coordValue}>{longitude.toFixed(6)}°</Text>
            </View>
            {lastAccuracy !== null && (
              <View style={styles.accuracyPill}>
                <Text style={styles.accuracyText}>±{Math.round(lastAccuracy)}m</Text>
              </View>
            )}
          </View>

          {addressPreview ? (
            <View style={styles.addressPreviewBox}>
              <Ionicons name="navigate-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.addressPreviewText} numberOfLines={2}>
                {addressPreview}
              </Text>
            </View>
          ) : null}

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.reDetectBtn}
              onPress={handleDetect}
              disabled={isDetecting}
              activeOpacity={0.7}
            >
              {isDetecting ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Ionicons name="refresh" size={14} color={colors.primary} />
                  <Text style={styles.reDetectBtnText}>Re-detect</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mapsBtn}
              onPress={handleOpenMaps}
              activeOpacity={0.7}
            >
              <Ionicons name="map-outline" size={14} color="#FFFFFF" />
              <Text style={styles.mapsBtnText}>View on Maps</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* Empty / Not Captured State */
        <View style={styles.emptyContainer}>
          <Text style={styles.hintText}>
            💡 {autoFillHint}
          </Text>

          <TouchableOpacity
            style={styles.detectButton}
            onPress={handleDetect}
            disabled={isDetecting}
            activeOpacity={0.8}
          >
            {isDetecting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="navigate" size={16} color="#FFFFFF" />
                <Text style={styles.detectButtonText}>{buttonLabel}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.halkaBlue,
    borderColor: colors.halkaBlueBorder,
    borderWidth: 1.5,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardActive: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  titleWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.halkaBlueBorder,
  },
  iconCircleActive: {
    borderColor: "#BBF7D0",
    backgroundColor: "#DCFCE7",
  },
  cardTitle: {
    ...typography.subheading,
    fontSize: 14,
    fontWeight: "700",
    color: colors.navy,
  },
  cardSubtitle: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  verifiedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  verifiedTagText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: "600",
    color: colors.success,
  },
  emptyContainer: {
    marginTop: spacing.xs,
  },
  hintText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.navy,
    marginBottom: spacing.sm,
    fontStyle: "italic",
  },
  detectButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  detectButtonText: {
    ...typography.body,
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  detailsContainer: {
    marginTop: spacing.xs,
  },
  coordsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexWrap: "wrap",
    marginBottom: spacing.xs,
  },
  coordPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  coordLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  coordValue: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: "700",
    color: colors.navy,
  },
  accuracyPill: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  accuracyText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: "600",
    color: colors.success,
  },
  addressPreviewBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: spacing.sm,
  },
  addressPreviewText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  reDetectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.sm,
  },
  reDetectBtnText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  mapsBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: colors.navy,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.sm,
  },
  mapsBtnText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
