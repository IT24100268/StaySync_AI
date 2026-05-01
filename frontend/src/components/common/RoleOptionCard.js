import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../theme";
import { blurActiveElement } from "../../utils/webFocus";

export default function RoleOptionCard({ title, subtitle, icon, onPress }) {
  function handlePress(event) {
    blurActiveElement();
    onPress?.(event);
  }

  return (
    <Pressable style={styles.card} onPress={handlePress}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={28} color="#3B82F6" />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "47%",
    minHeight: 168,
    borderRadius: 22,
    padding: appTheme.spacing.lg,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.32)",
    alignItems: "center",
    justifyContent: "center",
    gap: appTheme.spacing.sm,
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: appTheme.colors.text,
    textAlign: "center",
  },
  subtitle: {
    color: appTheme.colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});
