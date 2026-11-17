import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { radii, spacing } from "../../../shared/theme/tokens";

interface LoginHeroBannerProps {
  isServerOnline: boolean | null;
  onCheckHealth: () => void;
}

export const LoginHeroBanner: React.FC<LoginHeroBannerProps> = ({
  isServerOnline,
  onCheckHealth,
}) => {
  return (
    <View style={styles.heroBackground}>
      {/* Ambient decorative glowing rings */}
      <View style={styles.glowCircle1} />
      <View style={styles.glowCircle2} />

      {/* Top Bar with Server Status Pill */}
      <View style={styles.topBar}>
        <View style={styles.appTagBadge}>
          <Text style={styles.appTagText}>ENTERPRISE FIELD FORCE</Text>
        </View>

        <TouchableOpacity
          onPress={onCheckHealth}
          activeOpacity={0.8}
          style={[
            styles.statusPill,
            isServerOnline === false && styles.statusPillOffline,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              isServerOnline === true
                ? styles.statusDotOnline
                : isServerOnline === false
                ? styles.statusDotOffline
                : styles.statusDotChecking,
            ]}
          />
          <Text style={styles.statusPillText}>
            {isServerOnline === true
              ? "Live"
              : isServerOnline === false
              ? "Retry"
              : "Connecting"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Company Logo on High-Contrast Crisp White Plate with Halka Blue Depth */}
      <View style={styles.brandHero}>
        <View style={styles.logoPlate}>
          <Image
            source={require("../../../../assets/logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.heroSubtitle}>Intelligent Pharma CRM & Field Automation</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heroBackground: {
    backgroundColor: "#EBF3FC",
    paddingTop: spacing.md,
    paddingBottom: 44,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    borderBottomWidth: 1,
    borderBottomColor: "#D3E4F8",
    position: "relative",
    overflow: "hidden",
  },
  glowCircle1: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(27, 100, 218, 0.08)",
    top: -60,
    right: -40,
  },
  glowCircle2: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(37, 99, 235, 0.06)",
    bottom: -20,
    left: -20,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  appTagBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: "#CFE2F8",
  },
  appTagText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#1B64DA",
    letterSpacing: 0.8,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: "#CFE2F8",
  },
  statusPillOffline: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FECACA",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusDotOnline: {
    backgroundColor: "#16A34A",
  },
  statusDotOffline: {
    backgroundColor: "#DC2626",
  },
  statusDotChecking: {
    backgroundColor: "#F59E0B",
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#1E293B",
  },
  brandHero: {
    alignItems: "center",
    marginTop: spacing.xs,
  },
  logoPlate: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: "92%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#D9E9FA",
    shadowColor: "#1B64DA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  logoImage: {
    width: "100%",
    height: 56,
  },
  heroSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E3A8A",
    marginTop: 10,
    letterSpacing: 0.2,
  },
});

