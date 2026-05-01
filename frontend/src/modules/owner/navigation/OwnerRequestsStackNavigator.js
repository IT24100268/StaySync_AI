import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BookingRequestsScreen from "../screens/requests/BookingRequestsScreen";
import RoomDetailsScreen from "../screens/listings/RoomDetailsScreen";

const Stack = createNativeStackNavigator();

export default function OwnerRequestsStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="BookingRequests" component={BookingRequestsScreen} options={{ title: "Booking Requests" }} />
      <Stack.Screen name="OwnerRoomDetails" component={RoomDetailsScreen} options={{ title: "Listing Details" }} />
    </Stack.Navigator>
  );
}
