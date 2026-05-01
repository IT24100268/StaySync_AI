import React from "react";
import { StyleSheet, Text, View } from "react-native";
import ScreenContainer from "../../components/common/ScreenContainer";
import EmptyState from "../../components/common/EmptyState";
import AppButton from "../../components/common/AppButton";
import { useCart } from "../../context/CartContext";
import { appTheme } from "../../theme";
import { formatCurrency } from "../../utils/format";

export default function CartScreen({ navigation }) {
  const { items, total, updateQty, removeFromCart } = useCart();

  if (items.length === 0) {
    return (
      <ScreenContainer>
        <EmptyState
          title="Your cart is empty"
          description="Add food items from a restaurant menu to continue."
          icon="cart-outline"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {items.map((item) => {
        return (
          <View key={item.id} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.copy}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>{formatCurrency(item.price)} each</Text>
                <Text style={styles.meta}>Subtotal: {formatCurrency(item.subtotal)}</Text>
              </View>
              <View style={styles.qtyBox}>
                <AppButton
                  title="-"
                  variant="secondary"
                  onPress={() => updateQty(item.foodId, item.qty - 1)}
                />
                <Text style={styles.qty}>{item.qty}</Text>
                <AppButton
                  title="+"
                  variant="secondary"
                  onPress={() => updateQty(item.foodId, item.qty + 1)}
                />
              </View>
            </View>
            <AppButton
              title="Remove"
              variant="secondary"
              onPress={() => removeFromCart(item.foodId)}
            />
          </View>
        );
      })}

      <View style={styles.summary}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
      </View>
      <AppButton
        title="Proceed to Checkout"
        onPress={() => navigation.navigate("Checkout")}
      />
    </ScreenContainer>
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
    fontSize: 16,
    fontWeight: "700",
    color: appTheme.colors.text,
  },
  meta: {
    color: appTheme.colors.textMuted,
  },
  qtyBox: {
    width: 110,
    gap: appTheme.spacing.sm,
  },
  qty: {
    textAlign: "center",
    fontWeight: "700",
    color: appTheme.colors.text,
  },
  summary: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    ...appTheme.shadow,
  },
  totalLabel: {
    color: appTheme.colors.textMuted,
    fontSize: 15,
  },
  totalValue: {
    color: appTheme.colors.primary,
    fontWeight: "800",
    fontSize: 18,
  },
});
