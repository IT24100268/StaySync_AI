import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RestaurantsScreen from "../screens/food/RestaurantsScreen";
import FoodMenuScreen from "../screens/food/FoodMenuScreen";
import CartScreen from "../screens/food/CartScreen";
import CheckoutScreen from "../screens/food/CheckoutScreen";
import LocationPickerScreen from "../screens/location/LocationPickerScreen";
import OrderTrackingScreen from "../screens/orders/OrderTrackingScreen";
import RateRestaurantScreen from "../screens/orders/RateRestaurantScreen";
import ComplaintFormScreen from "../screens/reports/ComplaintFormScreen";

const Stack = createNativeStackNavigator();

export default function FoodStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Restaurants" component={RestaurantsScreen} />
      <Stack.Screen name="FoodMenu" component={FoodMenuScreen} options={{ title: "Food Menu" }} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="LocationPicker" component={LocationPickerScreen} options={{ title: "Select Location" }} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} options={{ title: "Track Order" }} />
      <Stack.Screen name="RateRestaurant" component={RateRestaurantScreen} options={{ title: "Rate Restaurant" }} />
      <Stack.Screen name="ComplaintForm" component={ComplaintFormScreen} options={{ title: "Report Issue" }} />
    </Stack.Navigator>
  );
}
