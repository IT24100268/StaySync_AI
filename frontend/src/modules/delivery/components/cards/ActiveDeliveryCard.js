import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { appTheme } from "../../../../theme";
import StatusBadge from "./StatusBadge";
import AppButton from "../../../../components/common/AppButton";

export default function ActiveDeliveryCard({ delivery, onOpen, onNavigate }) {
  if (!delivery) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.title}>Current Delivery</Text>
        <StatusBadge status={delivery.status} />
      </View>
      <Text style={styles.meta}>{delivery.restaurantName}</Text>
      <Text style={styles.meta}>Pickup: {delivery.pickupAddress}</Text>
      <Text style={styles.meta}>Customer: {delivery.customerName}</Text>
      <Text style={styles.meta}>Drop: {delivery.deliveryAddress}</Text>
      <View style={styles.actions}>
        <AppButton title="Open Details" onPress={onOpen} />
        <AppButton title="Navigation" variant="secondary" onPress={onNavigate} />
      </View>
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
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: appTheme.spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  meta: {
    color: appTheme.colors.textMuted,
    lineHeight: 20,
  },
  actions: {
    gap: appTheme.spacing.sm,
  },
});
