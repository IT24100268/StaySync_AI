import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AppButton from "../../../../components/common/AppButton";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import SectionHeader from "../../../../components/common/SectionHeader";
import { useRoleAuth } from "../../../../context/RoleAuthContext";
import { appTheme } from "../../../../theme";
import DashboardStatCard from "../../components/cards/DashboardStatCard";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useApprovalManagement } from "../../context/ApprovalManagementContext";
import { useMonitoring } from "../../context/MonitoringContext";
import { useUserManagement } from "../../context/UserManagementContext";

export default function AdminHomeScreen({ navigation }) {
  const { admin } = useAdminAuth();
  const { logout } = useRoleAuth();
  const { summary: approvalSummary } = useApprovalManagement();
  const { summary: userSummary } = useUserManagement();
  const { summary: monitoringSummary } = useMonitoring();

  return (
    <ScreenContainer>
      <View style={styles.banner}>
        <View style={styles.bannerCopy}>
          <Text style={styles.eyebrow}>Admin console</Text>
          <Text style={styles.title}>Welcome, {admin?.name}</Text>
          <Text style={styles.subtitle}>
            Platform-level visibility across approvals, users, disputes, and live operations.
          </Text>
        </View>
        <AppButton title="Logout" variant="secondary" onPress={logout} />
      </View>

      <View style={styles.grid}>
        <DashboardStatCard label="Total Users" value={userSummary.totalUsers} icon="people-outline" />
        <DashboardStatCard label="Students" value={userSummary.totalStudents} icon="school-outline" accentColor={appTheme.colors.info} />
        <DashboardStatCard label="Room Owners" value={userSummary.totalRoomOwners} icon="business-outline" accentColor={appTheme.colors.primaryDark} />
        <DashboardStatCard label="Restaurants" value={userSummary.totalRestaurants} icon="restaurant-outline" accentColor={appTheme.colors.warning} />
        <DashboardStatCard label="Delivery Partners" value={userSummary.totalDeliveryPartners} icon="bicycle-outline" accentColor={appTheme.colors.success} />
        <DashboardStatCard label="Pending Rooms" value={approvalSummary.pendingRoomListings} icon="bed-outline" accentColor={appTheme.colors.warning} />
        <DashboardStatCard label="Pending Restaurants" value={approvalSummary.pendingRestaurantApprovals} icon="storefront-outline" accentColor={appTheme.colors.warning} />
        <DashboardStatCard label="Pending Delivery" value={approvalSummary.pendingDeliveryApprovals} icon="car-outline" accentColor={appTheme.colors.warning} />
        <DashboardStatCard label="Active Orders" value={monitoringSummary.activeOrders} icon="receipt-outline" accentColor={appTheme.colors.info} />
        <DashboardStatCard label="Disputes" value={monitoringSummary.disputesCount} icon="alert-circle-outline" accentColor={appTheme.colors.danger} />
      </View>

      <SectionHeader title="Moderation shortcuts" subtitle="Open the queues that need action first." />
      <View style={styles.quickLinks}>
        <QuickLink
          label={`Room approvals (${approvalSummary.pendingRoomListings})`}
          onPress={() => navigation.getParent()?.navigate("AdminApprovalsTab", { screen: "RoomApproval" })}
        />
        <QuickLink
          label={`Restaurant approvals (${approvalSummary.pendingRestaurantApprovals})`}
          onPress={() =>
            navigation.getParent()?.navigate("AdminApprovalsTab", { screen: "RestaurantApproval" })
          }
        />
        <QuickLink
          label={`Delivery approvals (${approvalSummary.pendingDeliveryApprovals})`}
          onPress={() => navigation.getParent()?.navigate("AdminApprovalsTab", { screen: "DeliveryApproval" })}
        />
        <QuickLink label="User moderation" onPress={() => navigation.getParent()?.navigate("AdminUsersTab")} />
        <QuickLink label="Reports and logs" onPress={() => navigation.getParent()?.navigate("AdminReportsTab")} />
        <QuickLink label="Orders and disputes" onPress={() => navigation.getParent()?.navigate("AdminOrdersTab")} />
      </View>
    </ScreenContainer>
  );
}

function QuickLink({ label, onPress }) {
  return (
    <Pressable style={styles.quickLink} onPress={onPress}>
      <Text style={styles.quickLinkLabel}>{label}</Text>
      <Text style={styles.quickLinkArrow}>Open</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: appTheme.colors.primaryDark,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.xl,
    gap: appTheme.spacing.md,
  },
  bannerCopy: {
    gap: appTheme.spacing.sm,
  },
  eyebrow: {
    color: "rgba(255,255,255,0.75)",
    textTransform: "uppercase",
    fontSize: 12,
    letterSpacing: 1,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: "rgba(255,255,255,0.92)",
    lineHeight: 21,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: appTheme.spacing.md,
  },
  quickLinks: {
    gap: appTheme.spacing.md,
  },
  quickLink: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: appTheme.spacing.md,
    ...appTheme.shadow,
  },
  quickLinkLabel: {
    flex: 1,
    color: appTheme.colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  quickLinkArrow: {
    color: appTheme.colors.primaryDark,
    fontWeight: "700",
  },
});
