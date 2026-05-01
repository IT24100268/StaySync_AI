import React from "react";
import { StyleSheet, Text, View } from "react-native";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import SectionHeader from "../../../../components/common/SectionHeader";
import { appTheme } from "../../../../theme";
import { useMenu } from "../../context/MenuContext";
import { useOrders } from "../../context/OrderContext";
import DashboardStatCard from "../../components/cards/DashboardStatCard";
import { formatCurrency } from "../../../../utils/format";

export default function AnalyticsScreen() {
  const { menuItems } = useMenu();
  const { orders, analytics } = useOrders();

  const topSellingItems = [...menuItems]
    .map((item) => ({
      ...item,
      orderCount: orders.reduce((sum, order) => {
        const orderItem = order.items.find((entry) => entry.foodId === item.id);
        return sum + Number(orderItem?.qty || 0);
      }, 0),
    }))
    .sort((first, second) => second.orderCount - first.orderCount)
    .slice(0, 3);

  return (
    <ScreenContainer>
      <SectionHeader title="Restaurant analytics" subtitle="Daily performance snapshot for your kitchen." />
      <View style={styles.grid}>
        <DashboardStatCard label="Total Sales" value={formatCurrency(analytics.totalSales)} icon="cash-outline" />
        <DashboardStatCard label="Total Orders" value={analytics.totalOrders} icon="receipt-outline" accentColor={appTheme.colors.info} />
        <DashboardStatCard label="Accepted Orders" value={analytics.acceptedOrders} icon="checkmark-circle-outline" accentColor={appTheme.colors.success} />
        <DashboardStatCard label="Rejected Orders" value={analytics.rejectedOrders} icon="close-circle-outline" accentColor={appTheme.colors.danger} />
      </View>
      <View style={styles.card}>
        <Text style={styles.heading}>Kitchen workflow</Text>
        <Text style={styles.meta}>Preparing: {analytics.preparingOrders}</Text>
        <Text style={styles.meta}>Ready: {analytics.readyOrders}</Text>
        <Text style={styles.meta}>Pending: {analytics.pendingOrders}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.heading}>Top selling items</Text>
        {topSellingItems.map((item) => (
          <View key={item.id} style={styles.row}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.meta}>{item.orderCount} orders</Text>
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: appTheme.spacing.md,
  },
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
  meta: {
    color: appTheme.colors.textMuted,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: appTheme.spacing.md,
  },
  title: {
    color: appTheme.colors.text,
    fontWeight: "700",
  },
});
