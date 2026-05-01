import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../theme";
import ComplaintStatusBadge from "./ComplaintStatusBadge";

export default function ComplaintListItem({ complaint, onPress }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="document-text-outline" size={18} color={appTheme.colors.primary} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.type}>{complaint.type}</Text>
          <Text style={styles.date}>
            {complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : "Just now"}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={appTheme.colors.textMuted} />
      </View>
      <ComplaintStatusBadge status={complaint.status} />
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
    borderColor: "#E6EEF4",
    ...appTheme.shadow,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: appTheme.spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F4F7",
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  type: {
    color: appTheme.colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  date: {
    color: appTheme.colors.textMuted,
    fontSize: 12,
  },
});
