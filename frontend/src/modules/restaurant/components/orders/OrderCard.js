import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { appTheme } from "../../../../theme";
import { formatCurrency } from "../../../../utils/format";
import StatusBadge from "../cards/StatusBadge";

export default function OrderCard({ order, onPress, children }) {
  const isTakeaway = order.orderType === "takeaway";

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.topRow}>
        <View style={styles.copy}>
          <Text style={styles.id}>Order #{order.id}</Text>
          <Text style={styles.name}>{order.customerName}</Text>
          <Text style={styles.meta}>
            {isTakeaway ? order.pickupAddress || "Take Away" : order.deliveryAddress}
          </Text>
        </View>
        <StatusBadge status={order.status} />
      </View>
      <Text style={styles.meta}>
        {order.items.length} items - {formatCurrency(order.total)} - {isTakeaway ? "Take Away" : order.paymentMethod}
      </Text>
      <Text style={styles.meta}>Placed: {new Date(order.createdAt).toLocaleString()}</Text>
      {children}
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
  id: {
    color: appTheme.colors.textMuted,
    fontSize: 12,
  },
  name: {
    fontSize: 17,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  meta: {
    color: appTheme.colors.textMuted,
    lineHeight: 20,
  },
});
