import React, { useEffect, useLayoutEffect, useState } from "react";
import { Alert, ScrollView } from "react-native";
import ScreenContainer from "../../components/common/ScreenContainer";
import LoadingOverlay from "../../components/common/LoadingOverlay";
import EmptyState from "../../components/common/EmptyState";
import AppButton from "../../components/common/AppButton";
import FoodItemCard from "../../components/food/FoodItemCard";
import { StyleSheet, Text, View } from "react-native";
import { fetchFoodMenu, fetchRestaurantReviews } from "../../services/restaurantService";
import { useCart } from "../../context/CartContext";
import { appTheme } from "../../theme";

export default function FoodMenuScreen({ route, navigation }) {
  const { restaurantId, restaurantName } = route.params || {};
  const { addToCart, items } = useCart();
  const [menu, setMenu] = useState([]);
  const [restaurantSummary, setRestaurantSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: restaurantName || "Food Menu",
    });
  }, [navigation, restaurantName]);

  useEffect(() => {
    loadMenu();
  }, [restaurantId]);

  async function loadMenu() {
    try {
      const [menuResponse, reviewResponse] = await Promise.all([
        fetchFoodMenu(restaurantId),
        fetchRestaurantReviews(restaurantId, 3),
      ]);
      setMenu(menuResponse);
      setRestaurantSummary(reviewResponse.restaurant);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <ScreenContainer scrollable={false} contentContainerStyle={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {restaurantSummary ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>{restaurantName || restaurantSummary.name}</Text>
            <Text style={styles.summaryMeta}>
              Rating{" "}
              {restaurantSummary.totalRatings > 0
                ? `${restaurantSummary.rating.toFixed(1)} (${restaurantSummary.totalRatings} ratings)`
                : "No ratings yet"}
            </Text>
          </View>
        ) : null}
        {menu.length === 0 ? (
          <EmptyState
            title="Menu unavailable"
            description="Food items for this restaurant are not available yet."
          />
        ) : (
          menu.map((item) => (
            <FoodItemCard key={item.id} item={item} onAdd={() => addToCart(item)} />
          ))
        )}
      </ScrollView>

      <View style={styles.cartBar}>
        <AppButton
          title={`Go to Cart (${items.length})`}
          onPress={() => navigation.navigate("Cart")}
          variant="secondary"
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
    paddingBottom: appTheme.spacing.xl,
  },
  summaryCard: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.xs,
    ...appTheme.shadow,
  },
  summaryTitle: {
    color: appTheme.colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  summaryMeta: {
    color: appTheme.colors.textMuted,
  },
  cartBar: {
    paddingHorizontal: appTheme.spacing.lg,
    paddingTop: appTheme.spacing.sm,
    paddingBottom: appTheme.spacing.lg,
    backgroundColor: appTheme.colors.background,
    borderTopWidth: 1,
    borderTopColor: appTheme.colors.border,
  },
});
