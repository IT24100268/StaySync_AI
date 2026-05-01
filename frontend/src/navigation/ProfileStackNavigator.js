import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen from "../screens/profile/ProfileScreen";
import EditProfileScreen from "../screens/profile/EditProfileScreen";
import StudentComplaintsScreen from "../screens/reports/StudentComplaintsScreen";
import ComplaintDetailsScreen from "../screens/reports/ComplaintDetailsScreen";
import ComplaintFormScreen from "../screens/reports/ComplaintFormScreen";

const Stack = createNativeStackNavigator();

export default function ProfileStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: "Edit Profile" }} />
      <Stack.Screen name="StudentComplaints" component={StudentComplaintsScreen} options={{ title: "Complaints & Reports" }} />
      <Stack.Screen name="ComplaintDetails" component={ComplaintDetailsScreen} options={{ title: "Complaint Details" }} />
      <Stack.Screen name="ComplaintForm" component={ComplaintFormScreen} options={{ title: "Report Issue" }} />
    </Stack.Navigator>
  );
}
