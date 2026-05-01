import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { appTheme } from "../../../../theme";

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

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "-"}</Text>
    </View>
  );
}

export default function OrderCard({ order, onPress }) {
  const orderTone = orderStatusToneMap[order.status] || orderStatusToneMap.ongoing;
  const disputeTone = disputeStatusToneMap[order.disputeStatus] || disputeStatusToneMap.none;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.headerRow}>
        <View style={styles.copy}>
          <Text style={styles.orderId}>{order.orderCode}</Text>
          <Text style={styles.metaLine}>
            {order.studentName} - {order.restaurantName}
          </Text>
        </View>
        <StatusPill label={order.statusLabel} tone={orderTone} />
      </View>

      <View style={styles.infoGrid}>
        <InfoRow label="Delivery Partner" value={order.deliveryPartnerName} />
        <InfoRow label="Dispute" value={order.disputeStatusLabel} />
        <InfoRow label="Created" value={order.createdDateLabel} />
      </View>

      {order.disputeStatus !== "none" ? (
        <View style={styles.disputeRow}>
          <Text style={styles.disputeText}>Dispute Status</Text>
          <StatusPill label={order.disputeStatusLabel} tone={disputeTone} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(16,52,71,0.08)",
    ...appTheme.shadow,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: appTheme.spacing.md,
  },
  copy: {
    flex: 1,
    gap: 6,
  },
  orderId: {
    color: appTheme.colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  metaLine: {
    color: appTheme.colors.textMuted,
    lineHeight: 20,
  },
  infoGrid: {
    gap: appTheme.spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: appTheme.spacing.md,
  },
  infoLabel: {
    color: appTheme.colors.textMuted,
    flex: 1,
  },
  infoValue: {
    color: appTheme.colors.text,
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
  },
  disputeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: appTheme.spacing.md,
    paddingTop: appTheme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: "rgba(16,52,71,0.08)",
  },
  disputeText: {
    color: appTheme.colors.text,
    fontWeight: "700",
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
});
