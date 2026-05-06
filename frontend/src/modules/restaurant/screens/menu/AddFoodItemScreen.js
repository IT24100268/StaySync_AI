import React, { useState } from "react";
import { Alert } from "react-native";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import FoodItemForm from "../../components/form/FoodItemForm";
import { useRestaurantAuth } from "../../context/RestaurantAuthContext";
import { useMenu } from "../../context/MenuContext";
import { createEmptyFoodForm } from "../../utils/foodForm";
import { validateFoodItem, validateFoodPrice } from "../../utils/validation";

export default function AddFoodItemScreen({ navigation }) {
  const { restaurant } = useRestaurantAuth();
  const { addFoodItem, submitting, categoryOptions } = useMenu();
  const [form, setForm] = useState(createEmptyFoodForm(restaurant?.id));
  const [errors, setErrors] = useState({});

  function handleFormChange(nextForm) {
    setForm(nextForm);
    setErrors((current) => {
      const nextErrors = { ...current };
      const priceError = validateFoodPrice(nextForm.price);

      if (priceError) {
        nextErrors.price = priceError;
      } else {
        delete nextErrors.price;
      }

      return nextErrors;
    });
  }

  async function handleSubmit() {
    const nextErrors = validateFoodItem(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const result = await addFoodItem({
      ...form,
      restaurantId: restaurant?.id,
      price: Number(form.price),
    });

    if (!result.success) {
      Alert.alert("Create Failed", result.message);
      return;
    }

    navigation.replace("FoodItemDetails", { foodId: result.item.id });
  }

  return (
    <ScreenContainer>
      <FoodItemForm form={form} errors={errors} onChange={handleFormChange} onSubmit={handleSubmit} submitLabel="Create Food Item" loading={submitting} categoryOptions={categoryOptions} />
    </ScreenContainer>
  );
}
