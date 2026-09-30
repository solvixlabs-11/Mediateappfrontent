import React, { ReactNode } from "react";
import { SafeAreaView, StatusBar, StyleSheet, View, ViewProps } from "react-native";
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
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
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
