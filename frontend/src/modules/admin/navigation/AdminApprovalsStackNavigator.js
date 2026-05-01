import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ApprovalDetailsScreen from "../screens/approvals/ApprovalDetailsScreen";
import DeliveryApprovalScreen from "../screens/approvals/DeliveryApprovalScreen";
import RestaurantApprovalScreen from "../screens/approvals/RestaurantApprovalScreen";
import RoomApprovalScreen from "../screens/approvals/RoomApprovalScreen";

const Stack = createNativeStackNavigator();

export default function AdminApprovalsStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="RoomApproval" component={RoomApprovalScreen} options={{ title: "Room Approvals" }} />
      <Stack.Screen name="RestaurantApproval" component={RestaurantApprovalScreen} options={{ title: "Restaurant Approvals" }} />
      <Stack.Screen name="DeliveryApproval" component={DeliveryApprovalScreen} options={{ title: "Delivery Approvals" }} />
      <Stack.Screen name="ApprovalDetails" component={ApprovalDetailsScreen} options={{ title: "Approval Details" }} />
    </Stack.Navigator>
  );
}
