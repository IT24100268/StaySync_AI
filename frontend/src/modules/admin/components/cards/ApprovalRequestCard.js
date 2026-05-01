import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AppButton from "../../../../components/common/AppButton";
import { appTheme } from "../../../../theme";
import StatusBadge from "./StatusBadge";

export default function ApprovalRequestCard({
  title,
  subtitle,
  meta,
  status,
  onOpen,
  onApprove,
  onReject,
}) {
  return (
    <Pressable style={styles.card} onPress={onOpen}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <StatusBadge status={status} />
      </View>
      <Text style={styles.meta}>{meta}</Text>
      <View style={styles.actions}>
        <AppButton title="Approve" onPress={onApprove} />
        <AppButton title="Reject" variant="secondary" onPress={onReject} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
    ...appTheme.shadow,
  },
  row: {
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
  subtitle: {
    color: appTheme.colors.textMuted,
    lineHeight: 20,
  },
  meta: {
    color: appTheme.colors.text,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: appTheme.spacing.md,
  },
});
