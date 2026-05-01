import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import ScreenContainer from "../../components/common/ScreenContainer";
import AppInput from "../../components/common/AppInput";
import AppButton from "../../components/common/AppButton";
import { useAuth } from "../../context/AuthContext";
import { updateProfile } from "../../services/profileService";
import {
  validateEmail,
  validateName,
  validateRequired,
} from "../../utils/validation";
import { appTheme } from "../../theme";

export default function EditProfileScreen({ navigation }) {
  const { user, updateCurrentUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    university: user?.university || "",
    genderPreference: user?.genderPreference || "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function handleChange(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    const nextErrors = {};

    if (!validateRequired(form.name)) nextErrors.name = "Name is required.";
    else if (!validateName(form.name)) nextErrors.name = "Only letters are allowed in full name.";
    if (!validateEmail(form.email)) nextErrors.email = "Enter a valid email.";
    if (!validateRequired(form.university)) nextErrors.university = "University is required.";
    if (!validateRequired(form.genderPreference)) nextErrors.genderPreference = "This field is required.";

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await updateProfile(form);
      await updateCurrentUser(updatedUser);
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
        <AppInput label="Full Name" value={form.name} onChangeText={(value) => handleChange("name", value)} error={errors.name} />
        <AppInput label="Email" value={form.email} onChangeText={(value) => handleChange("email", value)} autoCapitalize="none" keyboardType="email-address" error={errors.email} />
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
});
