import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { appTheme } from "../../theme";

export default function FilterChip({ label, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.selectedChip]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 10,
    borderRadius: appTheme.radius.pill,
    backgroundColor: appTheme.colors.chipBg,
    marginRight: appTheme.spacing.sm,
    marginBottom: appTheme.spacing.sm,
  },
  selectedChip: {
    backgroundColor: appTheme.colors.primary,
  },
  label: {
    color: appTheme.colors.primary,
    fontWeight: "600",
  },
  selectedLabel: {
    color: "#FFFFFF",
  },
});
