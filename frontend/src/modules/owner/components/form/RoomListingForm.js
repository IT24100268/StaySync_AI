import React from "react";
import { StyleSheet, View } from "react-native";
import AppInput from "../../../../components/common/AppInput";
import AppButton from "../../../../components/common/AppButton";
import SelectInput from "./SelectInput";
import ImagePickerField from "./ImagePickerField";
import {
  FACILITY_OPTIONS,
  GENDER_OPTIONS,
  ROOM_TYPE_OPTIONS,
  STATUS_OPTIONS,
} from "../../utils/constants";
import { appTheme } from "../../../../theme";

export default function RoomListingForm({
  form,
  errors,
  onChange,
  onSubmit,
  submitLabel,
  loading,
}) {
  function updateField(key, value) {
    onChange({ ...form, [key]: value });
  }

  return (
    <View style={styles.form}>
      <AppInput label="Room Title" value={form.title} onChangeText={(value) => updateField("title", value)} error={errors.title} />
      <AppInput label="Description" value={form.description} onChangeText={(value) => updateField("description", value)} multiline error={errors.description} />
      <AppInput label="Rent" value={String(form.rent)} onChangeText={(value) => updateField("rent", value)} keyboardType="numeric" error={errors.rent} />
      <AppInput label="Deposit" value={String(form.deposit)} onChangeText={(value) => updateField("deposit", value)} keyboardType="numeric" error={errors.deposit} />
      <SelectInput label="Room Type" value={form.roomType} onChange={(value) => updateField("roomType", value)} options={ROOM_TYPE_OPTIONS} error={errors.roomType} />
      <SelectInput label="Facilities" value={form.facilities} onChange={(value) => updateField("facilities", value)} options={FACILITY_OPTIONS} multiple error={errors.facilities} />
      <SelectInput label="Gender Allowed" value={form.genderAllowed} onChange={(value) => updateField("genderAllowed", value)} options={GENDER_OPTIONS} error={errors.genderAllowed} />
      <AppInput label="Max Capacity" value={String(form.maxCapacity)} onChangeText={(value) => updateField("maxCapacity", value)} keyboardType="numeric" error={errors.maxCapacity} />
      <AppInput label="Rules" value={form.rules} onChangeText={(value) => updateField("rules", value)} multiline error={errors.rules} />
      <AppInput label="Address" value={form.address} onChangeText={(value) => updateField("address", value)} multiline error={errors.address} />
      <ImagePickerField images={form.images} onChange={(value) => updateField("images", value)} error={errors.images} />
      <SelectInput label="Availability Status" value={form.status} onChange={(value) => updateField("status", value)} options={STATUS_OPTIONS} error={errors.status} />
      <AppButton title={submitLabel} onPress={onSubmit} loading={loading} />
    </View>
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
