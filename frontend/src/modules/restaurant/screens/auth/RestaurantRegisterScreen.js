import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import AppInput from "../../../../components/common/AppInput";
import AppButton from "../../../../components/common/AppButton";
import { appTheme } from "../../../../theme";
import { validatePassword } from "../../../../utils/validation";
import { useRestaurantAuth } from "../../context/RestaurantAuthContext";
import { validateRestaurantProfile } from "../../utils/validation";
import SelectInput from "../../components/form/SelectInput";
import { CUISINE_OPTIONS } from "../../utils/constants";

export default function RestaurantRegisterScreen({ navigation }) {
  const { signUp, authenticating } = useRestaurantAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    openingHours: "",
    cuisineType: "",
    deliveryAvailable: true,
    password: "",
  });
  const [errors, setErrors] = useState({});

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit() {
    const nextErrors = validateRestaurantProfile(form);
    if (!validatePassword(form.password)) nextErrors.password = "Password must be at least 6 characters.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const result = await signUp({
      name: form.name,
      email: form.email,
      phone: form.phone,
      address: form.address,
      openingHours: form.openingHours,
      cuisineType: form.cuisineType,
      deliveryAvailable: form.deliveryAvailable,
    });

    if (!result.success) {
      Alert.alert("Registration Failed", result.message);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.card}>
        <AppInput label="Restaurant Name" value={form.name} onChangeText={(value) => updateField("name", value)} error={errors.name} />
        <AppInput label="Email" value={form.email} onChangeText={(value) => updateField("email", value)} autoCapitalize="none" keyboardType="email-address" error={errors.email} />
        <AppInput label="Phone Number" value={form.phone} onChangeText={(value) => updateField("phone", value)} keyboardType="phone-pad" error={errors.phone} />
        <AppInput label="Address" value={form.address} onChangeText={(value) => updateField("address", value)} multiline error={errors.address} />
        <AppInput label="Opening Hours" value={form.openingHours} onChangeText={(value) => updateField("openingHours", value)} placeholder="09:00 AM - 11:00 PM" error={errors.openingHours} />
        <SelectInput label="Cuisine Type" value={form.cuisineType} options={CUISINE_OPTIONS} onChange={(value) => updateField("cuisineType", value)} error={errors.cuisineType} />
        <AppInput label="Password" value={form.password} onChangeText={(value) => updateField("password", value)} secureTextEntry error={errors.password} />
        <AppButton title="Register Restaurant" onPress={handleSubmit} loading={authenticating} />
        <AppButton title="Choose Account Type" variant="secondary" onPress={() => navigation.getParent()?.navigate("AccountType")} />
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
});
