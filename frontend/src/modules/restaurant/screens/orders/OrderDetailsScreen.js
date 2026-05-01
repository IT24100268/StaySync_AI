import React from "react";
import { StyleSheet, Text, View } from "react-native";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import EmptyState from "../../../../components/common/EmptyState";
import StatusTimeline from "../../../../components/orders/StatusTimeline";
import { useOrders } from "../../context/OrderContext";
import { appTheme } from "../../../../theme";
import { formatCurrency } from "../../../../utils/format";

function getTimelineStatus(orderStatus, isTakeaway) {
  if (isTakeaway) {
    switch (orderStatus) {
      case "Pending":
        return "Placed";
      case "Accepted":
        return "Preparing";
      case "Preparing":
        return "Preparing";
      case "Ready":
        return "Ready";
      case "Delivered":
        return "Delivered";
      case "Rejected":
        return "Placed";
      default:
        return "Placed";
    }
  }

  switch (orderStatus) {
    case "Pending":
      return "Placed";
    case "Accepted":
      return "Preparing";
    case "Preparing":
      return "Preparing";
    case "Ready":
      return "Out for Delivery";
    case "Out for Delivery":
      return "Out for Delivery";
    case "Delivered":
      return "Delivered";
    case "Rejected":
      return "Placed";
    default:
      return "Placed";
  }
}

export default function OrderDetailsScreen({ route }) {
  const { orderId } = route.params || {};
  const { orders } = useOrders();
  const order = orders.find((entry) => entry.id === orderId);
  const isTakeaway = order?.orderType === "takeaway";
  const timelineStatuses = isTakeaway
    ? ["Placed", "Preparing", "Ready", "Delivered"]
    : ["Placed", "Preparing", "Out for Delivery", "Delivered"];

  if (!order) {
    return (
      <ScreenContainer>
        <EmptyState title="Order unavailable" description="The selected order could not be found." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.card}>
        <Text style={styles.heading}>Customer</Text>
        <Text style={styles.text}>{order.customerName}</Text>
        <Text style={styles.text}>{order.customerPhone}</Text>
        <Text style={styles.text}>
          {isTakeaway ? order.pickupAddress || order.restaurantName : order.deliveryAddress}
        </Text>
        <Text style={styles.text}>Order type: {isTakeaway ? "Take Away" : "Delivery"}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.heading}>Order Items</Text>
        {order.items.map((item) => (
          <View key={item.id} style={styles.row}>
            <Text style={styles.text}>{item.name} x {item.qty}</Text>
            <Text style={styles.text}>{formatCurrency(item.subtotal)}</Text>
          </View>
        ))}
        <View style={styles.row}>
          <Text style={styles.text}>Subtotal</Text>
          <Text style={styles.text}>{formatCurrency(order.itemsTotal || 0)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.text}>{isTakeaway ? "Pickup fee" : "Delivery fee"}</Text>
          <Text style={styles.text}>{formatCurrency(order.deliveryFee || 0)}</Text>
        </View>
        {!isTakeaway && order.deliveryFeeBreakdown ? (
          <Text style={styles.text}>
            Fee breakdown: base {formatCurrency(order.deliveryFeeBreakdown.baseFee)} + distance{" "}
            {formatCurrency(order.deliveryFeeBreakdown.distanceFee)}
            {order.deliveryFeeBreakdown.peakFee
              ? ` + peak ${formatCurrency(order.deliveryFeeBreakdown.peakFee)}`
              : ""}
            {order.deliveryFeeBreakdown.longDistanceFee
              ? ` + long-distance ${formatCurrency(order.deliveryFeeBreakdown.longDistanceFee)}`
              : ""}
          </Text>
        ) : null}
        <Text style={styles.total}>Total: {formatCurrency(order.total)}</Text>
        <Text style={styles.text}>Payment: {order.paymentMethod}</Text>
        {!isTakeaway && order.distanceKm ? <Text style={styles.text}>Distance: {order.distanceKm.toFixed(1)} km</Text> : null}
        <Text style={styles.text}>Order time: {new Date(order.createdAt).toLocaleString()}</Text>
      </View>
      <StatusTimeline
        currentStatus={getTimelineStatus(order.status, isTakeaway)}
        statuses={timelineStatuses}
      />
      <View style={styles.card}>
        <Text style={styles.heading}>Current Status</Text>
        <Text style={styles.text}>{order.status}</Text>
      </View>
    </ScreenContainer>
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
    fontSize: 18,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  text: {
    color: appTheme.colors.textMuted,
    lineHeight: 21,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: appTheme.spacing.md,
  },
  total: {
    color: "#B9481B",
    fontWeight: "800",
    fontSize: 18,
  },
});
