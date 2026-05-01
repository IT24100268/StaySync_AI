import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import AppInput from "../../../../components/common/AppInput";
import AppButton from "../../../../components/common/AppButton";
import { appTheme } from "../../../../theme";
import { useOwnerAuth } from "../../context/OwnerAuthContext";
import { updateOwnerProfile } from "../../services/ownerProfileService";
import { validateOwnerProfile } from "../../utils/validation";

export default function EditOwnerProfileScreen({ navigation }) {
  const { owner, updateCurrentOwner } = useOwnerAuth();
  const [form, setForm] = useState({
    name: owner?.name || "",
    email: owner?.email || "",
    phone: owner?.phone || "",
    hostelName: owner?.hostelName || "",
    verificationStatus: owner?.verificationStatus || "Pending",
    role: owner?.role || "owner",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    const nextErrors = validateOwnerProfile(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      const updatedOwner = await updateOwnerProfile(form);
      await updateCurrentOwner(updatedOwner);
      Alert.alert("Profile Updated", "Owner profile changes have been saved.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Update Failed", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.card}>
        <AppInput label="Full Name" value={form.name} onChangeText={(value) => updateField("name", value)} error={errors.name} />
        <AppInput label="Email" value={form.email} onChangeText={(value) => updateField("email", value)} autoCapitalize="none" keyboardType="email-address" error={errors.email} />
        <AppInput label="Phone Number" value={form.phone} onChangeText={(value) => updateField("phone", value)} keyboardType="phone-pad" error={errors.phone} />
        <AppInput label="Business / Hostel Name" value={form.hostelName} onChangeText={(value) => updateField("hostelName", value)} error={errors.hostelName} />
        <AppButton title="Save Changes" onPress={handleSave} loading={loading} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
    ...appTheme.shadow,
  },
});
