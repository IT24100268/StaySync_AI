import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../../theme";
import DeliveryHomeStackNavigator from "./DeliveryHomeStackNavigator";
import AvailableJobsStackNavigator from "./AvailableJobsStackNavigator";
import DeliveryHistoryStackNavigator from "./DeliveryHistoryStackNavigator";
import EarningsStackNavigator from "./EarningsStackNavigator";
import DeliveryProfileStackNavigator from "./DeliveryProfileStackNavigator";

const Tab = createBottomTabNavigator();

function iconFor(routeName, focused) {
  const map = {
    DeliveryHomeTab: focused ? "speedometer" : "speedometer-outline",
    DeliveryJobsTab: focused ? "bicycle" : "bicycle-outline",
    DeliveryHistoryTab: focused ? "time" : "time-outline",
    DeliveryEarningsTab: focused ? "wallet" : "wallet-outline",
    DeliveryProfileTab: focused ? "person-circle" : "person-circle-outline",
  };
  return map[routeName];
}

export default function DeliveryTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#1E7A57",
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
      <Tab.Screen name="DeliveryHomeTab" component={DeliveryHomeStackNavigator} options={{ title: "Home" }} />
      <Tab.Screen name="DeliveryJobsTab" component={AvailableJobsStackNavigator} options={{ title: "Jobs" }} />
      <Tab.Screen name="DeliveryHistoryTab" component={DeliveryHistoryStackNavigator} options={{ title: "History" }} />
      <Tab.Screen name="DeliveryEarningsTab" component={EarningsStackNavigator} options={{ title: "Earnings" }} />
      <Tab.Screen name="DeliveryProfileTab" component={DeliveryProfileStackNavigator} options={{ title: "Profile" }} />
    </Tab.Navigator>
  );
}
