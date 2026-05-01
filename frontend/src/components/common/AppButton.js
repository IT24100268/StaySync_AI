import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { appTheme } from "../../theme";
import { blurActiveElement } from "../../utils/webFocus";

export default function AppButton({
  title,
  onPress,
  loading = false,
  variant = "primary",
  disabled = false,
}) {
  const isPrimary = variant === "primary";
  const isDisabled = disabled || loading;

  function handlePress(event) {
    blurActiveElement();
    onPress?.(event);
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? "#FFFFFF" : appTheme.colors.primary} />
      ) : (
        <Text style={[styles.label, isPrimary ? styles.primaryLabel : styles.secondaryLabel]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: appTheme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: appTheme.spacing.md,
  },
  primary: {
    backgroundColor: appTheme.colors.primary,
  },
  secondary: {
    backgroundColor: appTheme.colors.surface,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.65,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
  },
  primaryLabel: {
    color: "#FFFFFF",
  },
  secondaryLabel: {
    color: appTheme.colors.primary,
  },
});
