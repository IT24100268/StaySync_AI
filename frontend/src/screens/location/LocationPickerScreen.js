import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import AppButton from "../../components/common/AppButton";
import { MapView, Marker, PROVIDER_GOOGLE } from "../../components/maps/MapPrimitives";
import { appTheme } from "../../theme";

const DEFAULT_REGION = {
  latitude: 43.6532,
  longitude: -79.3832,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

function buildRegion(latitude, longitude) {
  return {
    latitude,
    longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };
}

function buildAddressLabel(geocode = {}) {
  return [
    geocode.name,
    geocode.street,
    geocode.streetNumber,
    geocode.district,
    geocode.city,
    geocode.region,
    geocode.postalCode,
    geocode.country,
  ]
    .filter(Boolean)
    .filter((item, index, list) => list.indexOf(item) === index)
    .join(", ");
}

export default function LocationPickerScreen({ navigation, route }) {
  const sourceRoute = route.params?.sourceRoute;
  const title = route.params?.title || "Select Location";
  const initialLatitude = Number(route.params?.initialLatitude);
  const initialLongitude = Number(route.params?.initialLongitude);

  const initialLocation = useMemo(() => {
    if (Number.isFinite(initialLatitude) && Number.isFinite(initialLongitude)) {
      return {
        latitude: initialLatitude,
        longitude: initialLongitude,
        address: route.params?.initialAddress || "",
      };
    }

    return null;
  }, [initialLatitude, initialLongitude, route.params?.initialAddress]);

  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [region, setRegion] = useState(
    initialLocation
      ? buildRegion(initialLocation.latitude, initialLocation.longitude)
      : DEFAULT_REGION
  );
  const [permissionStatus, setPermissionStatus] = useState("idle");
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [loadingAddress, setLoadingAddress] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapLocation() {
      if (Platform.OS === "web") {
        setPermissionStatus("unavailable");
        return;
      }

      try {
        setPermissionStatus("loading");
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (!isMounted) {
          return;
        }

        setPermissionStatus(status);

        if (status !== "granted") {
          return;
        }

        const currentPosition = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!isMounted) {
          return;
        }

        const nextDeviceLocation = {
          latitude: currentPosition.coords.latitude,
          longitude: currentPosition.coords.longitude,
        };

        setDeviceLocation(nextDeviceLocation);

        if (!initialLocation) {
          setRegion(buildRegion(nextDeviceLocation.latitude, nextDeviceLocation.longitude));
        }
      } catch (error) {
        if (isMounted) {
          setPermissionStatus("denied");
        }
      }
    }

    bootstrapLocation();

    return () => {
      isMounted = false;
    };
  }, [initialLocation]);

  useEffect(() => {
    let isMounted = true;

    async function loadAddress() {
      if (!selectedLocation || Platform.OS === "web") {
        return;
      }

      try {
        setLoadingAddress(true);
        const geocode = await Location.reverseGeocodeAsync({
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
        });

        if (!isMounted) {
          return;
        }

        const address = buildAddressLabel(geocode[0]);

        if (address) {
          setSelectedLocation((current) =>
            current
              ? {
                  ...current,
                  address,
                }
              : current
          );
        }
      } finally {
        if (isMounted) {
          setLoadingAddress(false);
        }
      }
    }

    loadAddress();

    return () => {
      isMounted = false;
    };
  }, [selectedLocation?.latitude, selectedLocation?.longitude]);

  function handleMapPress(event) {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({
      latitude,
      longitude,
      address: "",
    });
  }

  function useCurrentLocation() {
    if (!deviceLocation) {
      Alert.alert(
        "Location Unavailable",
        "Allow location access to use your current position."
      );
      return;
    }

    setSelectedLocation({
      latitude: deviceLocation.latitude,
      longitude: deviceLocation.longitude,
      address: "",
    });
    setRegion(buildRegion(deviceLocation.latitude, deviceLocation.longitude));
  }

  function confirmSelection() {
    if (!selectedLocation || !sourceRoute) {
      Alert.alert("Location Missing", "Please tap on the map to choose a location.");
      return;
    }

    navigation.navigate({
      name: sourceRoute,
      params: {
        selectedLocation,
      },
      merge: true,
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          Tap on the map to drop a pin and confirm the exact delivery or restaurant location.
        </Text>
        <Pressable style={styles.currentLocationButton} onPress={useCurrentLocation}>
          <Ionicons name="locate" size={16} color={appTheme.colors.primary} />
          <Text style={styles.currentLocationText}>Use current location</Text>
        </Pressable>
      </View>

      <View style={styles.mapCard}>
        {Platform.OS === "web" || !MapView ? (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderTitle}>Map selection is available on Android and iOS.</Text>
            <Text style={styles.placeholderText}>
              Open this screen on a mobile device to pin the location.
            </Text>
          </View>
        ) : (
          <MapView
            style={styles.map}
            provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
            region={region}
            onRegionChangeComplete={setRegion}
            onPress={handleMapPress}
            showsUserLocation={permissionStatus === "granted"}
            showsMyLocationButton
          >
            {selectedLocation ? <Marker coordinate={selectedLocation} /> : null}
          </MapView>
        )}

        {permissionStatus === "loading" ? (
          <View style={styles.statusBanner}>
            <ActivityIndicator color={appTheme.colors.primary} />
            <Text style={styles.statusText}>Checking location permission...</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Selected location</Text>
        <Text style={styles.summaryText}>
          Latitude: {selectedLocation ? selectedLocation.latitude.toFixed(6) : "--"}
        </Text>
        <Text style={styles.summaryText}>
          Longitude: {selectedLocation ? selectedLocation.longitude.toFixed(6) : "--"}
        </Text>
        <Text style={styles.summaryAddress}>
          {loadingAddress
            ? "Fetching address..."
            : selectedLocation?.address || "Address will appear here after you select a pin."}
        </Text>
      </View>

      <View style={styles.actions}>
        <AppButton
          title="Confirm Location"
          onPress={confirmSelection}
          disabled={!selectedLocation}
        />
        <AppButton title="Cancel" variant="secondary" onPress={() => navigation.goBack()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
    padding: appTheme.spacing.md,
    gap: appTheme.spacing.md,
  },
  header: {
    gap: appTheme.spacing.sm,
  },
  title: {
    color: appTheme.colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    color: appTheme.colors.textMuted,
    lineHeight: 20,
  },
  currentLocationButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: appTheme.colors.surface,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  currentLocationText: {
    color: appTheme.colors.primary,
    fontWeight: "700",
  },
  mapCard: {
    flex: 1,
    minHeight: 320,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: appTheme.colors.surface,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    ...appTheme.shadow,
  },
  map: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.sm,
  },
  placeholderTitle: {
    color: appTheme.colors.text,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  placeholderText: {
    color: appTheme.colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  statusBanner: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: appTheme.radius.md,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 12,
  },
  statusText: {
    color: appTheme.colors.textMuted,
    fontWeight: "600",
  },
  summaryCard: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.md,
    gap: 6,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  summaryTitle: {
    color: appTheme.colors.text,
    fontWeight: "800",
    fontSize: 16,
  },
  summaryText: {
    color: appTheme.colors.text,
    fontWeight: "600",
  },
  summaryAddress: {
    color: appTheme.colors.textMuted,
    lineHeight: 20,
    marginTop: 4,
  },
  actions: {
    gap: appTheme.spacing.sm,
  },
});
