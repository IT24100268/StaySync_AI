import React from "react";
import { StyleSheet, Text, View } from "react-native";
import FilterChip from "../../../../components/common/FilterChip";
import { appTheme } from "../../../../theme";

export default function SelectInput({ label, value, options, onChange, error }) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((option) => (
          <FilterChip
            key={option}
            label={option}
            selected={value === option}
            onPress={() => onChange(value === option ? "" : option)}
          />
        ))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: appTheme.spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: appTheme.colors.text,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  error: {
    color: appTheme.colors.danger,
    fontSize: 12,
  },
});
