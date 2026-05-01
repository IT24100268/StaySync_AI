import React from "react";
import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import RoleOptionCard from "../../components/common/RoleOptionCard";
import { ROLE_LABELS, ROLE_REGISTER_ROUTE, ROLES } from "../../constants/auth";
import { appTheme } from "../../theme";

const accountCards = [
  {
    role: ROLES.STUDENT,
    subtitle: "Find rooms and order food",
    icon: "school-outline",
  },
  {
    role: ROLES.OWNER,
    subtitle: "List and manage hostel rooms",
    icon: "home-outline",
  },
  {
    role: ROLES.RESTAURANT,
    subtitle: "Manage menu and orders",
    icon: "restaurant-outline",
  },
  {
    role: ROLES.DELIVERY,
    subtitle: "Accept and deliver orders",
    icon: "bicycle-outline",
  },
];

export default function ChooseAccountTypeScreen({ navigation }) {
  return (
    <ImageBackground
      source={{
        uri: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1600&q=80",
      }}
      style={styles.root}
    >
      <View style={styles.overlay} />
      <LinearGradient
        colors={["rgba(255,255,255,0.88)", "rgba(235,243,255,0.76)", "rgba(255,255,255,0.88)"]}
        style={styles.card}
      >
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={appTheme.colors.text} />
          <Text style={styles.backButtonText}>Back to Login</Text>
        </Pressable>
        <Text style={styles.title}>Choose Account Type</Text>
        <Text style={styles.subtitle}>
          Select the type of account you want to register.
        </Text>
        <View style={styles.grid}>
          {accountCards.map((item) => (
            <RoleOptionCard
              key={item.role}
              title={ROLE_LABELS[item.role]}
              subtitle={item.subtitle}
              icon={item.icon}
              onPress={() => navigation.navigate(ROLE_REGISTER_ROUTE[item.role])}
            />
          ))}
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(14,23,39,0.45)",
  },
  card: {
    width: "88%",
    maxWidth: 660,
    borderRadius: 28,
    padding: appTheme.spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
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
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: appTheme.colors.text,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: appTheme.spacing.lg,
    color: appTheme.colors.textMuted,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: appTheme.spacing.md,
    justifyContent: "center",
  },
});
