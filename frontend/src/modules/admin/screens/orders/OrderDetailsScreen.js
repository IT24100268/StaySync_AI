import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import AppButton from "../../../../components/common/AppButton";
import EmptyState from "../../../../components/common/EmptyState";
import LoadingOverlay from "../../../../components/common/LoadingOverlay";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import SectionHeader from "../../../../components/common/SectionHeader";
import { appTheme } from "../../../../theme";
import { formatCurrency } from "../../../../utils/format";
import { fetchAdminOrderById } from "../../services/adminOrderService";

const orderStatusToneMap = {
  ongoing: { backgroundColor: "#FFF1E4", color: "#EA7A18" },
  failed: { backgroundColor: "#FDEBEC", color: "#D64545" },
  completed: { backgroundColor: "#EAF7EF", color: "#239B56" },
};

const disputeStatusToneMap = {
  none: { backgroundColor: "#EEF4F8", color: appTheme.colors.textMuted },
  open: { backgroundColor: "#F3EAFF", color: "#7C3AED" },
  under_review: { backgroundColor: "#F3EAFF", color: "#7C3AED" },
  resolved: { backgroundColor: "#EAF7EF", color: "#239B56" },
};

function StatusPill({ label, tone }) {
  return (
    <View style={[styles.pill, { backgroundColor: tone.backgroundColor }]}>
      <Text style={[styles.pillLabel, { color: tone.color }]}>{label}</Text>
    </View>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || "-"}</Text>
    </View>
  );
}

