import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OrderDetailsScreen from "../screens/orders/OrderDetailsScreen";
import OrdersDisputesScreen from "../screens/orders/OrdersDisputesScreen";

const Stack = createNativeStackNavigator();

export default function AdminOrdersStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="OrdersDisputes" component={OrdersDisputesScreen} options={{ title: "Orders & Disputes" }} />
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} options={{ title: "Order Details" }} />
    </Stack.Navigator>
  );
}
