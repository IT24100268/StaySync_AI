import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import StaySyncLogo from "../../components/common/StaySyncLogo";
import { appTheme } from "../../theme";
import { useRoleAuth } from "../../context/RoleAuthContext";
import { validateLoginForm } from "../../utils/authValidation";

const BACKGROUNDS = {
  left:
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
  right:
    "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
};

export default function LoginScreen({ navigation }) {
  const { login, authenticating } = useRoleAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleLogin() {
    if (authenticating) {
      return;
    }

    const nextErrors = validateLoginForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const result = await login(form);
    if (!result.success) {
      Alert.alert("Login Failed", result.message);
    }
  }

  return (
    <ImageBackground source={{ uri: BACKGROUNDS.left }} style={styles.root}>
      <LinearGradient
        colors={["rgba(10,20,40,0.78)", "rgba(16,24,39,0.48)", "rgba(10,20,40,0.88)"]}
        style={styles.overlay}
      >
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.topSection}>
                <View style={styles.brandRow}>
                  <StaySyncLogo size={62} />
                  <View>
                    <Text style={styles.brandTitle}>StaySync AI</Text>
                    <Text style={styles.brandSubtitle}>Smart Student Living</Text>
                  </View>
                </View>

                <Text style={styles.heroTitle}>Welcome Back</Text>
                <Text style={styles.heroSubtitle}>
                  Login to continue your room search, food ordering, and live
                  tracking experience.
                </Text>

                <View style={styles.chipRow}>
                  <FeatureChip label="Room Booking" />
                  <FeatureChip label="Food Ordering" />
                
                </View>
              </View>

              <View style={styles.loginCardShell}>
                <BlurView intensity={40} tint="light" style={styles.blurLayer}>
                  <LinearGradient
                    colors={["rgba(255,255,255,0.78)", "rgba(244,248,255,0.68)"]}
                    style={styles.loginCard}
                  >
                    <Text style={styles.loginTitle}>Login</Text>
                    <Text style={styles.loginSubtitle}>
                      Use your registered email and password to continue.
                    </Text>

                    <AppInput
                      label="Email or Username"
                      value={form.email}
                      onChangeText={(value) => updateField("email", value)}
                      placeholder="Enter your email"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      leftIcon="mail-outline"
                      error={errors.email}
                    />
                    <AppInput
                      label="Password"
                      value={form.password}
                      onChangeText={(value) => updateField("password", value)}
                      placeholder="Enter your password"
                      secureTextEntry={!showPassword}
                      leftIcon="lock-closed-outline"
                      rightElement={
                        <Pressable onPress={() => setShowPassword((value) => !value)}>
                          <Ionicons
                            name={showPassword ? "eye-off-outline" : "eye-outline"}
                            size={20}
                            color={appTheme.colors.textMuted}
                          />
                        </Pressable>
                      }
                      error={errors.password}
                    />

                    <View style={styles.helperRow}>
                      <Pressable
                        style={styles.rememberRow}
                        onPress={() => setRememberMe((value) => !value)}
                      >
                        <Ionicons
                          name={rememberMe ? "checkbox" : "square-outline"}
                          size={20}
                          color="#3B82F6"
                        />
                        <Text style={styles.helperText}>Remember me</Text>
                      </Pressable>
                      <Pressable onPress={() => navigation.navigate("ForgotPassword")}>
                        <Text style={styles.linkText}>Forgot password?</Text>
                      </Pressable>
                    </View>

                    <AppButton title="Login" onPress={handleLogin} loading={authenticating} />

                    <Pressable
                      style={styles.footerRow}
                      onPress={() => navigation.navigate("ChooseAccountType")}
                    >
                      <Text style={styles.footerText}>Don't have an account? </Text>
                      <Text style={styles.footerLink}>Register</Text>
                    </Pressable>
                  </LinearGradient>
                </BlurView>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}

function FeatureChip({ label }) {
  return (
    <View style={styles.featureChip}>
      <Text style={styles.featureChipLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 24,
  },
  topSection: {
    paddingTop: 8,
    gap: 18,
  },
  heroTitle: {
    color: "#ececf5",
    fontSize: 42,
    fontWeight: "900",
    lineHeight: 46,
    maxWidth: 300,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 340,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  featureChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  featureChipLabel: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  loginCard: {
    borderRadius: 28,
    padding: 22,
  },
  loginCardShell: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.46)",
    shadowColor: "#0F172A",
    shadowOpacity: 0.22,
    shadowRadius: 22,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    elevation: 8,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  blurLayer: {
    borderRadius: 28,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
  },
  brandSubtitle: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 15,
  },
  loginTitle: {
    marginTop: 18,
    color: appTheme.colors.text,
    fontSize: 32,
    fontWeight: "800",
  },
  loginSubtitle: {
    marginTop: 6,
    marginBottom: 18,
    color: appTheme.colors.textMuted,
    lineHeight: 21,
  },
  helperRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  helperText: {
    color: appTheme.colors.text,
    fontWeight: "600",
  },
  linkText: {
    color: "#3B82F6",
    fontWeight: "700",
  },
  footerRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    color: appTheme.colors.textMuted,
  },
  footerLink: {
    color: "#3B82F6",
    fontWeight: "800",
  },
});
