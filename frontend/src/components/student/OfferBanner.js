import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AppButton from "../common/AppButton";
import { appTheme } from "../../theme";

export default function OfferBanner({ onPress }) {
  return (
    <LinearGradient colors={["#0B5D7A", "#167A95", "#35A0B7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View style={styles.copy}>
        <View style={styles.badge}>
          <Ionicons name="sparkles-outline" size={14} color="#FFFFFF" />
          <Text style={styles.badgeText}>Limited offer</Text>
        </View>
        <Text style={styles.title}>Save on your first food order after booking a room</Text>
        <Text style={styles.subtitle}>Unlock a bundled student living discount this week and keep everything in one flow.</Text>
      </View>
      <AppButton title="View offers" onPress={onPress} variant="secondary" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
  },
  copy: {
    gap: appTheme.spacing.sm,
  },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: appTheme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
  },
  subtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    lineHeight: 20,
  },
});
