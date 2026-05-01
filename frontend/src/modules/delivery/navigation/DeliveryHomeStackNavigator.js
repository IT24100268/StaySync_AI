import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DeliveryHomeScreen from "../screens/home/DeliveryHomeScreen";
import DeliveryDetailsScreen from "../screens/jobs/DeliveryDetailsScreen";
import NavigationScreen from "../screens/jobs/NavigationScreen";
import ActiveDeliveryScreen from "../screens/jobs/ActiveDeliveryScreen";

const Stack = createNativeStackNavigator();

export default function DeliveryHomeStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DeliveryHome" component={DeliveryHomeScreen} options={{ title: "Delivery Dashboard" }} />
      <Stack.Screen name="ActiveDelivery" component={ActiveDeliveryScreen} options={{ title: "Active Delivery" }} />
      <Stack.Screen name="DeliveryDetails" component={DeliveryDetailsScreen} options={{ title: "Delivery Details" }} />
      <Stack.Screen name="NavigationAssist" component={NavigationScreen} options={{ title: "Navigation Assistance" }} />
    </Stack.Navigator>
  );
}
