import React, { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { appTheme } from "../../theme";

export default function AppSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  error,
}) {
  const [visible, setVisible] = useState(false);

  const selectedLabel = useMemo(() => {
    return options.find((option) => option.value === value)?.label || "";
  }, [options, value]);

  function closeModal() {
    setVisible(false);
  }

  function handleSelect(nextValue) {
    onChange(nextValue);
    closeModal();
  }

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.fieldButton, error && styles.fieldButtonError]}
        onPress={() => setVisible(true)}
      >
        <Text style={[styles.valueText, !selectedLabel && styles.placeholderText]}>
          {selectedLabel || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={appTheme.colors.textMuted} />
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal
        animationType="fade"
        transparent
        visible={visible}
        onRequestClose={closeModal}
      >
        <Pressable style={styles.backdrop} onPress={closeModal}>
          <Pressable style={styles.modalCard}>
            <Text style={styles.modalTitle}>{label || "Select"}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map((option) => {
                const selected = option.value === value;

                return (
                  <TouchableOpacity
                    key={option.value}
                    activeOpacity={0.85}
                    style={[styles.optionButton, selected && styles.optionButtonSelected]}
                    onPress={() => handleSelect(option.value)}
                  >
                    <Text
                      style={[styles.optionText, selected && styles.optionTextSelected]}
                    >
                      {option.label}
                    </Text>
                    {selected ? (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={appTheme.colors.primary}
                      />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
  fieldButton: {
    minHeight: 56,
    borderRadius: appTheme.radius.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
    paddingHorizontal: appTheme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fieldButtonError: {
    borderColor: appTheme.colors.danger,
  },
  valueText: {
    flex: 1,
    color: appTheme.colors.text,
    fontSize: 15,
  },
  placeholderText: {
    color: appTheme.colors.textMuted,
  },
  error: {
    color: appTheme.colors.danger,
    fontSize: 12,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(18,48,66,0.38)",
    justifyContent: "center",
    padding: appTheme.spacing.lg,
  },
  modalCard: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.sm,
    maxHeight: "70%",
    ...appTheme.shadow,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: appTheme.colors.text,
  },
  optionButton: {
    minHeight: 50,
    borderRadius: appTheme.radius.md,
    paddingHorizontal: appTheme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionButtonSelected: {
    backgroundColor: appTheme.colors.chipBg,
  },
  optionText: {
    color: appTheme.colors.text,
    fontSize: 15,
    fontWeight: "500",
  },
  optionTextSelected: {
    color: appTheme.colors.primary,
    fontWeight: "700",
  },
});
