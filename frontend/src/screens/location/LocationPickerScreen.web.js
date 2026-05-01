import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import { appTheme } from "../../theme";

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

    return {
      latitude: "",
      longitude: "",
      address: route.params?.initialAddress || "",
    };
  }, [initialLatitude, initialLongitude, route.params?.initialAddress]);

  const [latitude, setLatitude] = useState(
    initialLocation.latitude === "" ? "" : String(initialLocation.latitude)
  );
  const [longitude, setLongitude] = useState(
    initialLocation.longitude === "" ? "" : String(initialLocation.longitude)
  );
  const [address, setAddress] = useState(initialLocation.address);

  function confirmSelection() {
    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);

    if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude) || !sourceRoute) {
      Alert.alert("Location Missing", "Enter valid latitude and longitude values.");
      return;
    }

    navigation.navigate({
      name: sourceRoute,
      params: {
        selectedLocation: {
          latitude: parsedLatitude,
          longitude: parsedLongitude,
          address,
        },
      },
      merge: true,
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          Web fallback: enter the coordinates manually. The interactive map is available on Android and iOS.
        </Text>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="information-circle-outline" size={18} color={appTheme.colors.info} />
          <Text style={styles.infoText}>
            Open the app on a mobile device for tap-to-pin map selection.
          </Text>
        </View>
      </View>

      <View style={styles.formCard}>
        <AppInput
          label="Latitude"
          value={latitude}
          onChangeText={setLatitude}
          keyboardType="decimal-pad"
          placeholder="43.6532"
        />
        <AppInput
          label="Longitude"
          value={longitude}
          onChangeText={setLongitude}
          keyboardType="decimal-pad"
          placeholder="-79.3832"
        />
        <AppInput
          label="Address"
          value={address}
          onChangeText={setAddress}
          placeholder="Optional address label"
          multiline
        />
      </View>

      <View style={styles.actions}>
        <AppButton title="Confirm Location" onPress={confirmSelection} />
        <Pressable style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
  },
  header: {
    gap: appTheme.spacing.xs,
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
  infoCard: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.md,
    ...appTheme.shadow,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: appTheme.spacing.sm,
  },
  infoText: {
    color: appTheme.colors.textMuted,
    flex: 1,
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
    ...appTheme.shadow,
  },
  actions: {
    gap: appTheme.spacing.sm,
  },
  cancelButton: {
    minHeight: 52,
    borderRadius: appTheme.radius.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: appTheme.colors.surface,
  },
  cancelText: {
    color: appTheme.colors.primary,
    fontWeight: "700",
  },
});
