import React from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import ScreenContainer from "../../components/common/ScreenContainer";
import AppButton from "../../components/common/AppButton";
import SectionHeader from "../../components/common/SectionHeader";
import { useAuth } from "../../context/AuthContext";
import { useRoleAuth } from "../../context/RoleAuthContext";
import { appTheme } from "../../theme";

function ProfileRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const { user } = useAuth();
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
          <Text style={styles.avatarText}>{user?.name?.slice(0, 1)}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.card}>
        <SectionHeader title="Student profile" subtitle="Keep your living preferences updated." />
        <ProfileRow label="University" value={user?.university} />
        <ProfileRow label="Gender preference" value={user?.genderPreference} />
      </View>

      <View style={styles.card}>
        <SectionHeader
          title="Complaints & Reports"
          subtitle="Track room, food, and other issues you have submitted."
        />
        <Text style={styles.sectionCopy}>
          Open your complaint history to review statuses like Open, In Review, and Resolved.
        </Text>
        <AppButton title="View Complaints" onPress={() => navigation.navigate("StudentComplaints")} />
      </View>

      <AppButton title="Edit Profile" onPress={() => navigation.navigate("EditProfile")} />
      <AppButton title="Logout" variant="secondary" onPress={handleLogout} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: appTheme.colors.primary,
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
    fontSize: 14,
  },
  rowValue: {
    color: appTheme.colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  sectionCopy: {
    color: appTheme.colors.textMuted,
    lineHeight: 21,
  },
});
