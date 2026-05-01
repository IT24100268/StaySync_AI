import React, { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import AppButton from "../../../../components/common/AppButton";
import { useDeliveryJobs } from "../../context/DeliveryJobsContext";
import { appTheme } from "../../../../theme";

export default function NavigationScreen() {
  const { activeDelivery, liveLocation, pushLiveLocation } = useDeliveryJobs();
  const [sharingLocation, setSharingLocation] = useState(false);
  const locationSubscriptionRef = useRef(null);
  const lastSharedAtRef = useRef(0);

  const delivery = activeDelivery;
  const lastUpdatedLabel = liveLocation?.timestamp
    ? new Date(liveLocation.timestamp).toLocaleString()
    : "Not shared yet";

  useEffect(() => {
    return () => {
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
        locationSubscriptionRef.current = null;
      }
    };
  }, []);

  async function shareCurrentLocation(location) {
    if (!delivery?.id) {
      return;
    }

    const now = Date.now();
    if (now - lastSharedAtRef.current < 5000) {
      return;
    }

    lastSharedAtRef.current = now;

    await pushLiveLocation({
      deliveryId: delivery.id,
      coordinates: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      },
      heading: Number(location.coords.heading || 0),
      speed: Number(location.coords.speed || 0),
      timestamp: new Date(location.timestamp || now).toISOString(),
    });
  }

  async function handleShareLiveLocation() {
    if (!delivery?.id) {
      Alert.alert("No Active Delivery", "Accept a delivery job before sharing live location.");
      return;
    }

    setSharingLocation(true);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Location Permission Needed", "Allow location access to share your live delivery position.");
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      await shareCurrentLocation(currentLocation);

      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
      }

      locationSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        async (nextLocation) => {
          try {
            await shareCurrentLocation(nextLocation);
          } catch (_error) {
            // Keep the watcher alive even if one update fails.
          }
        }
      );

      Alert.alert("Live Location Shared", "Real-time delivery tracking is now being shared.");
    } catch (error) {
      Alert.alert("Share Failed", error.message || "Unable to share live location right now.");
    } finally {
      setSharingLocation(false);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.card}>
        <Text style={styles.heading}>Navigation Assistance</Text>
        <Text style={styles.text}>
          Placeholder structure ready for Expo Location and maps integration.
        </Text>
        {delivery ? (
          <>
            <Text style={styles.text}>Route to restaurant: {delivery.pickupAddress}</Text>
            <Text style={styles.text}>Route to customer: {delivery.deliveryAddress}</Text>
          </>
        ) : (
          <Text style={styles.text}>Accept a delivery job to start navigation guidance.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>Live Location</Text>
        <Text style={styles.text}>Lat: {liveLocation?.lat ?? "Not shared yet"}</Text>
        <Text style={styles.text}>Lng: {liveLocation?.lng ?? "Not shared yet"}</Text>
        <Text style={styles.text}>Last update: {lastUpdatedLabel}</Text>
      </View>

      <AppButton
        title="Share Live Location"
        onPress={handleShareLiveLocation}
        loading={sharingLocation}
      />
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
    fontSize: 20,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  text: {
    color: appTheme.colors.textMuted,
    lineHeight: 21,
  },
});
