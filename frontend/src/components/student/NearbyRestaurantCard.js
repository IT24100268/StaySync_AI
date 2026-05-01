import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../theme";

export default function NearbyRestaurantCard({ restaurant, onPress }) {
  const ratingLabel =
    restaurant.totalRatings > 0 ? restaurant.rating.toFixed(1) : "New";

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="restaurant-outline" size={20} color="#FFFFFF" />
        </View>
        <View style={styles.ratingChip}>
          <Ionicons name="star" size={12} color="#F4B740" />
          <Text style={styles.ratingText}>{ratingLabel}</Text>
        </View>
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {restaurant.name}
      </Text>
      <Text style={styles.meta}>{restaurant.location}</Text>
      <View style={styles.footerRow}>
        <Text style={styles.deliveryLabel}>
          {restaurant.deliveryAvailable ? "Fast delivery" : "Pickup only"}
        </Text>
        <Ionicons name="arrow-forward" size={16} color={appTheme.colors.primary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 220,
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.md,
    gap: appTheme.spacing.sm,
    borderWidth: 1,
    borderColor: "#E6EEF4",
    ...appTheme.shadow,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: appTheme.colors.primary,
  },
  ratingChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: appTheme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#FFF4D8",
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#8A6514",
  },
  name: {
    fontSize: 16,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  meta: {
    fontSize: 13,
    color: appTheme.colors.textMuted,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: appTheme.spacing.xs,
  },
  deliveryLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: appTheme.colors.primary,
  },
});
