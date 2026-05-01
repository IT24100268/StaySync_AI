import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../../theme";
import OwnerHomeStackNavigator from "./OwnerHomeStackNavigator";
import OwnerListingsStackNavigator from "./OwnerListingsStackNavigator";
import OwnerRequestsStackNavigator from "./OwnerRequestsStackNavigator";
import OwnerAnalyticsStackNavigator from "./OwnerAnalyticsStackNavigator";
import OwnerProfileStackNavigator from "./OwnerProfileStackNavigator";

const Tab = createBottomTabNavigator();

function tabIcon(routeName, focused) {
  const map = {
    OwnerHomeTab: focused ? "grid" : "grid-outline",
    OwnerListingsTab: focused ? "business" : "business-outline",
    OwnerRequestsTab: focused ? "mail" : "mail-outline",
    OwnerAnalyticsTab: focused ? "bar-chart" : "bar-chart-outline",
    OwnerProfileTab: focused ? "person-circle" : "person-circle-outline",
  };

  return map[routeName];
}

export default function OwnerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: appTheme.colors.primaryDark,
        tabBarInactiveTintColor: appTheme.colors.textMuted,
        tabBarStyle: {
          height: 72,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarIcon: ({ color, focused, size }) => (
          <Ionicons name={tabIcon(route.name, focused)} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="OwnerHomeTab" component={OwnerHomeStackNavigator} options={{ title: "Home" }} />
      <Tab.Screen
        name="OwnerListingsTab"
        component={OwnerListingsStackNavigator}
        options={{ title: "Listings" }}
      />
      <Tab.Screen
        name="OwnerRequestsTab"
        component={OwnerRequestsStackNavigator}
        options={{ title: "Requests" }}
      />
      <Tab.Screen
        name="OwnerAnalyticsTab"
        component={OwnerAnalyticsStackNavigator}
        options={{ title: "Analytics" }}
      />
      <Tab.Screen
        name="OwnerProfileTab"
        component={OwnerProfileStackNavigator}
        options={{ title: "Profile" }}
      />
    </Tab.Navigator>
  );
}
