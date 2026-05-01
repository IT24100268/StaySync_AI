import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DeliveryLoginScreen from "../screens/auth/DeliveryLoginScreen";
import DeliveryRegisterScreen from "../screens/auth/DeliveryRegisterScreen";

const Stack = createNativeStackNavigator();

export default function DeliveryAuthNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DeliveryLogin" component={DeliveryLoginScreen} options={{ title: "Delivery Login", headerShown: false }} />
      <Stack.Screen name="DeliveryRegister" component={DeliveryRegisterScreen} options={{ title: "Delivery Register" }} />
    </Stack.Navigator>
  );
}
