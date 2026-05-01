import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OrdersListScreen from "../screens/orders/OrdersListScreen";
import OrderDetailsScreen from "../screens/orders/OrderDetailsScreen";

const Stack = createNativeStackNavigator();

export default function OrdersStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="OrdersList" component={OrdersListScreen} options={{ title: "Incoming Orders" }} />
      <Stack.Screen name="RestaurantOrderDetails" component={OrderDetailsScreen} options={{ title: "Order Details" }} />
    </Stack.Navigator>
  );
}
