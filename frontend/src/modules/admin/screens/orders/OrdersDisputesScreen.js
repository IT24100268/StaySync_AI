import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import AppButton from "../../../../components/common/AppButton";
import EmptyState from "../../../../components/common/EmptyState";
import LoadingOverlay from "../../../../components/common/LoadingOverlay";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import SectionHeader from "../../../../components/common/SectionHeader";
import { appTheme } from "../../../../theme";
import OrderCard from "../../components/cards/OrderCard";
import OrderFilters from "../../components/common/OrderFilters";
import { useMonitoring } from "../../context/MonitoringContext";
import { ORDER_MONITOR_FILTERS } from "../../utils/constants";

export default function OrdersDisputesScreen({ navigation }) {
  const { orderMonitor, loading, error, loadMonitoring } = useMonitoring();
  const [filter, setFilter] = useState("All");

  const filteredOrders = useMemo(() => {
    if (filter === "All") {
      return orderMonitor;
    }

    if (filter === "Ongoing") {
      return orderMonitor.filter((item) => item.status === "ongoing");
    }

    if (filter === "Failed") {
      return orderMonitor.filter((item) => item.status === "failed");
    }

    return orderMonitor.filter((item) => item.disputeStatus !== "none");
  }, [filter, orderMonitor]);

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <ScreenContainer>
      <SectionHeader
        title="Orders and disputes"
        subtitle="Track ongoing deliveries, failed orders, and disputed cases in one queue."
      />
      <OrderFilters options={ORDER_MONITOR_FILTERS} value={filter} onChange={setFilter} />

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <AppButton title="Retry" onPress={loadMonitoring} />
        </View>
      ) : null}

      {filteredOrders.length === 0 ? (
        <EmptyState
          title="No monitored orders"
          description="There are no orders in this status right now."
          icon="receipt-outline"
        />
      ) : (
        filteredOrders.map((item) => (
          <OrderCard
            key={item.id}
            order={item}
            onPress={() => navigation.navigate("OrderDetails", { orderId: item.id })}
          />
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  errorCard: {
    backgroundColor: "#FFF4F4",
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
    borderWidth: 1,
    borderColor: "#F3D1D1",
  },
  errorText: {
    color: appTheme.colors.danger,
    lineHeight: 21,
  },
});
