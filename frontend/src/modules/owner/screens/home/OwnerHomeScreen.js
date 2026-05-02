import React, { useMemo, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import SectionHeader from "../../../../components/common/SectionHeader";
import { appTheme } from "../../../../theme";
import { useRoleAuth } from "../../../../context/RoleAuthContext";
import { useOwnerAuth } from "../../context/OwnerAuthContext";
import { useOwnerListings } from "../../context/OwnerListingsContext";
import DashboardStatCard from "../../components/cards/DashboardStatCard";
import OwnerRoomCard from "../../components/cards/OwnerRoomCard";
import EmptyState from "../../../../components/common/EmptyState";
import AppButton from "../../../../components/common/AppButton";

export default function OwnerHomeScreen({ navigation }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const { owner } = useOwnerAuth();
  const { logout } = useRoleAuth();
  const { listings, bookingRequests, analytics, toggleListingStatus, removeListing } =
    useOwnerListings();

  const notifications = useMemo(
    () =>
      [...bookingRequests]
        .sort(
          (left, right) =>
            new Date(right.requestedAt).getTime() - new Date(left.requestedAt).getTime()
        )
        .map((request) => ({
          id: request.id,
          title: `${request.studentName} requested ${request.roomTitle}`,
          message:
            request.message || "A student sent a booking request and is waiting for your response.",
          status: request.status,
          requestedAt: request.requestedAt,
        })),
    [bookingRequests]
  );

  const pendingNotificationCount = notifications.filter(
    (notification) => notification.status === "Pending"
  ).length;

  function confirmDelete(listingId) {
    Alert.alert("Delete Listing", "Are you sure you want to delete this room listing?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const result = await removeListing(listingId);
          if (!result.success) {
            Alert.alert("Delete Failed", result.message);
          }
        },
      },
    ]);
  }

  return (
    <ScreenContainer>
      <View style={styles.banner}>
        <View style={styles.bannerHeader}>
          <View style={styles.bannerCopy}>
            <Text style={styles.eyebrow}>Owner console</Text>
            <Text style={styles.title}>Welcome, {owner?.name?.split(" ")[0]}</Text>
            <Text style={styles.subtitle}>
              Manage your listings, availability, and student interest from one dashboard.
            </Text>
          </View>
          <View style={styles.bannerActions}>
            <Pressable
              style={styles.notificationButton}
              onPress={() => setShowNotifications(true)}
            >
              <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
              {pendingNotificationCount > 0 ? (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {pendingNotificationCount}
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

      <View style={styles.grid}>
        <DashboardStatCard label="Total Listings" value={analytics.totalListings} icon="business-outline" accentColor={appTheme.colors.primaryDark} />
        <DashboardStatCard label="Available Rooms" value={analytics.availableRooms} icon="checkmark-circle-outline" accentColor={appTheme.colors.success} />
        <DashboardStatCard label="Enquiries" value={analytics.totalEnquiries} icon="mail-open-outline" accentColor={appTheme.colors.warning} />
        <DashboardStatCard label="Booking Requests" value={analytics.totalBookingRequests} icon="document-text-outline" accentColor={appTheme.colors.info} />
      </View>

      <SectionHeader
        title="Recent listings"
        subtitle="Quick access to your most important rooms"
        rightElement={
          <Pressable onPress={() => navigation.getParent()?.navigate("OwnerListingsTab")}>
            <Text style={styles.link}>View all</Text>
          </Pressable>
        }
      />

      {listings.length === 0 ? (
        <EmptyState title="No listings yet" description="Create your first room listing to start receiving student enquiries." icon="business-outline" />
      ) : (
        listings.slice(0, 2).map((listing) => (
          <OwnerRoomCard
            key={listing.id}
            listing={listing}
            onPress={() => navigation.navigate("OwnerRoomDetails", { listingId: listing.id })}
            onEdit={() => navigation.getParent()?.navigate("OwnerListingsTab", { screen: "EditRoom", params: { listingId: listing.id } })}
            onToggleStatus={() => toggleListingStatus(listing.id)}
            onDelete={() => confirmDelete(listing.id)}
          />
        ))
      )}

      <Modal
        visible={showNotifications}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.notificationOverlay}>
          <Pressable
            style={styles.overlayDismiss}
            onPress={() => setShowNotifications(false)}
          />
          <View style={styles.notificationModal}>
            <Text style={styles.notificationTitle}>Booking Notifications</Text>
            <Text style={styles.notificationSubtitle}>
              Student room booking updates appear here for your owner dashboard.
            </Text>

            {notifications.length === 0 ? (
              <Text style={styles.emptyNotificationText}>
                No booking notifications right now.
              </Text>
            ) : (
              notifications.slice(0, 3).map((notification) => (
                <View key={notification.id} style={styles.notificationItem}>
                  <View style={styles.notificationIconWrap}>
                    <Ionicons
                      name="mail-unread-outline"
                      size={18}
                      color={appTheme.colors.primaryDark}
                    />
                  </View>
                  <View style={styles.notificationBody}>
                    <View style={styles.notificationMetaRow}>
                      <Text style={styles.notificationItemTitle}>
                        {notification.title}
                      </Text>
                      <Text
                        style={[
                          styles.notificationStatus,
                          notification.status === "Pending"
                            ? styles.pendingStatus
                            : styles.reviewedStatus,
                        ]}
                      >
                        {notification.status}
                      </Text>
                    </View>
                    <Text style={styles.notificationMessage}>{notification.message}</Text>
                    <Text style={styles.notificationTime}>
                      {new Date(notification.requestedAt).toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))
            )}

            <AppButton
              title="Close"
              variant="secondary"
              onPress={() => setShowNotifications(false)}
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: appTheme.colors.primaryDark,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.xl,
  },
  bannerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: appTheme.spacing.sm,
  },
  bannerActions: {
    alignItems: "flex-end",
    gap: appTheme.spacing.sm,
  },
  bannerCopy: {
    flex: 1,
    gap: appTheme.spacing.sm,
  },
  eyebrow: {
    color: "rgba(255,255,255,0.75)",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 12,
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
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    backgroundColor: "#F97316",
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  notificationOverlay: {
    flex: 1,
    backgroundColor: "rgba(16,24,38,0.45)",
    justifyContent: "center",
    padding: appTheme.spacing.lg,
  },
  overlayDismiss: {
    ...StyleSheet.absoluteFillObject,
  },
  notificationModal: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: 28,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
    maxHeight: "80%",
  },
  notificationTitle: {
    color: appTheme.colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  notificationSubtitle: {
    color: appTheme.colors.textMuted,
    lineHeight: 22,
  },
  emptyNotificationText: {
    color: appTheme.colors.textMuted,
    lineHeight: 22,
  },
  notificationItem: {
    flexDirection: "row",
    gap: appTheme.spacing.md,
    padding: appTheme.spacing.md,
    borderWidth: 1,
    borderColor: "#E6EEF4",
    borderRadius: appTheme.radius.md,
    backgroundColor: "#FBFDFF",
  },
  notificationIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E0F2FE",
  },
  notificationBody: {
    flex: 1,
    gap: 6,
  },
  notificationMetaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: appTheme.spacing.sm,
  },
  notificationItemTitle: {
    flex: 1,
    color: appTheme.colors.text,
    fontWeight: "800",
    lineHeight: 20,
  },
  notificationStatus: {
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  pendingStatus: {
    color: "#9A3412",
    backgroundColor: "#FFEDD5",
  },
  reviewedStatus: {
    color: "#166534",
    backgroundColor: "#DCFCE7",
  },
  notificationMessage: {
    color: appTheme.colors.textMuted,
    lineHeight: 20,
  },
  notificationTime: {
    color: appTheme.colors.textLight,
    fontSize: 12,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: appTheme.spacing.md,
  },
  link: {
    color: appTheme.colors.primaryDark,
    fontWeight: "700",
  },
});
