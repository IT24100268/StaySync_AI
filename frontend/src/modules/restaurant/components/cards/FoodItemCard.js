import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../../../theme";
import { formatCurrency } from "../../../../utils/format";
import StatusBadge from "./StatusBadge";

export default function FoodItemCard({ item, onPress, onEdit, onToggle, onDelete }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.title}>{item.name}</Text>
          <StatusBadge status={item.availability} />
        </View>
        <Text style={styles.meta}>{item.category}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.price}>{formatCurrency(item.price)}</Text>
        <View style={styles.actionRow}>
          <ActionButton icon="create-outline" label="Edit" onPress={onEdit} />
          <ActionButton
            icon={item.availability === "in_stock" ? "pause-circle-outline" : "play-circle-outline"}
            label={item.availability === "in_stock" ? "Out of Stock" : "In Stock"}
            onPress={onToggle}
          />
          <ActionButton icon="trash-outline" label="Delete" onPress={onDelete} danger />
        </View>
      </View>
    </Pressable>
  );
}

function ActionButton({ icon, label, onPress, danger = false }) {
  return (
    <Pressable style={styles.actionButton} onPress={onPress}>
      <Ionicons
        name={icon}
        size={16}
        color={danger ? appTheme.colors.danger : "#B9481B"}
      />
      <Text style={[styles.actionLabel, danger && styles.dangerLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    overflow: "hidden",
    ...appTheme.shadow,
  },
  image: {
    width: "100%",
    height: 180,
  },
  body: {
    padding: appTheme.spacing.md,
    gap: appTheme.spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: appTheme.spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  meta: {
    color: appTheme.colors.textMuted,
    fontSize: 13,
  },
  description: {
    color: appTheme.colors.textMuted,
    lineHeight: 20,
  },
  price: {
    color: "#B9481B",
    fontWeight: "800",
    fontSize: 16,
  },
  actionRow: {
    gap: appTheme.spacing.sm,
  },
  actionButton: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    paddingVertical: 6,
  },
  actionLabel: {
    color: "#B9481B",
    fontWeight: "600",
    fontSize: 13,
  },
  dangerLabel: {
    color: appTheme.colors.danger,
  },
});
