import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoadingOverlay from "../../../components/common/LoadingOverlay";
import { useRestaurantAuth } from "../context/RestaurantAuthContext";
import RestaurantAuthNavigator from "./RestaurantAuthNavigator";
import RestaurantTabNavigator from "./RestaurantTabNavigator";

const Stack = createNativeStackNavigator();

export default function RestaurantRootNavigator() {
  const { loading, isAuthenticated } = useRestaurantAuth();

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="RestaurantTabs" component={RestaurantTabNavigator} />
      ) : (
        <Stack.Screen name="RestaurantAuth" component={RestaurantAuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
