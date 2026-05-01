import React from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import AppButton from "../../../../components/common/AppButton";
import SectionHeader from "../../../../components/common/SectionHeader";
import { useRoleAuth } from "../../../../context/RoleAuthContext";
import { useOwnerAuth } from "../../context/OwnerAuthContext";
import { appTheme } from "../../../../theme";

function ProfileRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function OwnerProfileScreen({ navigation }) {
  const { owner } = useOwnerAuth();
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
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{owner?.name?.slice(0, 1)}</Text>
        </View>
        <Text style={styles.name}>{owner?.name}</Text>
        <Text style={styles.email}>{owner?.email}</Text>
      </View>

      <View style={styles.card}>
        <SectionHeader title="Owner profile" subtitle="Business identity and verification details." />
        <ProfileRow label="Phone" value={owner?.phone} />
        <ProfileRow label="Hostel name" value={owner?.hostelName} />
        <ProfileRow label="Verification" value={owner?.verificationStatus} />
        <ProfileRow label="Role" value={owner?.role} />
      </View>

      <AppButton title="Edit Profile" onPress={() => navigation.navigate("EditOwnerProfile")} />
      <AppButton title="Logout" variant="secondary" onPress={handleLogout} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: appTheme.colors.primaryDark,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.xl,
    alignItems: "center",
    gap: appTheme.spacing.sm,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
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
    gap: appTheme.spacing.sm,
  },
  rowLabel: {
    color: appTheme.colors.textMuted,
  },
  rowValue: {
    color: appTheme.colors.text,
    fontWeight: "700",
  },
});
