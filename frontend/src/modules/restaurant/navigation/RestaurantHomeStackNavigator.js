import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RestaurantHomeScreen from "../screens/home/RestaurantHomeScreen";
import FoodItemDetailsScreen from "../screens/menu/FoodItemDetailsScreen";
import OrderDetailsScreen from "../screens/orders/OrderDetailsScreen";

const Stack = createNativeStackNavigator();

export default function RestaurantHomeStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="RestaurantHome" component={RestaurantHomeScreen} options={{ title: "Restaurant Dashboard" }} />
      <Stack.Screen name="FoodItemDetails" component={FoodItemDetailsScreen} options={{ title: "Food Item Details" }} />
      <Stack.Screen name="RestaurantOrderDetails" component={OrderDetailsScreen} options={{ title: "Order Details" }} />
    </Stack.Navigator>
  );
}
