import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoadingOverlay from "../../../components/common/LoadingOverlay";
import { useRoleAuth } from "../../../context/RoleAuthContext";
import { useAdminAuth } from "../context/AdminAuthContext";
import AdminAuthNavigator from "./AdminAuthNavigator";
import AdminTabNavigator from "./AdminTabNavigator";

const Stack = createNativeStackNavigator();

export default function AdminRootNavigator() {
  const { role, isAuthenticated: hasSharedSession } = useRoleAuth();
  const { loading, isAuthenticated } = useAdminAuth();
  const canOpenAdminTabs = hasSharedSession && role === "admin";

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {canOpenAdminTabs || isAuthenticated ? (
        <Stack.Screen name="AdminTabs" component={AdminTabNavigator} />
      ) : (
        <Stack.Screen name="AdminAuth" component={AdminAuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
