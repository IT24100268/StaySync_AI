import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { appTheme } from "../../theme";

export default function ScreenContainer({
  children,
  scrollable = true,
  contentContainerStyle,
  style,
}) {
  if (!scrollable) {
    return (
      <SafeAreaView style={[styles.safeArea, style]}>
        <View style={[styles.content, contentContainerStyle]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, contentContainerStyle]}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  content: {
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
  },
});
