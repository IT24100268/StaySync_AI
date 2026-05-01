import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AnalyticsScreen from "../screens/analytics/AnalyticsScreen";

const Stack = createNativeStackNavigator();

export default function OwnerAnalyticsStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="OwnerAnalytics" component={AnalyticsScreen} options={{ title: "Analytics" }} />
    </Stack.Navigator>
  );
}
