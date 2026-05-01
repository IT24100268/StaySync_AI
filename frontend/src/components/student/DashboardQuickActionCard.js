import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../theme";

export default function DashboardQuickActionCard({ icon, title, subtitle, onPress, accentColor }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={[styles.iconWrap, { backgroundColor: accentColor || appTheme.colors.chipBg }]}>
        <Ionicons name={icon} size={20} color={appTheme.colors.primaryDark} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.md,
    gap: appTheme.spacing.sm,
    borderWidth: 1,
    borderColor: "#E6EEF4",
    ...appTheme.shadow,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: appTheme.colors.textMuted,
  },
});
