import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";
import { colors, radii, spacing } from "../../theme";

export interface PinDotsProps {
  length?: number;
  value: string;
  hasError?: boolean;
  style?: ViewStyle;
}

export const PinDots: React.FC<PinDotsProps> = ({
  length = 4,
  value,
  hasError = false,
  style,
}) => {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (hasError) {
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [hasError, shakeAnim]);

  const dots = Array.from({ length }, (_, i) => i);

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          transform: [{ translateX: shakeAnim }],
        },
      ]}
    >
      {dots.map((index) => {
        const isFilled = index < value.length;
        return (
          <View
            key={index}
            style={[
              styles.dot,
              isFilled ? styles.dotFilled : styles.dotEmpty,
              hasError && styles.dotError,
            ]}
          />
        );
      })}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.xl,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: radii.full,
    marginHorizontal: spacing.md,
  },
  dotEmpty: {
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "transparent",
  },
  dotFilled: {
    backgroundColor: colors.navy,
    borderWidth: 0,
  },
  dotError: {
    borderColor: colors.accentRed,
    backgroundColor: colors.accentRed,
  },
});
