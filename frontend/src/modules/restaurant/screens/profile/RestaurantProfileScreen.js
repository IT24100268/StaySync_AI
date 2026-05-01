import React from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import AppButton from "../../../../components/common/AppButton";
import SectionHeader from "../../../../components/common/SectionHeader";
import { useRoleAuth } from "../../../../context/RoleAuthContext";
import { appTheme } from "../../../../theme";
import { useRestaurantAuth } from "../../context/RestaurantAuthContext";

function ProfileRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{String(value)}</Text>
    </View>
  );
}

export default function RestaurantProfileScreen({ navigation }) {
  const { restaurant } = useRestaurantAuth();
  const { logout } = useRoleAuth();

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      Alert.alert("Logout Failed", error.message);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.headerCard}>
        <Text style={styles.name}>{restaurant?.name}</Text>
        <Text style={styles.email}>{restaurant?.email}</Text>
      </View>

      <View style={styles.card}>
        <SectionHeader title="Restaurant profile" subtitle="Business identity and operations." />
        <ProfileRow label="Phone" value={restaurant?.phone} />
        <ProfileRow label="Address" value={restaurant?.address} />
        <ProfileRow label="Cuisine" value={restaurant?.cuisineType} />
        <ProfileRow label="Opening Hours" value={restaurant?.openingHours} />
        <ProfileRow label="Delivery Available" value={restaurant?.deliveryAvailable ? "Yes" : "No"} />
      </View>

      <AppButton title="Edit Profile" onPress={() => navigation.navigate("EditRestaurantProfile")} />
      <AppButton title="Logout" variant="secondary" onPress={handleLogout} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: "#B9481B",
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.xl,
    gap: appTheme.spacing.sm,
  },
  name: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
  },
  email: {
    color: "rgba(255,255,255,0.9)",
  },
  card: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
    ...appTheme.shadow,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: appTheme.spacing.md,
  },
  rowLabel: {
    color: appTheme.colors.textMuted,
  },
  rowValue: {
    color: appTheme.colors.text,
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
  },
});
