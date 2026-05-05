import React, { useEffect, useRef, useState } from "react";
import { Alert, Platform, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import AppButton from "../../../../components/common/AppButton";
import { useDeliveryJobs } from "../../context/DeliveryJobsContext";
import { appTheme } from "../../../../theme";

const MAX_ACCEPTABLE_LOCATION_ACCURACY_METERS = 1000;
const MAX_ROUTE_DISTANCE_KM = 200;

function toRadians(value) {
  return (Number(value) * Math.PI) / 180;
}

function calculateDistanceKm(start, end) {
  const latitude1 = Number(start?.latitude);
  const longitude1 = Number(start?.longitude);
  const latitude2 = Number(end?.latitude);
  const longitude2 = Number(end?.longitude);

  if (
    !Number.isFinite(latitude1) ||
    !Number.isFinite(longitude1) ||
    !Number.isFinite(latitude2) ||
    !Number.isFinite(longitude2)
  ) {
    return Number.POSITIVE_INFINITY;
  }

  const earthRadiusKm = 6371;
  const deltaLatitude = toRadians(latitude2 - latitude1);
  const deltaLongitude = toRadians(longitude2 - longitude1);

  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(toRadians(latitude1)) *
      Math.cos(toRadians(latitude2)) *
      Math.sin(deltaLongitude / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(earthRadiusKm * c * 10) / 10;
}

function getWebCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Browser geolocation is not available on this device."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => reject(new Error(error.message || "Unable to read browser location.")),
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  });
}

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

  function validateLocationAccuracy(location) {
    const accuracy = Number(location?.coords?.accuracy);

    if (!Number.isFinite(accuracy) || accuracy <= 0) {
      return;
    }

    if (accuracy > MAX_ACCEPTABLE_LOCATION_ACCURACY_METERS) {
      throw new Error(
        "Current device location is too inaccurate. Turn on precise location or try from the delivery phone."
      );
    }
  }

  function validateLocationAgainstRoute(location) {
    const currentCoordinates = {
      latitude: Number(location?.coords?.latitude),
      longitude: Number(location?.coords?.longitude),
    };
    const pickupCoordinates = {
      latitude: Number(delivery?.pickupLat),
      longitude: Number(delivery?.pickupLng),
    };
    const dropCoordinates = {
      latitude: Number(delivery?.deliveryLat),
      longitude: Number(delivery?.deliveryLng),
    };
    const nearestDistanceKm = Math.min(
      calculateDistanceKm(currentCoordinates, pickupCoordinates),
      calculateDistanceKm(currentCoordinates, dropCoordinates)
    );

    if (Number.isFinite(nearestDistanceKm) && nearestDistanceKm > MAX_ROUTE_DISTANCE_KM) {
      throw new Error(
        "Current device location is too far from this delivery route. Please use the actual delivery device or check browser location permissions."
      );
    }
  }

  async function shareCurrentLocation(location) {
    if (!delivery?.id) {
      return;
    }

    validateLocationAccuracy(location);
    validateLocationAgainstRoute(location);

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
      const currentLocation =
        Platform.OS === "web"
          ? await getWebCurrentPosition()
          : await (async () => {
              const permission = await Location.requestForegroundPermissionsAsync();
              if (permission.status !== "granted") {
                throw new Error("Allow location access to share your live delivery position.");
              }

              return Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
              });
            })();
      await shareCurrentLocation(currentLocation);

      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
      }

      if (Platform.OS !== "web") {
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
      }

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
