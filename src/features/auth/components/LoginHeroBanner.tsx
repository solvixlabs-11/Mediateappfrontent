import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radii, spacing, typography } from "../../../theme";

export interface LoginHeroBannerProps {
  isServerOnline?: boolean | null;
  onCheckHealth?: () => void;
}

export const LoginHeroBanner: React.FC<LoginHeroBannerProps> = () => {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top + 20, 52);

  return (
    <LinearGradient
      colors={["#27339A", "#1B2470"]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={[styles.heroContainer, { paddingTop: topPadding }]}
    >
      {/* Soft translucent ambient decorative circles matching PDF */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      {/* White rounded card with Mediate logo */}
      <View style={styles.logoCard}>
        <Image
          source={require("../../../../assets/logo.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      {/* Headline & Subtitle */}
      <View style={styles.textContainer}>
        <Text style={styles.headline}>Field work,{"\n"}made simple.</Text>
        <Text style={styles.subtitle}>
          Visits, reports and tours in one place.
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  heroContainer: {
    paddingHorizontal: 24,
    paddingBottom: 54,
    position: "relative",
    overflow: "hidden",
  },
  circle1: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    top: -40,
    right: -60,
  },
  circle2: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    bottom: 20,
    left: -50,
  },
  logoCard: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 16,
    alignSelf: "flex-start",
    marginTop: 4,
    marginBottom: 20,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  logoImage: {
    width: 136,
    height: 36,
  },
  textContainer: {
    marginTop: 2,
  },
  headline: {
    fontFamily: typography.titleLarge.fontFamily,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    color: colors.surface,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14.5,
    lineHeight: 21,
    color: "rgba(255, 255, 255, 0.82)",
    marginTop: 6,
  },
});
