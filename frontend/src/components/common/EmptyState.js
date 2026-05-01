import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../theme";

export default function EmptyState({ title, description, icon = "folder-open-outline" }) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={34} color={appTheme.colors.primary} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.xl,
    alignItems: "center",
    gap: appTheme.spacing.sm,
    ...appTheme.shadow,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: appTheme.colors.text,
  },
  description: {
    fontSize: 14,
    color: appTheme.colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});
