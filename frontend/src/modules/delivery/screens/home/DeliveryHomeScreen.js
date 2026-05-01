import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Modal } from "react-native";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import { appTheme } from "../../../../theme";
import { useRoleAuth } from "../../../../context/RoleAuthContext";
import { useDeliveryAuth } from "../../context/DeliveryAuthContext";
import { useDeliveryJobs } from "../../context/DeliveryJobsContext";
import DashboardStatCard from "../../components/cards/DashboardStatCard";
import AvailabilityToggle from "../../components/common/AvailabilityToggle";
import ActiveDeliveryCard from "../../components/cards/ActiveDeliveryCard";
import AppButton from "../../../../components/common/AppButton";

export default function DeliveryHomeScreen({ navigation }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const { partner, updateCurrentPartner } = useDeliveryAuth();
  const { logout } = useRoleAuth();
  const { analytics, activeDelivery, availableJobs, toggleAvailability } = useDeliveryJobs();
  const [online, setOnline] = useState(partner?.statusOnline ?? partner?.isAvailable ?? true);
  const partnerName = partner?.name || partner?.user?.name || "Partner";
  const latestAvailableJob = availableJobs[0] || null;

  useEffect(() => {
    setOnline(partner?.statusOnline ?? partner?.isAvailable ?? true);
  }, [partner]);

  async function handleToggle(nextValue) {
    const result = await toggleAvailability(nextValue);
    if (!result.success) {
      Alert.alert("Update Failed", result.message);
      return;
    }
    setOnline(nextValue);
    await updateCurrentPartner({
      ...partner,
      statusOnline: result.statusOnline,
      isAvailable: result.statusOnline,
      ...(result.partner || {}),
    });
  }

  return (
    <ScreenContainer>
      <View style={styles.banner}>
        <View style={styles.bannerHeader}>
          <View style={styles.bannerCopy}>
            <Text style={styles.eyebrow}>Delivery console</Text>
            <Text style={styles.title}>Hi, {partnerName.split(" ")[0]}</Text>
            <Text style={styles.subtitle}>Stay online, pick the right jobs, and manage your route flow smoothly.</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.bellButton}
              onPress={() => setShowNotifications((current) => !current)}
            >
              <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
              {availableJobs.length > 0 ? (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {availableJobs.length > 9 ? "9+" : availableJobs.length}
                  </Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable style={styles.logoutButton} onPress={logout}>
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <Modal
        visible={showNotifications}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotifications(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowNotifications(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            {latestAvailableJob ? (
              <>
                <Text style={styles.notificationEyebrow}>Current delivery notification</Text>
                <Text style={styles.notificationTitle}>
                  New delivery from {latestAvailableJob.restaurantName}
                </Text>
                <Text style={styles.notificationText}>
                  {latestAvailableJob.orderSummary} • Estimated earning Rs. {latestAvailableJob.estimatedEarnings}
                </Text>
                <Text style={styles.notificationText}>
                  Pickup: {latestAvailableJob.pickupAddress}
                </Text>
                <Text style={styles.notificationText}>
                  Drop: {latestAvailableJob.deliveryAddress}
                </Text>
                <View style={styles.notificationActions}>
                  <Pressable
                    style={styles.primaryButton}
                    onPress={() => {
                      setShowNotifications(false);
                      navigation.getParent()?.navigate("DeliveryJobsTab");
                    }}
                  >
                    <Text style={styles.primaryButtonText}>Open Jobs</Text>
                  </Pressable>
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => setShowNotifications(false)}
                  >
                    <Text style={styles.secondaryButtonText}>Close</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.notificationEyebrow}>Delivery notifications</Text>
                <Text style={styles.notificationTitle}>No current delivery notification</Text>
                <Text style={styles.notificationText}>
                  New available delivery requests will appear here when a restaurant marks an order out for delivery.
                </Text>
                <View style={styles.notificationActions}>
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => setShowNotifications(false)}
                  >
                    <Text style={styles.secondaryButtonText}>Close</Text>
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <View style={styles.toggleCard}>
        <Text style={styles.toggleLabel}>Availability</Text>
        <AvailabilityToggle value={online} onChange={handleToggle} />
      </View>

      <View style={styles.grid}>
        <DashboardStatCard label="Total Deliveries" value={analytics.totalDeliveries} icon="bicycle-outline" />
        <DashboardStatCard label="Active Deliveries" value={analytics.activeDeliveries} icon="navigate-outline" accentColor={appTheme.colors.info} />
        <DashboardStatCard label="Completed Deliveries" value={analytics.completedDeliveries} icon="checkmark-done-outline" accentColor={appTheme.colors.success} />
        <DashboardStatCard label="Today's Earnings" value={`Rs. ${analytics.todayEarnings}`} icon="cash-outline" accentColor={appTheme.colors.warning} />
      </View>

      <ActiveDeliveryCard
        delivery={activeDelivery}
        onOpen={() => navigation.navigate("ActiveDelivery")}
        onNavigate={() => navigation.navigate("NavigationAssist")}
      />

      {!activeDelivery ? (
        <AppButton title="Browse Available Jobs" onPress={() => navigation.getParent()?.navigate("DeliveryJobsTab")} />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#1E7A57",
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.xl,
  },
  bannerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: appTheme.spacing.sm,
  },
  headerActions: {
    alignItems: "flex-end",
    gap: appTheme.spacing.sm,
  },
  bannerCopy: {
    flex: 1,
    gap: appTheme.spacing.sm,
  },
  eyebrow: {
    color: "rgba(255,255,255,0.76)",
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
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bellBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  bellBadgeText: {
    color: "#1E7A57",
    fontSize: 11,
    fontWeight: "800",
  },
  logoutButton: {
    alignSelf: "flex-start",
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.xs,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  logoutText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  toggleCard: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    ...appTheme.shadow,
  },
  toggleLabel: {
    fontSize: 18,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: appTheme.spacing.md,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(16, 52, 71, 0.28)",
    justifyContent: "center",
    padding: appTheme.spacing.lg,
  },
  modalCard: {
    backgroundColor: "#EEF9F3",
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(30,122,87,0.18)",
    gap: appTheme.spacing.sm,
  },
  notificationEyebrow: {
    color: "#1E7A57",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontSize: 11,
    fontWeight: "700",
  },
  notificationTitle: {
    color: appTheme.colors.text,
    fontWeight: "800",
    fontSize: 18,
  },
  notificationText: {
    color: appTheme.colors.textMuted,
    lineHeight: 20,
  },
  notificationActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: appTheme.spacing.sm,
    marginTop: appTheme.spacing.sm,
  },
  primaryButton: {
    alignSelf: "flex-start",
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.xs,
    borderRadius: 999,
    backgroundColor: "#1E7A57",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  secondaryButton: {
    alignSelf: "flex-start",
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.xs,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  secondaryButtonText: {
    color: "#1E7A57",
    fontWeight: "700",
  },
});
