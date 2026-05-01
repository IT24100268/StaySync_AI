import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import AppInput from "../../../../components/common/AppInput";
import AppButton from "../../../../components/common/AppButton";
import { appTheme } from "../../../../theme";
import { useOwnerAuth } from "../../context/OwnerAuthContext";
import { validatePassword } from "../../../../utils/validation";
import { validateOwnerProfile } from "../../utils/validation";

export default function OwnerRegisterScreen({ navigation }) {
  const { signUp, authenticating } = useOwnerAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    hostelName: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit() {
    const nextErrors = validateOwnerProfile(form);
    if (!validatePassword(form.password)) {
      nextErrors.password = "Password must be at least 6 characters.";
    }
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const result = await signUp({
      name: form.name,
      email: form.email,
      phone: form.phone,
      hostelName: form.hostelName,
    });

    if (!result.success) {
      Alert.alert("Registration Failed", result.message);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.hero}>
        <Text style={styles.title}>Register as a room owner</Text>
        <Text style={styles.subtitle}>
          Create your owner account and start managing hostel and room inventory.
        </Text>
      </View>
      <View style={styles.card}>
        <AppInput label="Full Name" value={form.name} onChangeText={(value) => updateField("name", value)} error={errors.name} />
        <AppInput label="Email" value={form.email} onChangeText={(value) => updateField("email", value)} autoCapitalize="none" keyboardType="email-address" error={errors.email} />
        <AppInput label="Phone Number" value={form.phone} onChangeText={(value) => updateField("phone", value)} keyboardType="phone-pad" error={errors.phone} />
        <AppInput label="Business / Hostel Name" value={form.hostelName} onChangeText={(value) => updateField("hostelName", value)} error={errors.hostelName} />
        <AppInput label="Password" value={form.password} onChangeText={(value) => updateField("password", value)} secureTextEntry error={errors.password} />
        <AppButton title="Register Owner" onPress={handleSubmit} loading={authenticating} />
        <AppButton
          title="Choose Account Type"
          variant="secondary"
          onPress={() => navigation.getParent()?.navigate("AccountType")}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: appTheme.spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  subtitle: {
    color: appTheme.colors.textMuted,
    lineHeight: 22,
  },
  card: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
    ...appTheme.shadow,
  },
});
