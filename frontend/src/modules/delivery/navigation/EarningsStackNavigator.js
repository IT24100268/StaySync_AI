import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import EarningsScreen from "../screens/earnings/EarningsScreen";

const Stack = createNativeStackNavigator();

export default function EarningsStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DeliveryEarnings" component={EarningsScreen} options={{ title: "Earnings" }} />
    </Stack.Navigator>
  );
}
