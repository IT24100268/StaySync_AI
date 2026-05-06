import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { appTheme } from "../../../../theme";
import { formatCurrency } from "../../../../utils/format";
import StatusBadge from "./StatusBadge";
import AppButton from "../../../../components/common/AppButton";

export default function DeliveryJobCard({ job, onPress, onAccept }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.topRow}>
        <View style={styles.copy}>
          <Text style={styles.title}>{job.restaurantName}</Text>
          <Text style={styles.meta}>Pickup: {job.pickupAddress}</Text>
          <Text style={styles.meta}>Drop: {job.deliveryAddress}</Text>
        </View>
        <StatusBadge status={job.status} />
      </View>
      <Text style={styles.meta}>Customer: {job.customerName}</Text>
      <Text style={styles.meta}>Distance: {job.distance} km</Text>
      <Text style={styles.meta}>Summary: {job.orderSummary}</Text>
      <Text style={styles.earning}>Earnings: {formatCurrency(job.estimatedEarnings)}</Text>
      {onAccept ? <AppButton title="Accept Job" onPress={onAccept} /> : null}
    </Pressable>
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
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: appTheme.spacing.md,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  meta: {
    color: appTheme.colors.textMuted,
    lineHeight: 20,
  },
  earning: {
    color: "#1E7A57",
    fontWeight: "800",
    fontSize: 15,
  },
});
