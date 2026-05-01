import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { appTheme } from "../../../../theme";

const toneMap = {
  Pending: { backgroundColor: "#FFF4DF", color: appTheme.colors.warning },
  Approved: { backgroundColor: "#E7F8EF", color: appTheme.colors.success },
  Rejected: { backgroundColor: "#FCE9E9", color: appTheme.colors.danger },
  Blocked: { backgroundColor: "#FCE9E9", color: appTheme.colors.danger },
  Active: { backgroundColor: "#E8F2FF", color: appTheme.colors.info },
  "In Review": { backgroundColor: "#FFF4DF", color: appTheme.colors.warning },
  Open: { backgroundColor: "#FCE9E9", color: appTheme.colors.danger },
  Resolved: { backgroundColor: "#E7F8EF", color: appTheme.colors.success },
  Rejected: { backgroundColor: "#F6ECEC", color: appTheme.colors.danger },
  Ongoing: { backgroundColor: "#E8F2FF", color: appTheme.colors.info },
  Failed: { backgroundColor: "#FCE9E9", color: appTheme.colors.danger },
  "Under Review": { backgroundColor: "#FFF4DF", color: appTheme.colors.warning },
  None: { backgroundColor: "#EEF4F8", color: appTheme.colors.textMuted },
};

export default function StatusBadge({ status }) {
  const tone = toneMap[status] || {
    backgroundColor: appTheme.colors.chipBg,
    color: appTheme.colors.primaryDark,
  };

  return (
    <View style={[styles.badge, { backgroundColor: tone.backgroundColor }]}>
      <Text style={[styles.label, { color: tone.color }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
  },
});
