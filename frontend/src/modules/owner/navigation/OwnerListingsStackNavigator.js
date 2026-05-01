import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MyListingsScreen from "../screens/listings/MyListingsScreen";
import AddRoomScreen from "../screens/listings/AddRoomScreen";
import EditRoomScreen from "../screens/listings/EditRoomScreen";
import RoomDetailsScreen from "../screens/listings/RoomDetailsScreen";

const Stack = createNativeStackNavigator();

export default function OwnerListingsStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MyListings" component={MyListingsScreen} options={{ title: "My Listings" }} />
      <Stack.Screen name="AddRoom" component={AddRoomScreen} options={{ title: "Add New Room" }} />
      <Stack.Screen name="EditRoom" component={EditRoomScreen} options={{ title: "Edit Listing" }} />
      <Stack.Screen name="OwnerRoomDetails" component={RoomDetailsScreen} options={{ title: "Listing Details" }} />
    </Stack.Navigator>
  );
}
