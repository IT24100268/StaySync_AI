import "react-native-gesture-handler";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppProviders from "./src/context/AppProviders";
import { RoleAuthProvider } from "./src/context/RoleAuthContext";
import AdminAppProviders from "./src/modules/admin/context/AdminAppProviders";
import DeliveryAppProviders from "./src/modules/delivery/context/DeliveryAppProviders";
import OwnerAppProviders from "./src/modules/owner/context/OwnerAppProviders";
import RestaurantAppProviders from "./src/modules/restaurant/context/RestaurantAppProviders";
import RootNavigator from "./src/navigation/RootNavigator";
import { navigationTheme } from "./src/theme";

export default function App() {
  return (
    <SafeAreaProvider>
      <RoleAuthProvider>
        <AppProviders>
          <OwnerAppProviders>
            <RestaurantAppProviders>
              <DeliveryAppProviders>
                <AdminAppProviders>
                  <NavigationContainer theme={navigationTheme}>
                    <StatusBar style="dark" />
                    <RootNavigator />
                  </NavigationContainer>
                </AdminAppProviders>
              </DeliveryAppProviders>
            </RestaurantAppProviders>
          </OwnerAppProviders>
        </AppProviders>
      </RoleAuthProvider>
    </SafeAreaProvider>
  );
}
