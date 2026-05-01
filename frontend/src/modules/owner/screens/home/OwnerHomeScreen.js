import React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import SectionHeader from "../../../../components/common/SectionHeader";
import { appTheme } from "../../../../theme";
import { useRoleAuth } from "../../../../context/RoleAuthContext";
import { useOwnerAuth } from "../../context/OwnerAuthContext";
import { useOwnerListings } from "../../context/OwnerListingsContext";
import DashboardStatCard from "../../components/cards/DashboardStatCard";
import OwnerRoomCard from "../../components/cards/OwnerRoomCard";
import EmptyState from "../../../../components/common/EmptyState";

export default function OwnerHomeScreen({ navigation }) {
  const { owner } = useOwnerAuth();
  const { logout } = useRoleAuth();
  const { listings, analytics, toggleListingStatus, removeListing } = useOwnerListings();

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
          <Pressable style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
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
