import React from "react";
import { Alert, Platform, StyleSheet, Text, View } from "react-native";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import EmptyState from "../../../../components/common/EmptyState";
import StatusTimeline from "../../../../components/orders/StatusTimeline";
import AppButton from "../../../../components/common/AppButton";
import { MapView, Marker } from "../../../../components/maps/MapPrimitives";
import { useDeliveryJobs } from "../../context/DeliveryJobsContext";
import { appTheme } from "../../../../theme";
import { formatCurrency } from "../../../../utils/format";

const timelineMap = {
  Available: "Placed",
  Accepted: "Placed",
  "Picked Up": "Preparing",
  "On The Way": "Out for Delivery",
  Delivered: "Delivered",
};

export default function DeliveryDetailsScreen({ route, navigation }) {
  const { deliveryId, source } = route.params || {};
  const { availableJobs, activeDelivery, deliveryHistory, acceptJob, setDeliveryStatus } = useDeliveryJobs();

  const delivery =
    (source === "active" && activeDelivery?.id === deliveryId && activeDelivery) ||
    availableJobs.find((job) => job.id === deliveryId) ||
    deliveryHistory.find((job) => job.id === deliveryId);

  if (!delivery) {
    return (
      <ScreenContainer>
        <EmptyState title="Delivery unavailable" description="The selected delivery could not be found." />
      </ScreenContainer>
    );
  }

  const nextStepMap = {
    Accepted: "Picked Up",
    "Picked Up": "On The Way",
    "On The Way": "Delivered",
  };
  const pickupLat = Number(delivery.pickupLat);
  const pickupLng = Number(delivery.pickupLng);
  const dropLat = Number(delivery.deliveryLat);
  const dropLng = Number(delivery.deliveryLng);
  const hasPickupCoords = Number.isFinite(pickupLat) && Number.isFinite(pickupLng);
  const hasDropCoords = Number.isFinite(dropLat) && Number.isFinite(dropLng);
  const hasMapPreview = hasPickupCoords && hasDropCoords;
  const mapRegion = hasMapPreview
    ? {
        latitude: (pickupLat + dropLat) / 2,
        longitude: (pickupLng + dropLng) / 2,
        latitudeDelta: Math.max(Math.abs(pickupLat - dropLat) * 2, 0.02),
        longitudeDelta: Math.max(Math.abs(pickupLng - dropLng) * 2, 0.02),
      }
    : null;

  return (
    <ScreenContainer>
      <View style={styles.card}>
        <Text style={styles.heading}>Restaurant Details</Text>
        <Text style={styles.text}>{delivery.restaurantName}</Text>
        <Text style={styles.text}>{delivery.restaurantPhone}</Text>
        <Text style={styles.text}>{delivery.pickupAddress}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.heading}>Customer Details</Text>
        <Text style={styles.text}>{delivery.customerName}</Text>
        <Text style={styles.text}>{delivery.customerPhone}</Text>
        <Text style={styles.text}>{delivery.deliveryAddress}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.heading}>Order Items</Text>
        {delivery.items.map((item) => (
          <Text key={item.id} style={styles.text}>
            {item.name} x {item.qty}
          </Text>
        ))}
        <Text style={styles.earnings}>Estimated earnings: {formatCurrency(delivery.estimatedEarnings)}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.heading}>Map Preview</Text>
        {hasMapPreview && MapView && Marker ? (
          <>
            <MapView style={styles.map} initialRegion={mapRegion}>
              <Marker
                coordinate={{ latitude: pickupLat, longitude: pickupLng }}
                title="Pickup"
                description={delivery.pickupAddress}
                pinColor="#1E7A57"
              />
              <Marker
                coordinate={{ latitude: dropLat, longitude: dropLng }}
                title="Drop"
                description={delivery.deliveryAddress}
                pinColor="#D97706"
              />
            </MapView>
            <Text style={styles.text}>Pickup: {delivery.pickupAddress}</Text>
            <Text style={styles.text}>Drop: {delivery.deliveryAddress}</Text>
          </>
        ) : (
          <>
            <Text style={styles.text}>Pickup location preview is not available yet.</Text>
            <Text style={styles.text}>Drop location preview is not available yet.</Text>
          </>
        )}
      </View>
      <StatusTimeline currentStatus={timelineMap[delivery.status] || "Placed"} />
      {delivery.status === "Available" ? (
        <AppButton
          title="Accept Delivery"
          onPress={async () => {
            const result = await acceptJob(delivery.id);

            if (result.success) {
              navigation.navigate("ActiveDelivery");
              return;
            }

            Alert.alert("Accept Job Failed", result.message || "Unable to accept this delivery job.");
          }}
        />
      ) : null}
      {nextStepMap[delivery.status] ? (
        <AppButton title={`Mark ${nextStepMap[delivery.status]}`} onPress={() => setDeliveryStatus(nextStepMap[delivery.status])} />
      ) : null}
      <AppButton title="Navigation Assistance" variant="secondary" onPress={() => navigation.navigate("NavigationAssist")} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.sm,
    ...appTheme.shadow,
  },
  heading: {
    fontSize: 18,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  text: {
    color: appTheme.colors.textMuted,
    lineHeight: 21,
  },
  earnings: {
    color: "#1E7A57",
    fontWeight: "800",
    fontSize: 16,
  },
  map: {
    width: "100%",
    height: 220,
    borderRadius: appTheme.radius.md,
  },
});
