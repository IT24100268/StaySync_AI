import React, { useMemo, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert, Image, StyleSheet, Text, View } from "react-native";
import ScreenContainer from "../../components/common/ScreenContainer";
import AppInput from "../../components/common/AppInput";
import AppButton from "../../components/common/AppButton";
import { useAuth } from "../../context/AuthContext";
import { updateProfile } from "../../services/profileService";
import {
  validateEmail,
  validateName,
  validatePhone,
  validateRequired,
} from "../../utils/validation";
import { appTheme } from "../../theme";

export default function EditProfileScreen({ navigation }) {
  const { user, updateCurrentUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    university: user?.university || "",
    genderPreference: user?.genderPreference || "",
    profileImage: user?.profileImage || "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [pickingImage, setPickingImage] = useState(false);

  const profileImageLabel = useMemo(() => {
    if (!form.profileImage) {
      return "No file selected";
    }

    if (form.profileImage.startsWith("data:image")) {
      return "Selected profile photo";
    }

    const parts = String(form.profileImage).split(/[\\/]/);
    return parts[parts.length - 1] || "Selected profile photo";
  }, [form.profileImage]);

  function handleChange(key, value) {
    if (key === "phone") {
      setForm((current) => ({ ...current, [key]: value.replace(/\D/g, "").slice(0, 15) }));
      return;
    }

    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handlePickProfileImage() {
    setPickingImage(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission Needed", "Please allow access to your files or photos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      const mimeType = asset.mimeType || "image/jpeg";
      const nextProfileImage = asset.base64
        ? `data:${mimeType};base64,${asset.base64}`
        : asset.uri;

      setForm((current) => ({ ...current, profileImage: nextProfileImage }));
    } catch (error) {
      Alert.alert("Image Selection Failed", error.message || "Unable to choose a profile image.");
    } finally {
      setPickingImage(false);
    }
  }

  function handleRemoveProfileImage() {
    setForm((current) => ({ ...current, profileImage: "" }));
  }

  async function handleSave() {
    const nextErrors = {};

    if (!validateRequired(form.name)) nextErrors.name = "Name is required.";
    else if (!validateName(form.name)) nextErrors.name = "Only letters are allowed in full name.";
    if (!validateEmail(form.email)) nextErrors.email = "Enter a valid email.";
    if (!validateRequired(form.phone)) nextErrors.phone = "Phone number is required.";
    else if (!validatePhone(form.phone)) nextErrors.phone = "Enter a valid phone number.";
    if (!validateRequired(form.university)) nextErrors.university = "University is required.";
    if (!validateRequired(form.genderPreference)) nextErrors.genderPreference = "This field is required.";

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await updateProfile(form);
      await updateCurrentUser({
        ...user,
        ...updatedUser,
        profileImage: form.profileImage,
      });
      Alert.alert("Profile Updated", "Your student profile has been saved.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Update Failed", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.form}>
        <View style={styles.imageField}>
          <Text style={styles.imageLabel}>Profile Photo</Text>
          <Text style={styles.imageHelper}>
            Select a picture from your files to use as your student profile photo.
          </Text>
          <View style={styles.fileRow}>
            <Text style={styles.fileName}>{profileImageLabel}</Text>
          </View>
          <AppButton
            title={form.profileImage ? "Choose Another File" : "Choose File"}
            onPress={handlePickProfileImage}
            variant="secondary"
            loading={pickingImage}
          />
          {form.profileImage ? (
            <>
              <AppButton
                title="Remove Photo"
                onPress={handleRemoveProfileImage}
                variant="secondary"
              />
              <Image source={{ uri: form.profileImage }} style={styles.previewImage} />
            </>
          ) : null}
        </View>
        <AppInput label="Full Name" value={form.name} onChangeText={(value) => handleChange("name", value)} error={errors.name} />
        <AppInput label="Email" value={form.email} onChangeText={(value) => handleChange("email", value)} autoCapitalize="none" keyboardType="email-address" error={errors.email} />
        <AppInput label="Phone Number" value={form.phone} onChangeText={(value) => handleChange("phone", value)} keyboardType="phone-pad" error={errors.phone} />
        <AppInput label="University" value={form.university} onChangeText={(value) => handleChange("university", value)} error={errors.university} />
        <AppInput label="Gender Preference" value={form.genderPreference} onChangeText={(value) => handleChange("genderPreference", value)} error={errors.genderPreference} />
        <AppButton title="Save Changes" onPress={handleSave} loading={loading} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  form: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
    ...appTheme.shadow,
  },
  imageField: {
    gap: appTheme.spacing.sm,
  },
  imageLabel: {
    color: appTheme.colors.text,
    fontWeight: "700",
    fontSize: 14,
  },
  imageHelper: {
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
  previewImage: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignSelf: "center",
  },
});
