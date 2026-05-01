import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { appTheme } from "../../theme";
import { getReportStatusLabel, getReportStatusTone } from "../../constants/reports";

const TONE_STYLES = {
  info: {
    backgroundColor: "#EAF4FB",
    color: appTheme.colors.info,
  },
  warning: {
    backgroundColor: "#FFF4E5",
    color: appTheme.colors.warning,
  },
  success: {
    backgroundColor: "#EAF8F1",
    color: appTheme.colors.success,
  },
  danger: {
    backgroundColor: "#FFF1F1",
    color: appTheme.colors.danger,
  },
};

export default function ComplaintStatusBadge({ status }) {
  const tone = getReportStatusTone(status);
  const toneStyle = TONE_STYLES[tone] || TONE_STYLES.info;

  return (
    <View style={[styles.badge, { backgroundColor: toneStyle.backgroundColor }]}>
      <Text style={[styles.label, { color: toneStyle.color }]}>{getReportStatusLabel(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: appTheme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
  },
});
