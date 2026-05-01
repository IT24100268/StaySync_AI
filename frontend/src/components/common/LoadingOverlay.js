import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { appTheme } from "../../theme";

export default function LoadingOverlay() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={appTheme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: appTheme.colors.background,
  },
});
