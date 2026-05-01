import React, { useState } from "react";
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import { appTheme } from "../../theme";

const BACKGROUNDS = {
  left:
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
  right:
    "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
};

export default function AuthLandingScreen({ navigation }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(true);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function goToAccountType(mode) {
    navigation.navigate("AccountType", {
      mode,
      email: form.email,
    });
  }

  return (
    <View style={styles.root}>
      <View style={styles.backgroundRow}>
        <ImageBackground source={{ uri: BACKGROUNDS.left }} style={styles.sideImage}>
          <View style={styles.overlay} />
        </ImageBackground>
        <ImageBackground source={{ uri: BACKGROUNDS.right }} style={styles.sideImage}>
          <View style={styles.overlay} />
        </ImageBackground>
      </View>

      <View style={styles.content}>
        <View style={styles.marketingCopy}>
          <Text style={styles.heroTitle}>MAKE YOUR RESERVATION</Text>
          <Text style={styles.heroSubtitle}>
            Find your perfect room near your university, order meals within your
            budget, and track deliveries live, all in one platform.
          </Text>
          <View style={styles.tagRow}>
            <View style={styles.tag}>
              <Text style={styles.tagLabel}>Room Search</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagLabel}>Food Ordering</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagLabel}>Live Tracking</Text>
            </View>
          </View>
        </View>

        <LinearGradient
          colors={["rgba(255,255,255,0.24)", "rgba(255,255,255,0.16)"]}
          style={styles.authCard}
        >
          <View style={styles.brandRow}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>S</Text>
            </View>
            <View>
              <Text style={styles.brandTitle}>StaySync AI</Text>
              <Text style={styles.brandSubtitle}>Smart Student Living</Text>
            </View>
          </View>

          <Text style={styles.loginTitle}>Login</Text>

          <AppInput
            label="Username"
            value={form.email}
            onChangeText={(value) => updateField("email", value)}
            placeholder="Email or username"
          />
          <AppInput
            label="Password"
            value={form.password}
            onChangeText={(value) => updateField("password", value)}
            placeholder="Password"
            secureTextEntry
          />

          <View style={styles.helperRow}>
            <Pressable style={styles.rememberRow} onPress={() => setRememberMe((value) => !value)}>
              <Ionicons
                name={rememberMe ? "checkbox" : "square-outline"}
                size={18}
                color="#5A9BFF"
              />
              <Text style={styles.helperText}>Remember me</Text>
            </Pressable>
            <Text style={styles.linkText}>Forgot password?</Text>
          </View>

          <AppButton title="Login" onPress={() => goToAccountType("login")} />

          <Pressable style={styles.footerRow} onPress={() => goToAccountType("register")}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Text style={styles.footerLink}>Register</Text>
          </Pressable>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#111827",
  },
  backgroundRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
  },
  sideImage: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(17,24,39,0.44)",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 40,
    gap: 28,
  },
  marketingCopy: {
    flex: 1,
    maxWidth: 560,
    paddingHorizontal: 12,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 58,
    fontWeight: "900",
    lineHeight: 64,
    maxWidth: 420,
  },
  heroSubtitle: {
    marginTop: 16,
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    lineHeight: 28,
    maxWidth: 620,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 22,
  },
  tag: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  tagLabel: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  authCard: {
    width: 390,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  logoCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  brandTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },
  brandSubtitle: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
  },
  loginTitle: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "800",
    marginBottom: 16,
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
    color: "#FFFFFF",
    fontWeight: "600",
  },
  linkText: {
    color: "#8EC5FF",
    fontWeight: "700",
  },
  footerRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    color: "rgba(255,255,255,0.84)",
  },
  footerLink: {
    color: "#8EC5FF",
    fontWeight: "800",
  },
});
