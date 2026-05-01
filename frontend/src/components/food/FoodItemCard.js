import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { appTheme } from "../../theme";
import { formatCurrency } from "../../utils/format";
import AppButton from "../common/AppButton";

export default function FoodItemCard({ item, onAdd }) {
  const isAvailable = item.availability === true || item.availability === "in_stock";

  return (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.body}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>{isAvailable ? "Available now" : "Unavailable"}</Text>
        <Text style={styles.price}>{formatCurrency(item.price)}</Text>
        <AppButton
          title="Add to Cart"
          onPress={onAdd}
          disabled={!isAvailable}
        />
      </View>
    </View>
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
    height: 160,
  },
  body: {
    padding: appTheme.spacing.md,
    gap: appTheme.spacing.sm,
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
  price: {
    fontSize: 15,
    fontWeight: "700",
    color: appTheme.colors.primary,
  },
});
