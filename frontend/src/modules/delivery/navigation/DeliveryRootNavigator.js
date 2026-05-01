import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoadingOverlay from "../../../components/common/LoadingOverlay";
import { useDeliveryAuth } from "../context/DeliveryAuthContext";
import DeliveryAuthNavigator from "./DeliveryAuthNavigator";
import DeliveryTabNavigator from "./DeliveryTabNavigator";

const Stack = createNativeStackNavigator();

export default function DeliveryRootNavigator() {
  const { loading, isAuthenticated } = useDeliveryAuth();

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="DeliveryTabs" component={DeliveryTabNavigator} />
      ) : (
        <Stack.Screen name="DeliveryAuth" component={DeliveryAuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
