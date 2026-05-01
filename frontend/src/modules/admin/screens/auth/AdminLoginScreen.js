import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import AppButton from "../../../../components/common/AppButton";
import AppInput from "../../../../components/common/AppInput";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import { useRoleAuth } from "../../../../context/RoleAuthContext";
import { appTheme } from "../../../../theme";

export default function AdminLoginScreen() {
  const { login, authenticating } = useRoleAuth();
  const [email, setEmail] = useState("admin@staysync.ai");
  const [password, setPassword] = useState("password123");

  async function handleLogin() {
    const result = await login({ email, password });
    if (!result.success) {
      Alert.alert("Login Failed", result.message);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Admin Access</Text>
        <Text style={styles.title}>Platform moderation console</Text>
        <Text style={styles.subtitle}>
          Review approvals, moderate users, and monitor disputes from one secure dashboard.
        </Text>
      </View>

      <View style={styles.card}>
        <AppInput label="Admin Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
        <AppInput label="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <AppButton title="Login" onPress={handleLogin} loading={authenticating} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: appTheme.colors.primaryDark,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.xl,
    gap: appTheme.spacing.sm,
  },
  eyebrow: {
    color: "rgba(255,255,255,0.76)",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 12,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: "rgba(255,255,255,0.92)",
    lineHeight: 21,
  },
  card: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
    ...appTheme.shadow,
  },
});
