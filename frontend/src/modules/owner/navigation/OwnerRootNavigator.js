import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoadingOverlay from "../../../components/common/LoadingOverlay";
import { useOwnerAuth } from "../context/OwnerAuthContext";
import OwnerAuthNavigator from "./OwnerAuthNavigator";
import OwnerTabNavigator from "./OwnerTabNavigator";

const Stack = createNativeStackNavigator();

export default function OwnerRootNavigator() {
  const { loading, isAuthenticated } = useOwnerAuth();

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="OwnerTabs" component={OwnerTabNavigator} />
      ) : (
        <Stack.Screen name="OwnerAuth" component={OwnerAuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
