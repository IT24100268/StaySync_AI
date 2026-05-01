import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { appTheme } from "../../../../theme";

const statusStyles = {
  Available: ["#E8F4FF", "#2A7BE4"],
  Accepted: ["#E8F4F7", "#0B5D7A"],
  "Picked Up": ["#FFF6D8", "#D9922B"],
  "On The Way": ["#E8F8F0", "#1B9C62"],
  Delivered: ["#E8F8F0", "#1B9C62"],
};

export default function StatusBadge({ status }) {
  const [backgroundColor, color] = statusStyles[status] || [appTheme.colors.chipBg, appTheme.colors.primaryDark];

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.label, { color }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: appTheme.radius.pill,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
  },
});