export default function OrderDetailsScreen({ route }) {
  const { orderId } = route.params || {};
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  async function loadOrder() {
    try {
      setLoading(true);
      const response = await fetchAdminOrderById(orderId);
      setOrder(response);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Unable to load order details.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingOverlay />;
  }

  if (!order) {
    return (
      <ScreenContainer>
        <EmptyState
          title="Order unavailable"
          description={error || "The selected order could not be loaded."}
          icon="receipt-outline"
        />
        <AppButton title="Retry" onPress={loadOrder} />
      </ScreenContainer>
    );
  }

  const orderTone = orderStatusToneMap[order.status] || orderStatusToneMap.ongoing;
  const disputeTone = disputeStatusToneMap[order.disputeStatus] || disputeStatusToneMap.none;
  const formatRupee = (value) => formatCurrency(value).replace("Rs. ", "Rs ");

  return (
    <ScreenContainer>
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Order Details</Text>
        <Text style={styles.heroTitle}>{order.orderCode}</Text>
        <Text style={styles.heroSubtitle}>
          {order.studentName} - {order.restaurantName}
        </Text>
        <View style={styles.heroPills}>
          <StatusPill label={order.statusLabel} tone={orderTone} />
          <StatusPill label={order.disputeStatusLabel} tone={disputeTone} />
        </View>
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <AppButton title="Retry" onPress={loadOrder} />
        </View>
      ) : null}

      <View style={styles.card}>
        <SectionHeader
          title="Full Order Info"
          subtitle="Core order, student, restaurant, and delivery details."
        />
        <DetailRow label="Created Date" value={order.createdDateLabel} />
        <DetailRow label="Operational Status" value={order.operationalStatusLabel} />
        <DetailRow label="Student" value={order.student?.name} />
        <DetailRow label="Restaurant" value={order.restaurant?.name} />
        <DetailRow
          label="Delivery Partner"
          value={order.delivery?.partner?.name || order.deliveryPartnerName}
        />
        <DetailRow label="Delivery Address" value={order.deliveryAddress} />
        <DetailRow label="Total Amount" value={formatRupee(order.totalAmount)} />
        <DetailRow label="Delivery Fee" value={formatRupee(order.deliveryFee)} />
        {order.failureReason ? (
          <View style={styles.copyBlock}>
            <Text style={styles.blockLabel}>Failure Reason</Text>
            <Text style={styles.bodyText}>{order.failureReason}</Text>
          </View>
        ) : null}
        {order.notes ? (
          <View style={styles.copyBlock}>
            <Text style={styles.blockLabel}>Order Notes</Text>
            <Text style={styles.bodyText}>{order.notes}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <SectionHeader
          title="Timeline"
          subtitle="Placed to delivery progression with dispute visibility."
        />
        {order.timeline.map((item) => (
          <View key={item.key} style={styles.timelineRow}>
            <View style={[styles.timelineDot, item.completed && styles.timelineDotActive]} />
            <View style={styles.timelineCopy}>
              <View style={styles.timelineHeader}>
                <Text style={styles.timelineLabel}>{item.label}</Text>
                <Text style={styles.timelineDate}>{item.dateLabel}</Text>
              </View>
              <Text style={styles.timelineDescription}>{item.description}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <SectionHeader title="Items" subtitle="Ordered menu items and pricing breakdown." />
        {order.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemCopy}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemMeta}>
                Qty {item.quantity} - {formatRupee(item.unitPrice)} each
              </Text>
            </View>
            <Text style={styles.itemPrice}>{formatRupee(item.subtotal)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <SectionHeader title="Delivery Partner" subtitle="Current assignment and delivery state." />
        <DetailRow label="Partner Name" value={order.delivery?.partner?.name || "Not Assigned"} />
        <DetailRow label="Partner Email" value={order.delivery?.partner?.email || "-"} />
        <DetailRow label="Partner Phone" value={order.delivery?.partner?.phone || "-"} />
        <DetailRow label="Delivery Status" value={order.delivery?.statusLabel || "-"} />
        <DetailRow label="Pickup Address" value={order.delivery?.pickupAddress || "-"} />
        <DetailRow label="Drop Address" value={order.delivery?.dropAddress || "-"} />
      </View>

      {order.dispute ? (
        <View style={styles.card}>
          <SectionHeader
            title="Dispute Details"
            subtitle="Open issue context for failed or disputed orders."
          />
          <DetailRow label="Issue Type" value={order.dispute.issueType} />
          <DetailRow label="Dispute Status" value={order.dispute.statusLabel} />
          <DetailRow label="Created" value={order.dispute.createdDateLabel} />
          {order.dispute.resolutionNotes ? (
            <DetailRow label="Resolution Notes" value={order.dispute.resolutionNotes} />
          ) : null}
          <View style={styles.copyBlock}>
            <Text style={styles.blockLabel}>Description</Text>
            <Text style={styles.bodyText}>{order.dispute.description}</Text>
          </View>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: appTheme.colors.primaryDark,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.xl,
    gap: appTheme.spacing.sm,
  },
  heroEyebrow: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.88)",
    lineHeight: 21,
  },
  heroPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: appTheme.spacing.sm,
    marginTop: appTheme.spacing.xs,
  },
  card: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
    ...appTheme.shadow,
  },
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
    lineHeight: 20,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: appTheme.radius.pill,
  },
  pillLabel: {
    fontSize: 12,
    fontWeight: "800",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: appTheme.spacing.md,
  },
  detailLabel: {
    color: appTheme.colors.textMuted,
    flex: 1,
  },
  detailValue: {
    color: appTheme.colors.text,
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: appTheme.spacing.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    marginTop: 6,
    backgroundColor: "#D9E4EA",
  },
  timelineDotActive: {
    backgroundColor: appTheme.colors.primary,
  },
  timelineCopy: {
    flex: 1,
    gap: 4,
    paddingBottom: appTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(16,52,71,0.08)",
  },
  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: appTheme.spacing.md,
  },
  timelineLabel: {
    color: appTheme.colors.text,
    fontWeight: "800",
  },
  timelineDate: {
    color: appTheme.colors.textMuted,
    fontSize: 12,
  },
  timelineDescription: {
    color: appTheme.colors.textMuted,
    lineHeight: 20,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.xs,
  },
  itemCopy: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    color: appTheme.colors.text,
    fontWeight: "800",
  },
  itemMeta: {
    color: appTheme.colors.textMuted,
  },
  itemPrice: {
    color: appTheme.colors.text,
    fontWeight: "800",
  },
  copyBlock: {
    gap: appTheme.spacing.sm,
  },
  blockLabel: {
    color: appTheme.colors.text,
    fontWeight: "800",
  },
  bodyText: {
    color: appTheme.colors.text,
    lineHeight: 21,
  },
});
