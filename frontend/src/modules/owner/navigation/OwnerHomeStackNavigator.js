import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OwnerHomeScreen from "../screens/home/OwnerHomeScreen";
import RoomDetailsScreen from "../screens/listings/RoomDetailsScreen";
import BookingRequestsScreen from "../screens/requests/BookingRequestsScreen";

const Stack = createNativeStackNavigator();

export default function OwnerHomeStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="OwnerHome" component={OwnerHomeScreen} options={{ title: "Owner Dashboard" }} />
      <Stack.Screen name="OwnerRoomDetails" component={RoomDetailsScreen} options={{ title: "Listing Details" }} />
      <Stack.Screen name="OwnerBookingRequests" component={BookingRequestsScreen} options={{ title: "Booking Requests" }} />
    </Stack.Navigator>
  );
}
