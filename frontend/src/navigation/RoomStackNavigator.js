import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RoomSearchScreen from "../screens/rooms/RoomSearchScreen";
import RoomListScreen from "../screens/rooms/RoomListScreen";
import RoomDetailScreen from "../screens/rooms/RoomDetailScreen";
import FavouritesScreen from "../screens/rooms/FavouritesScreen";
import PaymentMethodScreen from "../screens/payments/PaymentMethodScreen";
import PaymentSuccessScreen from "../screens/payments/PaymentSuccessScreen";
import ComplaintFormScreen from "../screens/reports/ComplaintFormScreen";

const Stack = createNativeStackNavigator();

export default function RoomStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="RoomSearch" component={RoomSearchScreen} options={{ title: "Room Search" }} />
      <Stack.Screen name="RoomList" component={RoomListScreen} options={{ title: "Listings" }} />
      <Stack.Screen name="RoomDetail" component={RoomDetailScreen} options={{ title: "Room Details" }} />
      <Stack.Screen name="PaymentMethod" component={PaymentMethodScreen} options={{ title: "Advance Payment" }} />
      <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Favourites" component={FavouritesScreen} />
      <Stack.Screen name="ComplaintForm" component={ComplaintFormScreen} options={{ title: "Report Issue" }} />
    </Stack.Navigator>
  );
}
