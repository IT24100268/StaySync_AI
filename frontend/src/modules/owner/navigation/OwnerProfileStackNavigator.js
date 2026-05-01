import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OwnerProfileScreen from "../screens/profile/OwnerProfileScreen";
import EditOwnerProfileScreen from "../screens/profile/EditOwnerProfileScreen";

const Stack = createNativeStackNavigator();

export default function OwnerProfileStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="OwnerProfile" component={OwnerProfileScreen} options={{ title: "Owner Profile" }} />
      <Stack.Screen name="EditOwnerProfile" component={EditOwnerProfileScreen} options={{ title: "Edit Profile" }} />
    </Stack.Navigator>
  );
}
