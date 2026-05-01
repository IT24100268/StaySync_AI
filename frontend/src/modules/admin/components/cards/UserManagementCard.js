import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AppButton from "../../../../components/common/AppButton";
import { appTheme } from "../../../../theme";
import StatusBadge from "./StatusBadge";

export default function UserManagementCard({ user, onOpen, onToggleBlock }) {
  return (
    <Pressable style={styles.card} onPress={onOpen}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
        <StatusBadge status={user.isBlocked ? "Blocked" : user.status} />
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>Role: {user.role}</Text>
        <Text style={styles.meta}>Joined: {user.createdAt}</Text>
      </View>
      {user.isBlocked && user.blockedReason ? (
        <Text style={styles.reason}>Reason: {user.blockedReason}</Text>
      ) : null}
      <AppButton
        title={user.isBlocked ? "Unblock User" : "Block User"}
        variant={user.isBlocked ? "primary" : "secondary"}
        onPress={onToggleBlock}
      />
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
  name: {
    fontSize: 18,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  email: {
    color: appTheme.colors.textMuted,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: appTheme.spacing.md,
  },
  meta: {
    color: appTheme.colors.text,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  reason: {
    color: appTheme.colors.error,
    fontWeight: "600",
    lineHeight: 20,
  },
});
