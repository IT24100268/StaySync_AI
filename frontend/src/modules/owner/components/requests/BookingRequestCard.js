import React from "react";
import { StyleSheet, Text, View } from "react-native";
import AppButton from "../../../../components/common/AppButton";
import { appTheme } from "../../../../theme";

export default function BookingRequestCard({
  request,
  roomTitle,
  onApprove,
  onReject,
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{request.studentName}</Text>
      <Text style={styles.meta}>{request.studentContact}</Text>
      <Text style={styles.meta}>Room: {roomTitle}</Text>
      <Text style={styles.meta}>Requested: {new Date(request.requestedAt).toLocaleDateString()}</Text>
      <Text style={styles.message}>{request.message}</Text>
      <View style={styles.statusChip}>
        <Text style={styles.statusLabel}>{request.status}</Text>
      </View>
      <View style={styles.actions}>
        <AppButton title="Approve" onPress={onApprove} disabled={request.status === "Approved"} />
        <AppButton
          title="Reject"
          variant="secondary"
          onPress={onReject}
          disabled={request.status === "Rejected"}
        />
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
  name: {
    fontSize: 18,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  meta: {
    color: appTheme.colors.textMuted,
    fontSize: 13,
  },
  message: {
    color: appTheme.colors.text,
    lineHeight: 21,
  },
  statusChip: {
    alignSelf: "flex-start",
    backgroundColor: appTheme.colors.chipBg,
    borderRadius: appTheme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusLabel: {
    color: appTheme.colors.primaryDark,
    fontWeight: "700",
    fontSize: 12,
  },
  actions: {
    gap: appTheme.spacing.sm,
  },
});
