import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TextInput, View } from "react-native";
import { appTheme } from "../../../../theme";

export default function SearchBar({ value, onChangeText, placeholder = "Search" }) {
  return (
    <View style={styles.container}>
      <Ionicons name="search-outline" size={18} color={appTheme.colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={appTheme.colors.textMuted}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: appTheme.spacing.sm,
    minHeight: 52,
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    paddingHorizontal: appTheme.spacing.md,
  },
  input: {
    flex: 1,
    color: appTheme.colors.text,
    fontSize: 15,
  },
});
