import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../../../theme";
import { formatCurrency } from "../../../../utils/format";
import { resolveOwnerRoomImageSource } from "../../utils/ownerRoomImages";

export default function OwnerRoomCard({
  listing,
  onPress,
  onEdit,
  onToggleStatus,
  onDelete,
}) {
  const isAvailable = listing.status === "available";

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Image source={resolveOwnerRoomImageSource(listing.images[0])} style={styles.image} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.title}>{listing.title}</Text>
          <View style={[styles.badge, isAvailable ? styles.available : styles.unavailable]}>
            <Text style={[styles.badgeLabel, isAvailable ? styles.availableLabel : styles.unavailableLabel]}>
              {isAvailable ? "Available" : "Unavailable"}
            </Text>
          </View>
        </View>
        <Text style={styles.meta}>{listing.address}</Text>
        <Text style={styles.price}>{formatCurrency(listing.rent)} / month</Text>
        <Text style={styles.meta}>
          {listing.roomType} • Capacity {listing.maxCapacity} • Enquiries {listing.enquiriesCount}
        </Text>

        <View style={styles.actionRow}>
          <ActionButton icon="create-outline" label="Edit" onPress={onEdit} />
          <ActionButton
            icon={isAvailable ? "pause-circle-outline" : "play-circle-outline"}
            label={isAvailable ? "Mark Unavailable" : "Mark Available"}
            onPress={onToggleStatus}
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
        color={danger ? appTheme.colors.danger : appTheme.colors.primaryDark}
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
  price: {
    color: appTheme.colors.primaryDark,
    fontWeight: "800",
    fontSize: 16,
  },
  badge: {
    borderRadius: appTheme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  available: {
    backgroundColor: "#E8F8F0",
  },
  unavailable: {
    backgroundColor: "#FCEBEC",
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  availableLabel: {
    color: appTheme.colors.success,
  },
  unavailableLabel: {
    color: appTheme.colors.danger,
  },
  actionRow: {
    gap: appTheme.spacing.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  actionLabel: {
    color: appTheme.colors.primaryDark,
    fontWeight: "600",
    fontSize: 13,
  },
  dangerLabel: {
    color: appTheme.colors.danger,
  },
});
