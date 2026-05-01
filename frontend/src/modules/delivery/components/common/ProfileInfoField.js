import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { appTheme } from "../../../../theme";

export default function ProfileInfoField({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{String(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: appTheme.spacing.md,
  },
  label: {
    color: appTheme.colors.textMuted,
  },
  value: {
    color: appTheme.colors.text,
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
  },
});
