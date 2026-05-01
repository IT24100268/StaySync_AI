import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import AppInput from "../../../../components/common/AppInput";
import AppButton from "../../../../components/common/AppButton";
import { appTheme } from "../../../../theme";
import { AVAILABILITY_OPTIONS, FOOD_CATEGORY_OPTIONS } from "../../utils/constants";
import SelectInput from "./SelectInput";
import ImagePickerField from "./ImagePickerField";

export default function FoodItemForm({ form, errors, onChange, onSubmit, submitLabel, loading }) {
  const hasPresetCategory = useMemo(
    () => FOOD_CATEGORY_OPTIONS.includes(form.category),
    [form.category]
  );
  const [isCustomCategory, setIsCustomCategory] = useState(
    Boolean(form.category) && !hasPresetCategory
  );

  useEffect(() => {
    setIsCustomCategory(Boolean(form.category) && !FOOD_CATEGORY_OPTIONS.includes(form.category));
  }, [form.category]);

  function updateField(key, value) {
    onChange({ ...form, [key]: value });
  }

  function handleCategoryChange(value) {
    setIsCustomCategory(false);
    updateField("category", value);
  }

  function handleCustomCategoryToggle() {
    const nextCustomState = !isCustomCategory;
    setIsCustomCategory(nextCustomState);

    if (!nextCustomState && !hasPresetCategory) {
      updateField("category", "");
    }
  }

  return (
    <View style={styles.form}>
      <AppInput label="Food Name" value={form.name} onChangeText={(value) => updateField("name", value)} error={errors.name} />
      <AppInput label="Description" value={form.description} onChangeText={(value) => updateField("description", value)} multiline error={errors.description} />
      <SelectInput label="Category" value={hasPresetCategory ? form.category : ""} options={FOOD_CATEGORY_OPTIONS} onChange={handleCategoryChange} error={errors.category} />
      <SelectInput
        label="New Category"
        value={isCustomCategory ? "Add New Category" : ""}
        options={["Add New Category"]}
        onChange={handleCustomCategoryToggle}
      />
      {isCustomCategory ? (
        <AppInput
          label="Custom Category"
          value={form.category}
          onChangeText={(value) => updateField("category", value)}
          placeholder="Enter a new category"
          error={errors.category}
        />
      ) : null}
      <AppInput label="Price" value={String(form.price)} onChangeText={(value) => updateField("price", value)} keyboardType="numeric" error={errors.price} />
      <ImagePickerField value={form.image} onChange={(value) => updateField("image", value)} error={errors.image} />
      <SelectInput label="Availability" value={form.availability} options={AVAILABILITY_OPTIONS} onChange={(value) => updateField("availability", value)} error={errors.availability} />
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
