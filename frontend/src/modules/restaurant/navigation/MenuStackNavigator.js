import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MenuListScreen from "../screens/menu/MenuListScreen";
import AddFoodItemScreen from "../screens/menu/AddFoodItemScreen";
import EditFoodItemScreen from "../screens/menu/EditFoodItemScreen";
import FoodItemDetailsScreen from "../screens/menu/FoodItemDetailsScreen";

const Stack = createNativeStackNavigator();

export default function MenuStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MenuList" component={MenuListScreen} options={{ title: "Menu Items" }} />
      <Stack.Screen name="AddFoodItem" component={AddFoodItemScreen} options={{ title: "Add Food Item" }} />
      <Stack.Screen name="EditFoodItem" component={EditFoodItemScreen} options={{ title: "Edit Food Item" }} />
      <Stack.Screen name="FoodItemDetails" component={FoodItemDetailsScreen} options={{ title: "Food Item Details" }} />
    </Stack.Navigator>
  );
}
