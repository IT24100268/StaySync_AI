import React, { useState } from "react";
import LoadingOverlay from "../components/common/LoadingOverlay";
import { useRoleAuth } from "../context/RoleAuthContext";
import SplashScreen from "../screens/auth/SplashScreen";
import AuthStackNavigator from "./AuthStackNavigator";
import AppStackNavigator from "./AppStackNavigator";

export default function RootNavigator() {
  const { loading, isAuthenticated } = useRoleAuth();
  const [showLaunchSplash, setShowLaunchSplash] = useState(true);

  if (loading) {
    return <LoadingOverlay />;
  }

  if (showLaunchSplash) {
    return <SplashScreen onFinish={() => setShowLaunchSplash(false)} />;
  }

  return isAuthenticated ? <AppStackNavigator /> : <AuthStackNavigator />;
}
