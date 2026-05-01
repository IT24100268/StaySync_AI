import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ReportDetailsScreen from "../screens/reports/ReportDetailsScreen";
import ReportsLogsScreen from "../screens/reports/ReportsLogsScreen";

const Stack = createNativeStackNavigator();

export default function AdminReportsStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ReportsLogs" component={ReportsLogsScreen} options={{ title: "Reports & Logs" }} />
      <Stack.Screen name="ReportDetails" component={ReportDetailsScreen} options={{ title: "Report Details" }} />
    </Stack.Navigator>
  );
}
