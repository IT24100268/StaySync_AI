import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ROLES } from "../constants/auth";
import { useRoleAuth } from "../context/RoleAuthContext";
import AdminRootNavigator from "../modules/admin/navigation/AdminRootNavigator";
import MainTabNavigator from "./MainTabNavigator";
import OwnerTabNavigator from "../modules/owner/navigation/OwnerTabNavigator";
import RestaurantTabNavigator from "../modules/restaurant/navigation/RestaurantTabNavigator";
import DeliveryTabNavigator from "../modules/delivery/navigation/DeliveryTabNavigator";

const Stack = createNativeStackNavigator();

function getAppComponent(role) {
  if (role === ROLES.OWNER) return OwnerTabNavigator;
  if (role === ROLES.RESTAURANT) return RestaurantTabNavigator;
  if (role === ROLES.DELIVERY) return DeliveryTabNavigator;
  if (role === ROLES.ADMIN) return AdminRootNavigator;
  return MainTabNavigator;
}

function getAppRouteName(role) {
  if (role === ROLES.OWNER) return "OwnerApp";
  if (role === ROLES.RESTAURANT) return "RestaurantApp";
  if (role === ROLES.DELIVERY) return "DeliveryApp";
  if (role === ROLES.ADMIN) return "Admin Dashboard";
  return "StudentApp";
}

export default function AppStackNavigator() {
  const { role } = useRoleAuth();
  const AppComponent = getAppComponent(role);

  return (
    <Stack.Navigator>
      <Stack.Screen
        name={getAppRouteName(role)}
        component={AppComponent}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
