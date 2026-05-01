import React from "react";
import { Alert, Image, StyleSheet, Text, View } from "react-native";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import EmptyState from "../../../../components/common/EmptyState";
import AppButton from "../../../../components/common/AppButton";
import { useOwnerListings } from "../../context/OwnerListingsContext";
import { appTheme } from "../../../../theme";
import { formatCurrency } from "../../../../utils/format";
import { resolveOwnerRoomImageSource } from "../../utils/ownerRoomImages";

export default function RoomDetailsScreen({ route, navigation }) {
  const { listingId } = route.params || {};
  const { listings, removeListing, toggleListingStatus } = useOwnerListings();
  const listing = listings.find((item) => item.id === listingId);

  if (!listing) {
    return (
      <ScreenContainer>
        <EmptyState title="Listing unavailable" description="The selected listing could not be found." />
      </ScreenContainer>
    );
  }

  function confirmDelete() {
    Alert.alert("Delete Listing", "Are you sure you want to permanently delete this listing?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const result = await removeListing(listing.id);
          if (!result.success) {
            Alert.alert("Delete Failed", result.message);
            return;
          }
          navigation.goBack();
        },
      },
    ]);
  }

  async function handleStatusToggle() {
    const result = await toggleListingStatus(listing.id);
    if (!result.success) {
      Alert.alert("Update Failed", result.message);
    }
  }

  return (
    <ScreenContainer>
      {listing.images.map((image, index) => (
        <Image
          key={`${image}-${index}`}
          source={resolveOwnerRoomImageSource(image)}
          style={styles.image}
        />
      ))}

      <View style={styles.card}>
        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.price}>{formatCurrency(listing.rent)} / month</Text>
        <Text style={styles.meta}>Deposit: {formatCurrency(listing.deposit)}</Text>
        <Text style={styles.meta}>
          {listing.roomType} | {listing.genderAllowed} | Capacity {listing.maxCapacity}
        </Text>
        <Text style={styles.meta}>{listing.address}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.text}>{listing.description}</Text>
        <Text style={styles.sectionTitle}>Rules</Text>
        <Text style={styles.text}>{listing.rules}</Text>
        <Text style={styles.sectionTitle}>Performance</Text>
        <Text style={styles.text}>
          Views {listing.viewsCount} | Enquiries {listing.enquiriesCount}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Facilities</Text>
        <View style={styles.wrap}>
          {listing.facilities.map((facility) => (
            <View key={facility} style={styles.tag}>
              <Text style={styles.tagLabel}>{facility}</Text>
            </View>
          ))}
        </View>
      </View>

      <AppButton
        title="Edit Listing"
        onPress={() => navigation.navigate("EditRoom", { listingId: listing.id })}
      />
      <AppButton
        title={listing.status === "available" ? "Mark Unavailable" : "Mark Available"}
        variant="secondary"
        onPress={handleStatusToggle}
      />
      <AppButton title="Delete Listing" variant="secondary" onPress={confirmDelete} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: 220,
    borderRadius: appTheme.radius.lg,
  },
  card: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.sm,
    ...appTheme.shadow,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  price: {
    color: appTheme.colors.primaryDark,
    fontSize: 18,
    fontWeight: "800",
  },
  meta: {
    color: appTheme.colors.textMuted,
  },
  sectionTitle: {
    color: appTheme.colors.text,
    fontWeight: "800",
    fontSize: 18,
  },
  text: {
    color: appTheme.colors.textMuted,
    lineHeight: 22,
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: appTheme.colors.chipBg,
    borderRadius: appTheme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: appTheme.spacing.sm,
    marginBottom: appTheme.spacing.sm,
  },
  tagLabel: {
    color: appTheme.colors.primaryDark,
    fontWeight: "700",
  },
});
