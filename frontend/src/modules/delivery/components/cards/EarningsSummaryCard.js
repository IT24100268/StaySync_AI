import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { appTheme } from "../../../../theme";
import { formatCurrency } from "../../../../utils/format";

export default function EarningsSummaryCard({ earnings }) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Earnings Summary</Text>
      <Text style={styles.line}>Today: {formatCurrency(earnings.todayEarnings)}</Text>
      <Text style={styles.line}>Weekly: {formatCurrency(earnings.weeklyEarnings)}</Text>
      <Text style={styles.line}>Monthly: {formatCurrency(earnings.monthlyEarnings)}</Text>
      <Text style={styles.line}>Completed Deliveries: {earnings.completedDeliveries}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.sm,
    ...appTheme.shadow,
  },
  heading: {
    fontSize: 20,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  line: {
    color: appTheme.colors.textMuted,
    lineHeight: 21,
  },
});
