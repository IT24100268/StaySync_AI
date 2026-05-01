import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AccountTypeScreen from "../screens/auth/AccountTypeScreen";
import AuthLandingScreen from "../screens/auth/AuthLandingScreen";
import DeliveryRootNavigator from "../modules/delivery/navigation/DeliveryRootNavigator";
import RootNavigator from "./RootNavigator";
import OwnerRootNavigator from "../modules/owner/navigation/OwnerRootNavigator";
import RestaurantRootNavigator from "../modules/restaurant/navigation/RestaurantRootNavigator";

const Stack = createNativeStackNavigator();

export default function AccountGatewayNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AuthLanding" component={AuthLandingScreen} />
      <Stack.Screen name="AccountType" component={AccountTypeScreen} />
      <Stack.Screen name="StudentPortal" component={RootNavigator} />
      <Stack.Screen name="OwnerPortal" component={OwnerRootNavigator} />
      <Stack.Screen name="RestaurantPortal" component={RestaurantRootNavigator} />
      <Stack.Screen name="DeliveryPortal" component={DeliveryRootNavigator} />
    </Stack.Navigator>
  );
}
