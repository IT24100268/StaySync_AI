import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import ScreenContainer from "../../components/common/ScreenContainer";
import LoadingOverlay from "../../components/common/LoadingOverlay";
import EmptyState from "../../components/common/EmptyState";
import RestaurantCard from "../../components/food/RestaurantCard";
import { fetchRestaurants } from "../../services/restaurantService";

export default function RestaurantsScreen({ navigation }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRestaurants();
  }, []);

  async function loadRestaurants() {
    try {
      const response = await fetchRestaurants();
      setList(response);
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
    <ScreenContainer>
      {list.length === 0 ? (
        <EmptyState
          title="No restaurants found"
          description="Nearby food partners will appear here."
          icon="restaurant-outline"
        />
      ) : (
        list.map((restaurant) => (
          <RestaurantCard
            key={restaurant.id}
            restaurant={restaurant}
            onPress={() =>
              navigation.navigate("FoodMenu", {
                restaurantId: restaurant.id,
                restaurantName: restaurant.name,
              })
            }
          />
        ))
      )}
    </ScreenContainer>
  );
}
