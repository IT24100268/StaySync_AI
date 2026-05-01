import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../theme";

export default function RestaurantCard({ restaurant, onPress }) {
  const ratingLabel =
    restaurant.totalRatings > 0
      ? `${restaurant.rating.toFixed(1)} (${restaurant.totalRatings})`
      : "No ratings yet";

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Ionicons name="restaurant-outline" size={22} color="#FFFFFF" />
        </View>
        <View style={styles.content}>
          <Text style={styles.name}>{restaurant.name}</Text>
          <Text style={styles.meta}>{restaurant.location}</Text>
          <Text style={styles.meta}>
            Rating {ratingLabel} •{" "}
            {restaurant.deliveryAvailable ? "Delivery Available" : "Pickup Only"}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={appTheme.colors.textMuted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.md,
    ...appTheme.shadow,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: appTheme.spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: appTheme.colors.primary,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: appTheme.colors.text,
  },
  meta: {
    fontSize: 13,
    color: appTheme.colors.textMuted,
  },
});
