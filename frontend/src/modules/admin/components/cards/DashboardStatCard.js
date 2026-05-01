import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { appTheme } from "../../../../theme";

export default function DashboardStatCard({ label, value, icon, accentColor = appTheme.colors.primaryDark }) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: `${accentColor}14` }]}>
        <Ionicons name={icon} size={22} color={accentColor} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: "47%",
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.sm,
    ...appTheme.shadow,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontSize: 24,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  label: {
    fontSize: 13,
    color: appTheme.colors.textMuted,
    lineHeight: 19,
  },
});
