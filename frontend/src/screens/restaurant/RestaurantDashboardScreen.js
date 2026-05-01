import React from "react";
import { StyleSheet, Text, View } from "react-native";
import ScreenContainer from "../../components/common/ScreenContainer";
import AppButton from "../../components/common/AppButton";
import { useRoleAuth } from "../../context/RoleAuthContext";
import { appTheme } from "../../theme";

export default function RestaurantDashboardScreen() {
  const { user, logout } = useRoleAuth();

  return (
    <ScreenContainer>
      <View style={styles.card}>
        <Text style={styles.title}>Restaurant Dashboard</Text>
        <Text style={styles.subtitle}>Welcome, {user?.name}</Text>
        <Text style={styles.meta}>This is a placeholder restaurant dashboard home screen.</Text>
      </View>
      <AppButton title="Logout" onPress={logout} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.xl,
    gap: appTheme.spacing.sm,
    ...appTheme.shadow,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "700",
    color: appTheme.colors.primary,
  },
  meta: {
    color: appTheme.colors.textMuted,
  },
});
