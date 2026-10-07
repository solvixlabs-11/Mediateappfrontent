import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors } from "../../../shared/theme/tokens";

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const barWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Phase 1: Logo fades in and scales up (0 → 800ms)
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Phase 2: Tagline fades in (600ms → 1200ms)
    setTimeout(() => {
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 600);

    // Phase 3: Loading bar fills up (800ms → 2800ms)
    setTimeout(() => {
      Animated.timing(barWidth, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
      }).start();
    }, 800);

    // Phase 4: Done after 3 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Logo - Simple, full width */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image
          source={require("../../../../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Intelligent Pharma CRM & Field Automation
      </Animated.Text>

      {/* Simple Loading Bar */}
      <View style={styles.loadingBarContainer}>
        <Animated.View
          style={[
            styles.loadingBar,
            {
              width: barWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>

      {/* Bottom Branding */}
      <View style={styles.bottomBranding}>
        <Text style={styles.bottomText}>
          © 2026 Mediate Healthcare Pvt. Ltd.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    width: "75%",
    alignItems: "center",
  },
  logo: {
    width: "100%",
    height: 100,
  },
  tagline: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
    marginTop: 12,
    letterSpacing: 0.2,
  },
  loadingBarContainer: {
    width: 180,
    height: 3,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    marginTop: 32,
    overflow: "hidden",
  },
  loadingBar: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  bottomBranding: {
    position: "absolute",
    bottom: 40,
    alignItems: "center",
  },
  bottomText: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "400",
  },
});
