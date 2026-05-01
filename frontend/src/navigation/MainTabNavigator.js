import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../theme";
import HomeStackNavigator from "./HomeStackNavigator";
import RoomStackNavigator from "./RoomStackNavigator";
import FoodStackNavigator from "./FoodStackNavigator";
import ProfileStackNavigator from "./ProfileStackNavigator";

const Tab = createBottomTabNavigator();

function iconName(routeName, focused) {
  const map = {
    HomeTab: focused ? "home" : "home-outline",
    RoomsTab: focused ? "bed" : "bed-outline",
    FoodTab: focused ? "restaurant" : "restaurant-outline",
    ProfileTab: focused ? "person" : "person-outline",
  };

  return map[routeName];
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: appTheme.colors.primary,
        tabBarInactiveTintColor: appTheme.colors.textMuted,
        tabBarStyle: {
          height: 70,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarIcon: ({ color, focused, size }) => (
          <Ionicons name={iconName(route.name, focused)} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: "Home" }} />
      <Tab.Screen name="RoomsTab" component={RoomStackNavigator} options={{ title: "Rooms" }} />
      <Tab.Screen name="FoodTab" component={FoodStackNavigator} options={{ title: "Food" }} />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{ title: "Profile" }}
      />
    </Tab.Navigator>
  );
}
