import React, { useMemo, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Image, StyleSheet, Text, View } from "react-native";
import AppButton from "../../../../components/common/AppButton";
import { appTheme } from "../../../../theme";

export default function ImagePickerField({ value, onChange, error }) {
  const [picking, setPicking] = useState(false);

  const fileLabel = useMemo(() => {
    if (!value) {
      return "No file selected";
    }

    const parts = String(value).split(/[\\/]/);
    return parts[parts.length - 1] || "Selected image";
  }, [value]);

  async function pickImage() {
    setPicking(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      onChange(result.assets[0].uri);
    } finally {
      setPicking(false);
    }
  }

  function clearImage() {
    onChange("");
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Food Image</Text>
      <Text style={styles.helper}>
        Choose a food image from your device. The selected file is stored as a local URI for now.
      </Text>
      <View style={styles.fileRow}>
        <Text style={styles.fileName}>{fileLabel}</Text>
      </View>
      <AppButton
        title={value ? "Choose Another File" : "Choose File"}
        onPress={pickImage}
        variant="secondary"
        loading={picking}
      />
      {value ? <AppButton title="Remove Image" onPress={clearImage} variant="secondary" /> : null}
      {value ? <Image source={{ uri: value }} style={styles.image} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: appTheme.spacing.sm,
  },
  label: {
    color: appTheme.colors.text,
    fontWeight: "700",
    fontSize: 14,
  },
  helper: {
    color: appTheme.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  fileRow: {
    minHeight: 52,
    justifyContent: "center",
    borderRadius: appTheme.radius.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
    paddingHorizontal: appTheme.spacing.md,
  },
  fileName: {
    color: appTheme.colors.text,
    fontSize: 14,
  },
  image: {
    width: "100%",
    height: 190,
    borderRadius: appTheme.radius.lg,
  },
  error: {
    color: appTheme.colors.danger,
    fontSize: 12,
  },
});
