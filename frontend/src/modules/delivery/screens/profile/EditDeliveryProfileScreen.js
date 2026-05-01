import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import AppInput from "../../../../components/common/AppInput";
import AppButton from "../../../../components/common/AppButton";
import FilterChip from "../../../../components/common/FilterChip";
import { appTheme } from "../../../../theme";
import { useDeliveryAuth } from "../../context/DeliveryAuthContext";
import { updateDeliveryPartnerProfile } from "../../services/deliveryProfileService";
import { validateDeliveryProfile } from "../../utils/validation";
import { VEHICLE_OPTIONS } from "../../utils/constants";

export default function EditDeliveryProfileScreen({ navigation }) {
  const { partner, updateCurrentPartner } = useDeliveryAuth();
  const [form, setForm] = useState({
    name: partner?.name || "",
    email: partner?.email || "",
    phone: partner?.phone || "",
    vehicleType: partner?.vehicleType || "",
    licenseId: partner?.licenseId || "",
    rating: partner?.rating || 5,
    statusOnline: partner?.statusOnline ?? false,
    role: partner?.role || "delivery",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    const nextErrors = validateDeliveryProfile(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      const updated = await updateDeliveryPartnerProfile(form);
      await updateCurrentPartner(updated);
      Alert.alert("Profile Updated", "Delivery partner profile has been updated.");
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
        <AppInput label="Full Name" value={form.name} onChangeText={(value) => updateField("name", value)} error={errors.name} />
        <AppInput label="Email" value={form.email} onChangeText={(value) => updateField("email", value)} autoCapitalize="none" keyboardType="email-address" error={errors.email} />
        <AppInput label="Phone Number" value={form.phone} onChangeText={(value) => updateField("phone", value)} keyboardType="phone-pad" error={errors.phone} />
        <AppInput label="License / ID" value={form.licenseId} onChangeText={(value) => updateField("licenseId", value)} error={errors.licenseId} />
        <View style={styles.vehicleWrap}>
          {VEHICLE_OPTIONS.map((option) => (
            <FilterChip
              key={option}
              label={option}
              selected={form.vehicleType === option}
              onPress={() => updateField("vehicleType", option)}
            />
          ))}
        </View>
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
  vehicleWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
