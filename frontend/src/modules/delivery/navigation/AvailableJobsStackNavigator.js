import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AvailableJobsScreen from "../screens/jobs/AvailableJobsScreen";
import DeliveryDetailsScreen from "../screens/jobs/DeliveryDetailsScreen";
import NavigationScreen from "../screens/jobs/NavigationScreen";

const Stack = createNativeStackNavigator();

export default function AvailableJobsStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AvailableJobs" component={AvailableJobsScreen} options={{ title: "Available Jobs" }} />
      <Stack.Screen name="DeliveryDetails" component={DeliveryDetailsScreen} options={{ title: "Delivery Details" }} />
      <Stack.Screen name="NavigationAssist" component={NavigationScreen} options={{ title: "Navigation Assistance" }} />
    </Stack.Navigator>
  );
}
