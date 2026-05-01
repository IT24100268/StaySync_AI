import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DeliveryHistoryScreen from "../screens/jobs/DeliveryHistoryScreen";
import DeliveryDetailsScreen from "../screens/jobs/DeliveryDetailsScreen";
import NavigationScreen from "../screens/jobs/NavigationScreen";

const Stack = createNativeStackNavigator();

export default function DeliveryHistoryStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DeliveryHistory" component={DeliveryHistoryScreen} options={{ title: "Delivery History" }} />
      <Stack.Screen name="DeliveryDetails" component={DeliveryDetailsScreen} options={{ title: "Delivery Details" }} />
      <Stack.Screen name="NavigationAssist" component={NavigationScreen} options={{ title: "Navigation Assistance" }} />
    </Stack.Navigator>
  );
}
