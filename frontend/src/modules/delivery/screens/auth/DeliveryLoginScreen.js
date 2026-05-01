import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import AppInput from "../../../../components/common/AppInput";
import AppButton from "../../../../components/common/AppButton";
import { appTheme } from "../../../../theme";
import { useDeliveryAuth } from "../../context/DeliveryAuthContext";
import { validateEmail, validatePassword } from "../../../../utils/validation";

export default function DeliveryLoginScreen({ navigation }) {
  const { signIn, authenticating } = useDeliveryAuth();
  const [form, setForm] = useState({
    email: "delivery@staysync.ai",
    password: "password123",
  });
  const [errors, setErrors] = useState({});

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit() {
    const nextErrors = {};
    if (!validateEmail(form.email)) nextErrors.email = "Please enter a valid email.";
    if (!validatePassword(form.password)) nextErrors.password = "Password must be at least 6 characters.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const result = await signIn(form);
    if (!result.success) {
      Alert.alert("Login Failed", result.message);
    }
  }

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.title}>Delivery partner access</Text>
        <Text style={styles.subtitle}>
          Accept jobs, update delivery progress, and track your earnings in one place.
        </Text>
      </View>
      <View style={styles.card}>
        <AppInput label="Email" value={form.email} onChangeText={(value) => updateField("email", value)} autoCapitalize="none" keyboardType="email-address" error={errors.email} />
        <AppInput label="Password" value={form.password} onChangeText={(value) => updateField("password", value)} secureTextEntry error={errors.password} />
        <AppButton title="Login" onPress={handleSubmit} loading={authenticating} />
        <AppButton title="Create Delivery Account" variant="secondary" onPress={() => navigation.navigate("DeliveryRegister")} />
        <AppButton title="Choose Account Type" variant="secondary" onPress={() => navigation.getParent()?.navigate("AccountType")} />
        <Text style={styles.note}>Demo login: delivery@staysync.ai / password123</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: "center",
    gap: appTheme.spacing.xl,
  },
  hero: {
    gap: appTheme.spacing.sm,
  },
  title: {
    fontSize: 30,
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
  note: {
    textAlign: "center",
    color: appTheme.colors.textMuted,
    fontSize: 12,
  },
});
