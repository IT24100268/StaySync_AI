import React, { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import AppInput from "../../../../components/common/AppInput";
import AppButton from "../../../../components/common/AppButton";
import { appTheme } from "../../../../theme";
import { useRestaurantAuth } from "../../context/RestaurantAuthContext";
import { updateRestaurantProfile } from "../../services/restaurantProfileService";
import { validateRestaurantProfile } from "../../utils/validation";
import SelectInput from "../../components/form/SelectInput";
import { CUISINE_OPTIONS } from "../../utils/constants";

export default function EditRestaurantProfileScreen({ navigation, route }) {
  const { restaurant, updateCurrentRestaurant } = useRestaurantAuth();
  const [form, setForm] = useState({
    name: restaurant?.name || "",
    email: restaurant?.email || "",
    phone: restaurant?.phone || "",
    address: restaurant?.address || "",
    latitude: restaurant?.latitude ?? null,
    longitude: restaurant?.longitude ?? null,
    locationAddress: restaurant?.address || "",
    openingHours: restaurant?.openingHours || "",
    cuisineType: restaurant?.cuisineType || "",
    deliveryAvailable: restaurant?.deliveryAvailable ?? true,
    role: restaurant?.role || "restaurant",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  useEffect(() => {
    const selectedLocation = route.params?.selectedLocation;

    if (!selectedLocation) {
      return;
    }

    setForm((current) => ({
      ...current,
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      locationAddress: selectedLocation.address || current.locationAddress,
      address: current.address || selectedLocation.address || "",
    }));
    navigation.setParams({ selectedLocation: undefined });
  }, [navigation, route.params?.selectedLocation]);

  async function handleSave() {
    const nextErrors = validateRestaurantProfile(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      const updated = await updateRestaurantProfile(form);
      await updateCurrentRestaurant(updated);
      Alert.alert("Profile Updated", "Restaurant profile changes have been saved.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Update Failed", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.card}>
        <AppInput label="Restaurant Name" value={form.name} onChangeText={(value) => updateField("name", value)} error={errors.name} />
        <AppInput label="Email" value={form.email} onChangeText={(value) => updateField("email", value)} autoCapitalize="none" keyboardType="email-address" error={errors.email} />
        <AppInput label="Phone Number" value={form.phone} onChangeText={(value) => updateField("phone", value)} keyboardType="phone-pad" error={errors.phone} />
        <AppInput label="Address" value={form.address} onChangeText={(value) => updateField("address", value)} multiline error={errors.address} />
        <View style={styles.locationBlock}>
          <Text style={styles.locationLabel}>Restaurant map location</Text>
          <Pressable
            style={styles.locationPicker}
            onPress={() =>
              navigation.navigate("LocationPicker", {
                sourceRoute: "EditRestaurantProfile",
                title: "Select Restaurant Location",
                initialLatitude: form.latitude,
                initialLongitude: form.longitude,
                initialAddress: form.locationAddress || form.address,
              })
            }
          >
            <View style={styles.locationIcon}>
              <Ionicons name="location" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.locationTextGroup}>
              <Text style={styles.locationTitle}>
                {form.latitude != null && form.longitude != null
                  ? "Restaurant location selected"
                  : "Select Restaurant Location"}
              </Text>
              <Text style={styles.locationText}>
                {form.locationAddress ||
                  (form.latitude != null && form.longitude != null
                    ? `${Number(form.latitude).toFixed(6)}, ${Number(form.longitude).toFixed(6)}`
                    : "Pin your restaurant on the map for delivery distance calculations.")}
              </Text>
            </View>
          </Pressable>
          {errors.location ? <Text style={styles.error}>{errors.location}</Text> : null}
        </View>
        <AppInput label="Opening Hours" value={form.openingHours} onChangeText={(value) => updateField("openingHours", value)} error={errors.openingHours} />
        <SelectInput label="Cuisine Type" value={form.cuisineType} options={CUISINE_OPTIONS} onChange={(value) => updateField("cuisineType", value)} error={errors.cuisineType} />
        <AppButton title="Save Changes" onPress={handleSave} loading={loading} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
    ...appTheme.shadow,
  },
  locationBlock: {
    gap: appTheme.spacing.xs,
  },
  locationLabel: {
    color: appTheme.colors.text,
    fontWeight: "600",
  },
  locationPicker: {
    borderRadius: appTheme.radius.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: appTheme.spacing.sm,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: appTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  locationTextGroup: {
    flex: 1,
    gap: 2,
  },
  locationTitle: {
    color: appTheme.colors.text,
    fontWeight: "700",
  },
  locationText: {
    color: appTheme.colors.textMuted,
    lineHeight: 19,
  },
  error: {
    color: appTheme.colors.danger,
    fontSize: 12,
  },
});
