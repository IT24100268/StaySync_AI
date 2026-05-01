import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AppInput from "../common/AppInput";
import AppButton from "../common/AppButton";
import { appTheme } from "../../theme";

export default function ComplaintForm({
  title = "Report an issue",
  subtitle,
  types = [],
  selectedType,
  onTypeChange,
  description,
  onDescriptionChange,
  onSubmit,
  loading = false,
  error = "",
  submitLabel = "Submit Report",
  descriptionPlaceholder = "Describe what happened and include any important details.",
}) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.heroCard}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Complaint type</Text>
        <View style={styles.typeWrap}>
          {types.map((type) => {
            const active = type === selectedType;

            return (
              <Pressable
                key={type}
                onPress={() => onTypeChange(type)}
                style={[styles.typeChip, active && styles.typeChipActive]}
              >
                <Text style={[styles.typeChipLabel, active && styles.typeChipLabelActive]}>{type}</Text>
              </Pressable>
            );
          })}
        </View>

        <AppInput
          label="Describe the issue"
          multiline
          value={description}
          onChangeText={onDescriptionChange}
          placeholder={descriptionPlaceholder}
          inputStyle={styles.textArea}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AppButton title={submitLabel} onPress={onSubmit} loading={loading} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: appTheme.spacing.md,
  },
  heroCard: {
    backgroundColor: appTheme.colors.primary,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.sm,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },
  subtitle: {
    color: "rgba(255,255,255,0.9)",
    lineHeight: 20,
  },
  card: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
    ...appTheme.shadow,
  },
  sectionLabel: {
    color: appTheme.colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  typeWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: appTheme.spacing.sm,
  },
  typeChip: {
    borderRadius: appTheme.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#EFF5F8",
    borderWidth: 1,
    borderColor: "transparent",
  },
  typeChipActive: {
    backgroundColor: "#E2F1F5",
    borderColor: "#B4D7E2",
  },
  typeChipLabel: {
    color: appTheme.colors.primaryDark,
    fontSize: 13,
    fontWeight: "700",
  },
  typeChipLabelActive: {
    color: appTheme.colors.primary,
  },
  textArea: {
    minHeight: 130,
  },
  error: {
    color: appTheme.colors.danger,
    lineHeight: 20,
  },
});
