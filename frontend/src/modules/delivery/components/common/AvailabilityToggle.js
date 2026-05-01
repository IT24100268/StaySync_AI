import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { appTheme } from "../../../../theme";

export default function AvailabilityToggle({ value, onChange }) {
  return (
    <Pressable style={styles.wrapper} onPress={() => onChange(!value)}>
      <View style={[styles.track, value && styles.trackActive]}>
        <View style={[styles.thumb, value && styles.thumbActive]} />
      </View>
      <Text style={styles.label}>{value ? "Online" : "Offline"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: appTheme.spacing.sm,
  },
  track: {
    width: 52,
    height: 30,
    borderRadius: 16,
    backgroundColor: appTheme.colors.border,
    padding: 4,
  },
  trackActive: {
    backgroundColor: "#1E7A57",
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
  },
  thumbActive: {
    alignSelf: "flex-end",
  },
  label: {
    color: appTheme.colors.text,
    fontWeight: "700",
  },
});
