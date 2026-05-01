import React, { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import EmptyState from "../../../../components/common/EmptyState";
import FilterChip from "../../../../components/common/FilterChip";
import LoadingOverlay from "../../../../components/common/LoadingOverlay";
import AppButton from "../../../../components/common/AppButton";
import AppInput from "../../../../components/common/AppInput";
import OrderCard from "../../components/orders/OrderCard";
import { useOrders } from "../../context/OrderContext";
import { appTheme } from "../../../../theme";

const ORDER_FILTERS = ["All", "Pending", "Accepted", "Rejected"];

export default function OrdersListScreen({ navigation }) {
  const { orders, loading, setOrderStatus, loadOrders, clearNewOrderAlerts } = useOrders();
  const [rejectingId, setRejectingId] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState("");
  const [submittingRejection, setSubmittingRejection] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");

  useFocusEffect(
    React.useCallback(() => {
      clearNewOrderAlerts();
      loadOrders();
    }, [clearNewOrderAlerts, loadOrders])
  );

  if (loading) return <LoadingOverlay />;

  function nextStatus(order) {
    const currentStatus = order.status;

    if (currentStatus === "Pending") return "Accepted";
    if (currentStatus === "Accepted") return "Preparing";
    if (currentStatus === "Preparing") return "Ready";
    if (order.orderType === "takeaway" && currentStatus === "Ready") return "Delivered";
    if (currentStatus === "Ready") return "Out for Delivery";
    return currentStatus;
  }

  const filteredOrders =
    activeFilter === "All"
      ? orders
      : orders.filter((order) => order.status === activeFilter);

  async function submitRejection() {
    const trimmedReason = rejectionReason.trim();

    if (trimmedReason.length < 3) {
      setRejectionError("Please provide a short reason for rejecting this order.");
      return;
    }

    setSubmittingRejection(true);
    setRejectionError("");

    try {
      const result = await setOrderStatus(rejectingId, "Rejected", { rejectionReason: trimmedReason });

      if (!result.success) {
        Alert.alert("Reject Failed", result.message || "Unable to reject this order right now.");
        return;
      }

      setRejectingId("");
      setRejectionReason("");
    } finally {
      setSubmittingRejection(false);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.filtersCard}>
        <Text style={styles.filtersTitle}>Student order status</Text>
        <View style={styles.filtersRow}>
          {ORDER_FILTERS.map((filter) => (
            <FilterChip
              key={filter}
              label={filter}
              selected={activeFilter === filter}
              onPress={() => setActiveFilter(filter)}
            />
          ))}
        </View>
      </View>

      {filteredOrders.length === 0 ? (
        <EmptyState
          title={`No ${activeFilter === "All" ? "incoming" : activeFilter.toLowerCase()} orders`}
          description="Student food orders will appear here based on the selected status."
          icon="receipt-outline"
        />
      ) : (
        filteredOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onPress={() => navigation.navigate("RestaurantOrderDetails", { orderId: order.id })}
          >
            <View style={styles.actions}>
              {order.status !== "Rejected" &&
              order.status !== "Out for Delivery" &&
              !(order.orderType === "takeaway" && order.status === "Delivered") ? (
                <AppButton
                  title={order.status === "Pending" ? "Accept Order" : `Mark ${nextStatus(order)}`}
                  onPress={() => setOrderStatus(order.id, nextStatus(order))}
                />
              ) : null}
              {order.status === "Pending" ? (
                <AppButton title="Reject Order" variant="secondary" onPress={() => setRejectingId(order.id)} />
              ) : null}
            </View>
          </OrderCard>
        ))
      )}

      <Modal visible={Boolean(rejectingId)} transparent animationType="fade" onRequestClose={() => setRejectingId("")}>
        <View style={styles.overlay}>
          <Pressable style={styles.overlayFill} onPress={() => setRejectingId("")} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reject Order</Text>
            <Text style={styles.modalMessage}>
              Please provide a reason. The student will see this rejection reason on their dashboard.
            </Text>
            <AppInput
              label="Rejection Reason"
              value={rejectionReason}
              onChangeText={(value) => {
                setRejectionReason(value);
                if (rejectionError) {
                  setRejectionError("");
                }
              }}
              error={rejectionError}
              multiline
              placeholder="Example: The selected items are currently out of stock."
            />
            <View style={styles.modalActions}>
              <AppButton title="Reject Order" onPress={submitRejection} loading={submittingRejection} />
              <AppButton
                title="Cancel"
                variant="secondary"
                onPress={() => {
                  setRejectingId("");
                  setRejectionReason("");
                  setRejectionError("");
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  filtersCard: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    ...appTheme.shadow,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: appTheme.colors.text,
    marginBottom: appTheme.spacing.sm,
  },
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  actions: {
    gap: appTheme.spacing.sm,
    marginTop: appTheme.spacing.sm,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(16,24,38,0.45)",
    justifyContent: "center",
    padding: appTheme.spacing.lg,
  },
  overlayFill: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  modalMessage: {
    color: appTheme.colors.textMuted,
    lineHeight: 21,
  },
  modalActions: {
    gap: appTheme.spacing.sm,
  },
});
