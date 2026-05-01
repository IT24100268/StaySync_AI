import React, { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../theme";

const DEFAULT_OPTIONS = [
  {
    key: "room",
    title: "Report Room Issue",
    subtitle: "Flag listing or room concerns",
    icon: "bed-outline",
  },
  {
    key: "food",
    title: "Report Food Issue",
    subtitle: "Share delivery or order problems",
    icon: "restaurant-outline",
  },
  {
    key: "other",
    title: "Other Issue",
    subtitle: "Send anything else to support",
    icon: "alert-circle-outline",
  },
];

export default function ReportIssueFab({ options = DEFAULT_OPTIONS, onSelect }) {
  const [visible, setVisible] = useState(false);
  const renderedOptions = useMemo(() => options, [options]);

  function handleSelect(option) {
    setVisible(false);
    onSelect?.(option.key);
  }

  return (
    <>
      <Pressable style={styles.fab} onPress={() => setVisible(true)}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <Pressable style={styles.overlayFill} onPress={() => setVisible(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Quick report</Text>
            <Text style={styles.sheetSubtitle}>Choose the kind of issue you want to submit.</Text>

            {renderedOptions.map((option) => (
              <Pressable key={option.key} style={styles.optionCard} onPress={() => handleSelect(option)}>
                <View style={styles.optionIcon}>
                  <Ionicons name={option.icon} size={18} color={appTheme.colors.primary} />
                </View>
                <View style={styles.optionCopy}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={appTheme.colors.textMuted} />
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: appTheme.spacing.lg,
    bottom: appTheme.spacing.xl,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: appTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...appTheme.shadow,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(16,24,38,0.28)",
  },
  overlayFill: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: appTheme.colors.surface,
    paddingHorizontal: appTheme.spacing.lg,
    paddingTop: appTheme.spacing.sm,
    paddingBottom: appTheme.spacing.xl,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: appTheme.spacing.md,
  },
  sheetHandle: {
    width: 56,
    height: 5,
    borderRadius: 999,
    alignSelf: "center",
    backgroundColor: "#D5E0E8",
    marginBottom: 4,
  },
  sheetTitle: {
    color: appTheme.colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  sheetSubtitle: {
    color: appTheme.colors.textMuted,
    lineHeight: 20,
  },
  optionCard: {
    borderWidth: 1,
    borderColor: "#E6EEF4",
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: appTheme.spacing.sm,
    backgroundColor: "#FBFDFF",
  },
  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F4F7",
  },
  optionCopy: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    color: appTheme.colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  optionSubtitle: {
    color: appTheme.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
});
