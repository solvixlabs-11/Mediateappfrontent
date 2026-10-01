import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing, typography } from "../../../shared/theme/tokens";

interface LocationCardProps {
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  onLocationCaptured: (coords: { latitude: number; longitude: number; accuracy?: number }) => void;
  geofenceRadiusMeters?: number;
}

export function LocationCard({
  latitude,
  longitude,
  accuracy,
  onLocationCaptured,
  geofenceRadiusMeters = 200,
}: LocationCardProps) {
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCapture = async () => {
    setIsCapturing(true);
    // Simulates reading device GPS with real coordinates
    setTimeout(() => {
      // If we don't have existing coords, provide realistic Mumbai/Delhi HQ coordinates
      const capturedLat = latitude || 19.0760;
      const capturedLon = longitude || 72.8777;
      onLocationCaptured({
        latitude: Number(capturedLat.toFixed(6)),
        longitude: Number(capturedLon.toFixed(6)),
        accuracy: 12.5,
      });
      setIsCapturing(false);
    }, 600);
  };

  const hasCoords = latitude !== undefined && latitude !== null && longitude !== undefined && longitude !== null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Ionicons
            name="location"
            size={20}
            color={hasCoords ? colors.primary : colors.textSecondary}
          />
          <Text style={styles.title}>GPS Coordinates & Geofence</Text>
        </View>
        <View style={styles.radiusBadge}>
          <Text style={styles.radiusText}>Radius: {geofenceRadiusMeters}m</Text>
        </View>
      </View>

      <View style={styles.body}>
        {hasCoords ? (
          <View style={styles.coordsContainer}>
            <View style={styles.coordBox}>
              <Text style={styles.coordLabel}>Latitude</Text>
              <Text style={styles.coordValue}>{latitude.toFixed(6)}° N</Text>
            </View>
            <View style={styles.coordBox}>
              <Text style={styles.coordLabel}>Longitude</Text>
              <Text style={styles.coordValue}>{longitude.toFixed(6)}° E</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.emptyText}>
            No GPS coordinates recorded yet. Click below to tag current position.
          </Text>
        )}

        {accuracy !== undefined && accuracy !== null && (
          <View style={styles.accuracyRow}>
            <Ionicons name="checkmark-done" size={14} color={colors.secondary} />
            <Text style={styles.accuracyText}>
              Estimated accuracy: ~{accuracy.toFixed(1)} meters
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.captureButton, hasCoords && styles.recaptureButton]}
          onPress={handleCapture}
          disabled={isCapturing}
          activeOpacity={0.8}
        >
          {isCapturing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons
                name={hasCoords ? "refresh" : "navigate"}
                size={16}
                color="#fff"
              />
              <Text style={styles.captureButtonText}>
                {hasCoords ? "Update Current Location" : "Capture GPS Tag"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  title: {
    ...typography.subheading,
    fontSize: 14,
    color: colors.navy,
  },
  radiusBadge: {
    backgroundColor: colors.lightPrimary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  radiusText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: "600",
    color: colors.primary,
  },
  body: {
    marginTop: spacing.xs,
  },
  coordsContainer: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  coordBox: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  coordLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  coordValue: {
    ...typography.body,
    fontWeight: "600",
    color: colors.navy,
  },
  emptyText: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  accuracyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: spacing.sm,
  },
  accuracyText: {
    ...typography.caption,
    color: colors.secondary,
  },
  captureButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  recaptureButton: {
    backgroundColor: colors.navy,
  },
  captureButtonText: {
    ...typography.button,
    color: "#fff",
    fontSize: 13,
  },
});
