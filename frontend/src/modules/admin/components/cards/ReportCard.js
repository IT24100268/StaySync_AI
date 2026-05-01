import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { appTheme } from "../../../../theme";
import StatusBadge from "./StatusBadge";

export default function ReportCard({ item, onPress }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={styles.type}>{item.type}</Text>
          <Text style={styles.title}>{item.title}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>
      <Text style={styles.description}>{item.shortDescription || item.description}</Text>
      <Text style={styles.meta}>Created: {item.createdAt}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.sm,
    ...appTheme.shadow,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: appTheme.spacing.md,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  type: {
    color: appTheme.colors.primaryDark,
    fontWeight: "700",
    fontSize: 12,
    textTransform: "uppercase",
  },
  title: {
    color: appTheme.colors.text,
    fontWeight: "800",
    fontSize: 18,
  },
  description: {
    color: appTheme.colors.textMuted,
    lineHeight: 21,
  },
  meta: {
    color: appTheme.colors.text,
    fontWeight: "600",
  },
});
