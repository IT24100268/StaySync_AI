import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { appTheme } from "../../../../theme";

export default function FilterTabs({ options, value, onChange }) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            style={[styles.tab, selected && styles.selectedTab]}
            onPress={() => onChange(option)}
          >
            <Text style={[styles.label, selected && styles.selectedLabel]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: appTheme.spacing.sm,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: appTheme.colors.surface,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  selectedTab: {
    backgroundColor: appTheme.colors.primaryDark,
    borderColor: appTheme.colors.primaryDark,
  },
  label: {
    color: appTheme.colors.text,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  selectedLabel: {
    color: "#FFFFFF",
  },
});
