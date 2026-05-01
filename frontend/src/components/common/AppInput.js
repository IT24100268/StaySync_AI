import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { appTheme } from "../../theme";

export default function AppInput({
  label,
  error,
  multiline = false,
  style,
  inputStyle,
  leftIcon,
  rightElement,
  ...props
}) {
  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputShell, error && styles.inputShellError]}>
        {leftIcon ? (
          <Ionicons
            name={leftIcon}
            size={18}
            color={appTheme.colors.textMuted}
            style={styles.leftIcon}
          />
        ) : null}
        <TextInput
          placeholderTextColor={appTheme.colors.textMuted}
          style={[
            styles.input,
            multiline && styles.multiline,
            leftIcon && styles.inputWithLeftIcon,
            rightElement && styles.inputWithRightElement,
            inputStyle,
          ]}
          multiline={multiline}
          {...props}
        />
        {rightElement ? <View style={styles.rightElement}>{rightElement}</View> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: appTheme.spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: appTheme.colors.text,
  },
  inputShell: {
    minHeight: 56,
    borderRadius: appTheme.radius.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
    flexDirection: "row",
    alignItems: "center",
  },
  inputShellError: {
    borderColor: appTheme.colors.danger,
  },
  leftIcon: {
    marginLeft: appTheme.spacing.md,
  },
  input: {
    flex: 1,
    minHeight: 54,
    paddingHorizontal: appTheme.spacing.md,
    color: appTheme.colors.text,
    fontSize: 15,
  },
  inputWithLeftIcon: {
    paddingLeft: appTheme.spacing.sm,
  },
  inputWithRightElement: {
    paddingRight: appTheme.spacing.sm,
  },
  rightElement: {
    paddingRight: appTheme.spacing.md,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: "top",
    paddingVertical: appTheme.spacing.md,
  },
  error: {
    color: appTheme.colors.danger,
    fontSize: 12,
  },
});
