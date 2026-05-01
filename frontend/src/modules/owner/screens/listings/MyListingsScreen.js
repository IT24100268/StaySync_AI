import React from "react";
import { Alert, Pressable, StyleSheet, Text } from "react-native";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import EmptyState from "../../../../components/common/EmptyState";
import LoadingOverlay from "../../../../components/common/LoadingOverlay";
import OwnerRoomCard from "../../components/cards/OwnerRoomCard";
import { useOwnerListings } from "../../context/OwnerListingsContext";
import { appTheme } from "../../../../theme";

export default function MyListingsScreen({ navigation }) {
  const { listings, loading, removeListing, toggleListingStatus } = useOwnerListings();

  if (loading) {
    return <LoadingOverlay />;
  }

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
      <Pressable style={styles.addButton} onPress={() => navigation.navigate("AddRoom")}>
        <Text style={styles.addLabel}>Add New Listing</Text>
      </Pressable>

      {listings.length === 0 ? (
        <EmptyState
          title="No room listings yet"
          description="Create your first room or hostel listing to start receiving enquiries."
          icon="business-outline"
        />
      ) : (
        listings.map((listing) => (
          <OwnerRoomCard
            key={listing.id}
            listing={listing}
            onPress={() => navigation.navigate("OwnerRoomDetails", { listingId: listing.id })}
            onEdit={() => navigation.navigate("EditRoom", { listingId: listing.id })}
            onToggleStatus={async () => {
              const result = await toggleListingStatus(listing.id);
              if (!result.success) {
                Alert.alert("Update Failed", result.message);
              }
            }}
            onDelete={() => confirmDelete(listing.id)}
          />
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  addButton: {
    backgroundColor: appTheme.colors.primaryDark,
    borderRadius: appTheme.radius.md,
    paddingVertical: appTheme.spacing.md,
    alignItems: "center",
  },
  addLabel: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});
