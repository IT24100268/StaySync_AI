import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RestaurantLoginScreen from "../screens/auth/RestaurantLoginScreen";
import RestaurantRegisterScreen from "../screens/auth/RestaurantRegisterScreen";

const Stack = createNativeStackNavigator();

export default function RestaurantAuthNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="RestaurantLogin" component={RestaurantLoginScreen} options={{ title: "Restaurant Login", headerShown: false }} />
      <Stack.Screen name="RestaurantRegister" component={RestaurantRegisterScreen} options={{ title: "Restaurant Register" }} />
    </Stack.Navigator>
  );
}
