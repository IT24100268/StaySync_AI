import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { appTheme } from "../../../../theme";

const statusColors = {
  Pending: ["#FFF3E8", "#B9481B"],
  Accepted: ["#E8F4FF", "#2A7BE4"],
  Preparing: ["#FFF6D8", "#D9922B"],
  Ready: ["#E8F8F0", "#1B9C62"],
  "Out for Delivery": ["#E8F4F7", "#0B5D7A"],
  Rejected: ["#FDEBEC", "#D64545"],
  in_stock: ["#E8F8F0", "#1B9C62"],
  out_of_stock: ["#FDEBEC", "#D64545"],
};

export default function StatusBadge({ status }) {
  const [backgroundColor, color] = statusColors[status] || [appTheme.colors.chipBg, appTheme.colors.primaryDark];

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.label, { color }]}>{status.replaceAll("_", " ")}</Text>
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
    textTransform: "capitalize",
  },
});
