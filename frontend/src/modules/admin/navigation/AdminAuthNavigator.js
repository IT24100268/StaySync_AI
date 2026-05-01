import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AdminLoginScreen from "../screens/auth/AdminLoginScreen";

const Stack = createNativeStackNavigator();

export default function AdminAuthNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AdminLogin"
        component={AdminLoginScreen}
        options={{ title: "Admin Login", headerShown: false }}
      />
    </Stack.Navigator>
  );
}
