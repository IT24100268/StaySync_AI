import React, { useMemo, useState } from "react";
import { Alert } from "react-native";
import ScreenContainer from "../../../../components/common/ScreenContainer";
import EmptyState from "../../../../components/common/EmptyState";
import FoodItemForm from "../../components/form/FoodItemForm";
import { useMenu } from "../../context/MenuContext";
import { validateFoodItem, validateFoodPrice } from "../../utils/validation";

export default function EditFoodItemScreen({ route, navigation }) {
  const { foodId } = route.params || {};
  const { menuItems, editFoodItem, submitting, categoryOptions } = useMenu();
  const selectedItem = useMemo(
    () => menuItems.find((item) => item.id === foodId),
    [foodId, menuItems]
  );
  const [form, setForm] = useState(selectedItem || {
    id: "",
    name: "",
    description: "",
    category: "",
    price: "",
    image: "",
    availability: "in_stock",
  });
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

  if (!selectedItem) {
    return (
      <ScreenContainer>
        <EmptyState title="Food item unavailable" description="The selected food item could not be found." />
      </ScreenContainer>
    );
  }

  async function handleSubmit() {
    const nextErrors = validateFoodItem(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const result = await editFoodItem({
      ...form,
      price: Number(form.price),
    });

    if (!result.success) {
      Alert.alert("Update Failed", result.message);
      return;
    }

    navigation.replace("FoodItemDetails", { foodId: result.item.id });
  }

  return (
    <ScreenContainer>
      <FoodItemForm form={form} errors={errors} onChange={handleFormChange} onSubmit={handleSubmit} submitLabel="Save Food Item Changes" loading={submitting} categoryOptions={categoryOptions} />
    </ScreenContainer>
  );
}
