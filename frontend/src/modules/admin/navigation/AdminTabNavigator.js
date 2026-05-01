import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../../theme";
import AdminApprovalsStackNavigator from "./AdminApprovalsStackNavigator";
import AdminHomeStackNavigator from "./AdminHomeStackNavigator";
import AdminOrdersStackNavigator from "./AdminOrdersStackNavigator";
import AdminReportsStackNavigator from "./AdminReportsStackNavigator";
import AdminUsersStackNavigator from "./AdminUsersStackNavigator";

const Tab = createBottomTabNavigator();

function iconFor(routeName, focused) {
  const map = {
    AdminHomeTab: focused ? "grid" : "grid-outline",
    AdminApprovalsTab: focused ? "shield-checkmark" : "shield-checkmark-outline",
    AdminUsersTab: focused ? "people" : "people-outline",
    AdminReportsTab: focused ? "document-text" : "document-text-outline",
    AdminOrdersTab: focused ? "receipt" : "receipt-outline",
  };

  return map[routeName];
}

export default function AdminTabNavigator() {
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
          <Ionicons name={iconFor(route.name, focused)} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="AdminHomeTab" component={AdminHomeStackNavigator} options={{ title: "Home" }} />
      <Tab.Screen name="AdminApprovalsTab" component={AdminApprovalsStackNavigator} options={{ title: "Approvals" }} />
      <Tab.Screen name="AdminUsersTab" component={AdminUsersStackNavigator} options={{ title: "Users" }} />
      <Tab.Screen name="AdminReportsTab" component={AdminReportsStackNavigator} options={{ title: "Reports" }} />
      <Tab.Screen name="AdminOrdersTab" component={AdminOrdersStackNavigator} options={{ title: "Orders" }} />
    </Tab.Navigator>
  );
}
