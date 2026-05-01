import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import AppButton from "../../../../components/common/AppButton";
import AppInput from "../../../../components/common/AppInput";
import { appTheme } from "../../../../theme";

export default function ConfirmationModal({
  visible,
  title,
  message,
  inputLabel,
  inputValue,
  onInputChange,
  inputPlaceholder,
  inputError,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          {typeof onInputChange === "function" ? (
            <AppInput
              label={inputLabel}
              value={inputValue}
              onChangeText={onInputChange}
              placeholder={inputPlaceholder}
              error={inputError}
              multiline
            />
          ) : null}
          <View style={styles.actions}>
            <AppButton title={confirmLabel} onPress={onConfirm} />
            <Pressable style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelLabel}>{cancelLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(9,24,36,0.42)",
    justifyContent: "center",
    padding: appTheme.spacing.lg,
  },
  card: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.xl,
    gap: appTheme.spacing.md,
    ...appTheme.shadow,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  message: {
    color: appTheme.colors.textMuted,
    lineHeight: 22,
  },
  actions: {
    gap: appTheme.spacing.md,
  },
  cancelButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelLabel: {
    color: appTheme.colors.textMuted,
    fontWeight: "700",
  },
});
