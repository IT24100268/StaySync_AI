import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RestaurantProfileScreen from "../screens/profile/RestaurantProfileScreen";
import EditRestaurantProfileScreen from "../screens/profile/EditRestaurantProfileScreen";
import LocationPickerScreen from "../../../screens/location/LocationPickerScreen";

const Stack = createNativeStackNavigator();

export default function RestaurantProfileStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="RestaurantProfile" component={RestaurantProfileScreen} options={{ title: "Restaurant Profile" }} />
      <Stack.Screen name="EditRestaurantProfile" component={EditRestaurantProfileScreen} options={{ title: "Edit Profile" }} />
      <Stack.Screen name="LocationPicker" component={LocationPickerScreen} options={{ title: "Select Location" }} />
    </Stack.Navigator>
  );
}
