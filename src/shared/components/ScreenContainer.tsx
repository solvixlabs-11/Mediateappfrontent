import React, { ReactNode } from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../theme/tokens";

export interface ScreenContainerProps extends ViewProps {
  children: ReactNode;
  scrollable?: boolean;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  style,
  ...rest
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={[styles.container, style]} {...rest}>
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});
