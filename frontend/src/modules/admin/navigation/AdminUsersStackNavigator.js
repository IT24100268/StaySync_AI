import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import UserDetailsScreen from "../screens/users/UserDetailsScreen";
import UserManagementScreen from "../screens/users/UserManagementScreen";

const Stack = createNativeStackNavigator();

export default function AdminUsersStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="UserManagement" component={UserManagementScreen} options={{ title: "Users" }} />
      <Stack.Screen name="UserDetails" component={UserDetailsScreen} options={{ title: "User Details" }} />
    </Stack.Navigator>
  );
}
