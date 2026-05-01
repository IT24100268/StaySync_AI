import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../theme";

export default function RecentActivityItem({ item }) {
  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: item.tint }]}>
        <Ionicons name={item.icon} size={18} color={appTheme.colors.primaryDark} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>
      <Text style={styles.time}>{item.time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: appTheme.colors.textMuted,
    lineHeight: 18,
  },
  time: {
    fontSize: 12,
    fontWeight: "700",
    color: appTheme.colors.textMuted,
  },
});
