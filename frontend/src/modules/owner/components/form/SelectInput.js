import React from "react";
import { StyleSheet, Text, View } from "react-native";
import FilterChip from "../../../../components/common/FilterChip";
import { appTheme } from "../../../../theme";

export default function SelectInput({
  label,
  value,
  onChange,
  options,
  error,
  multiple = false,
}) {
  function handleSelect(option) {
    if (multiple) {
      const nextValue = value.includes(option)
        ? value.filter((item) => item !== option)
        : [...value, option];
      onChange(nextValue);
      return;
    }

    onChange(value === option ? "" : option);
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((option) => (
          <FilterChip
            key={option}
            label={option}
            selected={multiple ? value.includes(option) : value === option}
            onPress={() => handleSelect(option)}
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
