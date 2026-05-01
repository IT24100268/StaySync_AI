import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OwnerLoginScreen from "../screens/auth/OwnerLoginScreen";
import OwnerRegisterScreen from "../screens/auth/OwnerRegisterScreen";

const Stack = createNativeStackNavigator();

export default function OwnerAuthNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="OwnerLogin"
        component={OwnerLoginScreen}
        options={{ title: "Owner Login", headerShown: false }}
      />
      <Stack.Screen
        name="OwnerRegister"
        component={OwnerRegisterScreen}
        options={{ title: "Owner Register" }}
      />
    </Stack.Navigator>
  );
}
