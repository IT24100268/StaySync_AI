import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import ScreenContainer from "../../components/common/ScreenContainer";
import AppInput from "../../components/common/AppInput";
import AppButton from "../../components/common/AppButton";
import { useAuth } from "../../context/AuthContext";
import {
  validateBudgetRange,
  validateEmail,
  validatePassword,
  validateRequired,
} from "../../utils/validation";
import { appTheme } from "../../theme";

export default function RegisterScreen({ navigation }) {
  const { signUp, authenticating } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    university: "",
    genderPreference: "",
    budgetRange: "",
  });
  const [errors, setErrors] = useState({});

  function handleChange(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit() {
    const nextErrors = {};

    if (!validateRequired(form.name)) nextErrors.name = "Full name is required.";
    if (!validateEmail(form.email)) nextErrors.email = "Please enter a valid email.";
    if (!validatePassword(form.password)) nextErrors.password = "Minimum 6 characters.";
    if (!validateRequired(form.university)) nextErrors.university = "University is required.";
    if (!validateRequired(form.genderPreference)) nextErrors.genderPreference = "Select a preference.";
    if (!validateBudgetRange(form.budgetRange)) nextErrors.budgetRange = "Use format 18000-30000.";

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const result = await signUp({
      name: form.name,
      email: form.email,
      university: form.university,
      genderPreference: form.genderPreference,
      budgetRange: form.budgetRange,
    });

    if (!result.success) {
      Alert.alert("Registration Failed", result.message);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.hero}>
        <Text style={styles.title}>Create your student account</Text>
        <Text style={styles.subtitle}>
          Set up your profile once and use it across rooms, orders, and bookings.
        </Text>
      </View>

      <View style={styles.form}>
        <AppInput label="Full Name" value={form.name} onChangeText={(value) => handleChange("name", value)} error={errors.name} />
        <AppInput label="Email" value={form.email} onChangeText={(value) => handleChange("email", value)} autoCapitalize="none" keyboardType="email-address" error={errors.email} />
        <AppInput label="Password" value={form.password} onChangeText={(value) => handleChange("password", value)} secureTextEntry error={errors.password} />
        <AppInput label="University" value={form.university} onChangeText={(value) => handleChange("university", value)} error={errors.university} />
        <AppInput label="Gender Preference" value={form.genderPreference} onChangeText={(value) => handleChange("genderPreference", value)} placeholder="Male / Female / Any" error={errors.genderPreference} />
        <AppInput label="Budget Range" value={form.budgetRange} onChangeText={(value) => handleChange("budgetRange", value)} placeholder="18000-30000" error={errors.budgetRange} />
        <AppButton title="Register" onPress={handleSubmit} loading={authenticating} />
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
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
    ...appTheme.shadow,
  },
});
