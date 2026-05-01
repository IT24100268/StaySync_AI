import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { appTheme } from "../../theme";

export default function SectionHeader({ title, subtitle, rightElement }) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightElement}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: appTheme.spacing.md,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: appTheme.colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: appTheme.colors.textMuted,
  },
});
