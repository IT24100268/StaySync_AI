import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../../../theme";

export default function DashboardStatCard({ label, value, icon, accentColor = "#1E7A57" }) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: `${accentColor}14` }]}>
        <Ionicons name={icon} size={20} color={accentColor} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.md,
    gap: appTheme.spacing.sm,
    ...appTheme.shadow,
  },
  iconWrap: {
    width: 40,
    height: 40,
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
    color: appTheme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
