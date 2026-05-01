import React from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import AppButton from "../../../../components/common/AppButton";
import SectionHeader from "../../../../components/common/SectionHeader";
import { appTheme } from "../../../../theme";
import { useRoleAuth } from "../../../../context/RoleAuthContext";
import { useDeliveryAuth } from "../../context/DeliveryAuthContext";
import ProfileInfoField from "../../components/common/ProfileInfoField";

export default function DeliveryProfileScreen({ navigation }) {
  const { partner } = useDeliveryAuth();
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
        <Text style={styles.name}>{partner?.name}</Text>
        <Text style={styles.email}>{partner?.email}</Text>
      </View>
      <View style={styles.card}>
        <SectionHeader title="Delivery profile" subtitle="Personal details and work preferences." />
        <ProfileInfoField label="Phone" value={partner?.phone} />
        <ProfileInfoField label="Vehicle" value={partner?.vehicleType} />
        <ProfileInfoField label="License / ID" value={partner?.licenseId} />
        <ProfileInfoField label="Rating" value={partner?.rating} />
        <ProfileInfoField label="Online Status" value={partner?.statusOnline ? "Online" : "Offline"} />
      </View>
      <AppButton title="Edit Profile" onPress={() => navigation.navigate("EditDeliveryProfile")} />
      <AppButton title="Logout" variant="secondary" onPress={handleLogout} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: "#1E7A57",
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
});
