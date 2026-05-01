import React from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import AppButton from "../../../../components/common/AppButton";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import SectionHeader from "../../../../components/common/SectionHeader";
import { appTheme } from "../../../../theme";
import StatusBadge from "../../components/cards/StatusBadge";
import { useUserManagement } from "../../context/UserManagementContext";

export default function UserDetailsScreen({ route }) {
  const { userId } = route.params;
  const { getUserDetails, toggleBlockUser } = useUserManagement();
  const user = getUserDetails(userId);

  if (!user) {
    return (
      <ScreenContainer>
        <Text>User not found.</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.headerCard}>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <StatusBadge status={user.isBlocked ? "Blocked" : user.status} />
      </View>
      <View style={styles.card}>
        <SectionHeader title="User details" subtitle="Role, moderation, and account metadata." />
        {Object.entries(user).map(([key, value]) => (
          <View key={key} style={styles.row}>
            <Text style={styles.rowLabel}>{key}</Text>
            <Text style={styles.rowValue}>{String(value)}</Text>
          </View>
        ))}
      </View>
      <AppButton
        title={user.isBlocked ? "Unblock User" : "Block User"}
        variant={user.isBlocked ? "primary" : "secondary"}
        onPress={async () => {
          const result = await toggleBlockUser(user.id, user.blockedReason || "Blocked by admin.");
          if (!result.success) {
            Alert.alert("Update Failed", result.message);
          }
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: appTheme.colors.primaryDark,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.xl,
    gap: appTheme.spacing.sm,
  },
  name: {
    color: "#FFFFFF",
    fontSize: 26,
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
    flex: 1,
  },
  rowValue: {
    color: appTheme.colors.text,
    flex: 1,
    textAlign: "right",
    fontWeight: "700",
  },
});
