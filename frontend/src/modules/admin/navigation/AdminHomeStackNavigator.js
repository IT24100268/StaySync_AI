import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ApprovalDetailsScreen from "../screens/approvals/ApprovalDetailsScreen";
import AdminHomeScreen from "../screens/home/AdminHomeScreen";
import ReportDetailsScreen from "../screens/reports/ReportDetailsScreen";
import UserDetailsScreen from "../screens/users/UserDetailsScreen";

const Stack = createNativeStackNavigator();

export default function AdminHomeStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AdminHome" component={AdminHomeScreen} options={{ title: "Admin Dashboard" }} />
      <Stack.Screen name="ApprovalDetails" component={ApprovalDetailsScreen} options={{ title: "Approval Details" }} />
      <Stack.Screen name="UserDetails" component={UserDetailsScreen} options={{ title: "User Details" }} />
      <Stack.Screen name="ReportDetails" component={ReportDetailsScreen} options={{ title: "Report Details" }} />
    </Stack.Navigator>
  );
}
