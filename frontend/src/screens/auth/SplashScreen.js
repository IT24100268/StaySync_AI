import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Asset } from "expo-asset";
import StaySyncLogo from "../../components/common/StaySyncLogo";

const SPLASH_DURATION_MS = 2400;
const LOGO_IMAGE = require("../../../assets/Logo.png");
const LOGIN_BACKGROUND_IMAGE =
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80";

export default function SplashScreen({ navigation, onFinish }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(22)).current;
  const scale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    let isMounted = true;

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 850,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 850,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 52,
        useNativeDriver: true,
      }),
    ]).start();

    async function prepareAssets() {
      const splashDelay = new Promise((resolve) => setTimeout(resolve, SPLASH_DURATION_MS));

      await Promise.allSettled([
        splashDelay,
        Asset.loadAsync(LOGO_IMAGE),
        Image.prefetch(LOGIN_BACKGROUND_IMAGE),
      ]);

      if (!isMounted) {
        return;
      }

      if (typeof onFinish === "function") {
        onFinish();
        return;
      }

      navigation?.replace("Login");
    }

    prepareAssets();

    return () => {
      isMounted = false;
    };
  }, [navigation, onFinish, opacity, scale, translateY]);

  return (
    <LinearGradient
      colors={["#14B8A6", "#0EA5E9", "#1E3A8A", "#0F172A"]}
      start={{ x: 0.05, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />

        <Animated.View
          style={[
            styles.brandingBlock,
            {
              opacity,
              transform: [{ translateY }, { scale }],
            },
          ]}
        >
          <View style={styles.logoShell}>
            <StaySyncLogo size={104} />
          </View>
          <Text style={styles.title}>StaySync AI</Text>
          <Text style={styles.subtitle}>Smart Student Living</Text>
        </Animated.View>

        <View style={styles.footer}>
          <ActivityIndicator size="small" color="#F8FAFC" />
          <Text style={styles.footerText}>Preparing your student experience</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "rgba(15,23,42,0.16)",
  },
  glowTop: {
    position: "absolute",
    top: 70,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  glowBottom: {
    position: "absolute",
    right: -30,
    bottom: 120,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(20,184,166,0.16)",
  },
  brandingBlock: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoShell: {
    width: 148,
    height: 148,
    borderRadius: 74,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    shadowColor: "#0F172A",
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 14,
    },
    elevation: 12,
    marginBottom: 26,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0.4,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    color: "rgba(226,232,240,0.92)",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    alignItems: "center",
    gap: 12,
  },
  footerText: {
    color: "rgba(226,232,240,0.78)",
    fontSize: 13,
    letterSpacing: 0.3,
  },
});
