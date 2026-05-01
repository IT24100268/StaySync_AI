import React, { useMemo, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Image, StyleSheet, Text, View } from "react-native";
import AppButton from "../../../../components/common/AppButton";
import { appTheme } from "../../../../theme";
import { resolveOwnerRoomImageSource } from "../../utils/ownerRoomImages";

export default function ImagePickerField({ images, onChange, error }) {
  const [picking, setPicking] = useState(false);

  const selectedImage = images[0] || "";
  const fileLabel = useMemo(() => {
    if (!selectedImage) {
      return "No file selected";
    }

    const parts = String(selectedImage).split(/[\\/]/);
    return parts[parts.length - 1] || "Selected image";
  }, [selectedImage]);

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

      onChange([result.assets[0].uri]);
    } finally {
      setPicking(false);
    }
  }

  function clearImage() {
    onChange([]);
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Room Image</Text>
      <Text style={styles.helper}>
        Choose a food image from your device. The selected file is stored as a local URI for now.
      </Text>
      <View style={styles.fileRow}>
        <Text style={styles.fileName}>{fileLabel}</Text>
      </View>
      <AppButton
        title={selectedImage ? "Choose Another File" : "Choose File"}
        onPress={pickImage}
        variant="secondary"
        loading={picking}
      />
      {selectedImage ? (
        <AppButton title="Remove Image" variant="secondary" onPress={clearImage} />
      ) : null}
      {selectedImage ? (
        <Image source={resolveOwnerRoomImageSource(selectedImage)} style={styles.image} />
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: appTheme.spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: appTheme.colors.text,
  },
  helper: {
    fontSize: 12,
    color: appTheme.colors.textMuted,
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
