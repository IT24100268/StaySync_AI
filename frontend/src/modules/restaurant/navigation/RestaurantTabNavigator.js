import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../../theme";
import RestaurantHomeStackNavigator from "./RestaurantHomeStackNavigator";
import MenuStackNavigator from "./MenuStackNavigator";
import OrdersStackNavigator from "./OrdersStackNavigator";
import RestaurantAnalyticsStackNavigator from "./RestaurantAnalyticsStackNavigator";
import RestaurantProfileStackNavigator from "./RestaurantProfileStackNavigator";

const Tab = createBottomTabNavigator();

function iconFor(routeName, focused) {
  const map = {
    RestaurantHomeTab: focused ? "grid" : "grid-outline",
    MenuTab: focused ? "restaurant" : "restaurant-outline",
    OrdersTab: focused ? "receipt" : "receipt-outline",
    RestaurantAnalyticsTab: focused ? "stats-chart" : "stats-chart-outline",
    RestaurantProfileTab: focused ? "person-circle" : "person-circle-outline",
  };
  return map[routeName];
}

export default function RestaurantTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#B9481B",
        tabBarInactiveTintColor: appTheme.colors.textMuted,
        tabBarStyle: {
          height: 72,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarIcon: ({ color, focused, size }) => (
          <Ionicons name={iconFor(route.name, focused)} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="RestaurantHomeTab" component={RestaurantHomeStackNavigator} options={{ title: "Home" }} />
      <Tab.Screen name="MenuTab" component={MenuStackNavigator} options={{ title: "Menu" }} />
      <Tab.Screen name="OrdersTab" component={OrdersStackNavigator} options={{ title: "Orders" }} />
      <Tab.Screen name="RestaurantAnalyticsTab" component={RestaurantAnalyticsStackNavigator} options={{ title: "Analytics" }} />
      <Tab.Screen name="RestaurantProfileTab" component={RestaurantProfileStackNavigator} options={{ title: "Profile" }} />
    </Tab.Navigator>
  );
}
