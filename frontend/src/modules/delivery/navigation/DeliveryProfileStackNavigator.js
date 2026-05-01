import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DeliveryProfileScreen from "../screens/profile/DeliveryProfileScreen";
import EditDeliveryProfileScreen from "../screens/profile/EditDeliveryProfileScreen";

const Stack = createNativeStackNavigator();

export default function DeliveryProfileStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DeliveryProfile" component={DeliveryProfileScreen} options={{ title: "Delivery Profile" }} />
      <Stack.Screen name="EditDeliveryProfile" component={EditDeliveryProfileScreen} options={{ title: "Edit Profile" }} />
    </Stack.Navigator>
  );
}
