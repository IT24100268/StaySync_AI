import React, { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../theme";

const TOAST_META = {
  success: {
    icon: "checkmark-circle",
    backgroundColor: "#ECF9F2",
    borderColor: "#B9E7CE",
    textColor: "#166B45",
  },
  error: {
    icon: "alert-circle",
    backgroundColor: "#FFF1F1",
    borderColor: "#F5C6C6",
    textColor: "#A13333",
  },
  info: {
    icon: "information-circle",
    backgroundColor: "#EEF6FF",
    borderColor: "#C8DDF8",
    textColor: "#1F5FAF",
  },
};

export default function AppToast({ visible, message, type = "success" }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;
  const meta = TOAST_META[type] || TOAST_META.success;
  const shouldUseNativeDriver = Platform.OS !== "web";

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: visible ? 220 : 180,
        useNativeDriver: shouldUseNativeDriver,
      }),
      Animated.timing(translateY, {
        toValue: visible ? 0 : -12,
        duration: visible ? 220 : 180,
        useNativeDriver: shouldUseNativeDriver,
      }),
    ]).start();
  }, [opacity, shouldUseNativeDriver, translateY, visible]);

  if (!visible && !message) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrapper,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View
        style={[
          styles.toast,
          {
            backgroundColor: meta.backgroundColor,
            borderColor: meta.borderColor,
          },
        ]}
      >
        <Ionicons name={meta.icon} size={18} color={meta.textColor} />
        <Text style={[styles.message, { color: meta.textColor }]}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 14,
    left: 16,
    right: 16,
    zIndex: 999,
  },
  toast: {
    borderWidth: 1,
    borderRadius: appTheme.radius.md,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: appTheme.spacing.sm,
    ...appTheme.shadow,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
});
