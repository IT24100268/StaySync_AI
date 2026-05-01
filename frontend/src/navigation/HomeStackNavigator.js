import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import StudentHomeScreen from "../screens/home/StudentHomeScreen";
import FavouritesScreen from "../screens/rooms/FavouritesScreen";
import RoomDetailScreen from "../screens/rooms/RoomDetailScreen";
import RestaurantsScreen from "../screens/food/RestaurantsScreen";
import FoodMenuScreen from "../screens/food/FoodMenuScreen";
import CartScreen from "../screens/food/CartScreen";
import CheckoutScreen from "../screens/food/CheckoutScreen";
import LocationPickerScreen from "../screens/location/LocationPickerScreen";
import OrderTrackingScreen from "../screens/orders/OrderTrackingScreen";
import RateRestaurantScreen from "../screens/orders/RateRestaurantScreen";
import PaymentMethodScreen from "../screens/payments/PaymentMethodScreen";
import PaymentSuccessScreen from "../screens/payments/PaymentSuccessScreen";
import ComplaintFormScreen from "../screens/reports/ComplaintFormScreen";
import StudentComplaintsScreen from "../screens/reports/StudentComplaintsScreen";
import ComplaintDetailsScreen from "../screens/reports/ComplaintDetailsScreen";

const Stack = createNativeStackNavigator();

export default function HomeStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="StudentHome" component={StudentHomeScreen} options={{ title: "Dashboard" }} />
      <Stack.Screen name="Favourites" component={FavouritesScreen} />
      <Stack.Screen name="RoomDetail" component={RoomDetailScreen} options={{ title: "Room Details" }} />
      <Stack.Screen name="Restaurants" component={RestaurantsScreen} />
      <Stack.Screen name="FoodMenu" component={FoodMenuScreen} options={{ title: "Food Menu" }} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="LocationPicker" component={LocationPickerScreen} options={{ title: "Select Location" }} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} options={{ title: "Track Order" }} />
      <Stack.Screen name="RateRestaurant" component={RateRestaurantScreen} options={{ title: "Rate Restaurant" }} />
      <Stack.Screen name="PaymentMethod" component={PaymentMethodScreen} options={{ title: "Advance Payment" }} />
      <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ComplaintForm" component={ComplaintFormScreen} options={{ title: "Report Issue" }} />
      <Stack.Screen name="StudentComplaints" component={StudentComplaintsScreen} options={{ title: "Complaints & Reports" }} />
      <Stack.Screen name="ComplaintDetails" component={ComplaintDetailsScreen} options={{ title: "Complaint Details" }} />
    </Stack.Navigator>
  );
}
