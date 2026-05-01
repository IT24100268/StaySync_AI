import React from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import AppButton from "../../../../components/common/AppButton";
import { appTheme } from "../../../../theme";

export default function ConfirmationModal({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <AppButton title={confirmLabel} onPress={onConfirm} />
            <AppButton title={cancelLabel} variant="secondary" onPress={onCancel} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(16,24,38,0.45)",
    justifyContent: "center",
    padding: appTheme.spacing.lg,
  },
  card: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  message: {
    color: appTheme.colors.textMuted,
    lineHeight: 21,
  },
  actions: {
    gap: appTheme.spacing.sm,
  },
});
