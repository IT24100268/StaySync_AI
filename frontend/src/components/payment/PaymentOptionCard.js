import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../theme";

export default function PaymentOptionCard({
  title,
  subtitle,
  icon,
  selected,
  onPress,
}) {
  return (
    <Pressable
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
    >
      <View style={styles.iconWrap}>
        <Ionicons
          name={icon}
          size={22}
          color={selected ? appTheme.colors.primary : appTheme.colors.textMuted}
        />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioInner} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: appTheme.spacing.md,
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    borderWidth: 1,
    borderColor: "#E3EBF2",
    padding: appTheme.spacing.md,
    ...appTheme.shadow,
  },
  cardSelected: {
    borderColor: appTheme.colors.primary,
    backgroundColor: "#F3FAFC",
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF6FA",
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: appTheme.colors.textMuted,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#C9D8E3",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: appTheme.colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: appTheme.colors.primary,
  },
});
