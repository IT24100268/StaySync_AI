import React from "react";
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { appTheme } from "../../theme";

const BACKGROUNDS = {
  left:
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
  right:
    "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
};

const accountCards = [
  {
    key: "student",
    title: "Student",
    subtitle: "Find rooms and order food",
    icon: "school-outline",
    active: true,
    target: "StudentPortal",
  },
  {
    key: "owner",
    title: "Hostel Owner",
    subtitle: "List and manage your hostel rooms",
    icon: "home-outline",
    active: true,
    target: "OwnerPortal",
  },
  {
    key: "restaurant",
    title: "Restaurant Owner",
    subtitle: "List your restaurant",
    icon: "restaurant-outline",
    active: true,
    target: "RestaurantPortal",
  },
  {
    key: "delivery",
    title: "Delivery Partner",
    subtitle: "Deliver student orders",
    icon: "bicycle-outline",
    active: true,
    target: "DeliveryPortal",
  },
];

export default function AccountTypeScreen({ navigation, route }) {
  const routeMode = route?.params?.mode || "login";
  function getTargetParams(target) {
    if (target === "StudentPortal") {
      return routeMode === "register" ? { screen: "Register" } : { screen: "Login" };
    }

    if (target === "OwnerPortal") {
      return {
        screen: "OwnerAuth",
        params: {
          screen: routeMode === "register" ? "OwnerRegister" : "OwnerLogin",
        },
      };
    }

    if (target === "RestaurantPortal") {
      return {
        screen: "RestaurantAuth",
        params: {
          screen: routeMode === "register" ? "RestaurantRegister" : "RestaurantLogin",
        },
      };
    }

    if (target === "DeliveryPortal") {
      return {
        screen: "DeliveryAuth",
        params: {
          screen: routeMode === "register" ? "DeliveryRegister" : "DeliveryLogin",
        },
      };
    }

    return undefined;
  }

  return (
    <View style={styles.root}>
      <View style={styles.splitContainer}>
        <ImageBackground source={{ uri: BACKGROUNDS.left }} style={styles.sideImage}>
          <View style={styles.overlay} />
        </ImageBackground>
        <ImageBackground source={{ uri: BACKGROUNDS.right }} style={styles.sideImage}>
          <View style={styles.overlay} />
        </ImageBackground>
      </View>

      <LinearGradient
        colors={["rgba(255,255,255,0.86)", "rgba(230,239,251,0.72)", "rgba(255,255,255,0.86)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.centerCard}
      >
        <Pressable style={styles.backButton} onPress={() => navigation.navigate("AuthLanding")}>
          <Ionicons name="arrow-back" size={20} color={appTheme.colors.text} />
          <Text style={styles.backButtonText}>Back to Login</Text>
        </Pressable>
        <Text style={styles.heading}>Choose Account Type</Text>
        <View style={styles.grid}>
          {accountCards.map((card) => (
            <Pressable
              key={card.key}
              style={[styles.optionCard, !card.active && styles.inactiveCard]}
              onPress={() =>
                card.active &&
                navigation.navigate(card.target, getTargetParams(card.target))
              }
            >
              <Ionicons name={card.icon} size={34} color={appTheme.colors.primaryDark} />
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
              {!card.active ? <Text style={styles.comingSoon}>Coming Soon</Text> : null}
            </Pressable>
          ))}
        </View>
        <Text style={styles.footerText}>
          {routeMode === "register"
            ? "Choose which account type you want to register."
            : "Choose which account type you want to log in with."}
        </Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#101826",
    justifyContent: "center",
    alignItems: "center",
  },
  splitContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
  },
  sideImage: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(16,24,38,0.48)",
  },
  centerCard: {
    width: "86%",
    maxWidth: 520,
    borderRadius: 28,
    paddingHorizontal: appTheme.spacing.xl,
    paddingVertical: appTheme.spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: appTheme.spacing.md,
  },
  backButtonText: {
    color: appTheme.colors.text,
    fontWeight: "700",
    fontSize: 14,
  },
  heading: {
    textAlign: "center",
    fontSize: 30,
    fontWeight: "800",
    color: appTheme.colors.text,
    marginBottom: appTheme.spacing.lg,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: appTheme.spacing.md,
    justifyContent: "center",
  },
  optionCard: {
    width: "47%",
    minHeight: 172,
    backgroundColor: "rgba(255,255,255,0.24)",
    borderRadius: 22,
    padding: appTheme.spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    gap: appTheme.spacing.sm,
  },
  inactiveCard: {
    opacity: 0.72,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: appTheme.colors.text,
    textAlign: "center",
  },
  cardSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: appTheme.colors.textMuted,
    textAlign: "center",
  },
  comingSoon: {
    marginTop: 2,
    color: appTheme.colors.primaryDark,
    fontWeight: "700",
    fontSize: 12,
  },
  footerText: {
    marginTop: appTheme.spacing.lg,
    textAlign: "center",
    color: appTheme.colors.textMuted,
    fontSize: 14,
  },
});
