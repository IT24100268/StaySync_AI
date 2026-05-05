import { validateEmail, validateRequired } from "../../../utils/validation";

export function validatePhone(phone) {
  return /^\+?[0-9\s-]{8,15}$/.test(String(phone || "").trim());
}

export function validateNumber(value) {
  return !Number.isNaN(Number(value)) && String(value).trim() !== "";
}

export function validateFoodPrice(value) {
  const rawValue = String(value ?? "").trim();

  if (!rawValue) {
    return "Price is required.";
  }

  if (!/^-?\d+(\.\d+)?$/.test(rawValue)) {
    return "Price must contain numbers only.";
  }

  const numericValue = Number(rawValue);

  if (Number.isNaN(numericValue)) {
    return "Price must be a valid number.";
  }

  if (numericValue < 0) {
    return "Price cannot be negative.";
  }

  if (numericValue > 2000) {
    return "Price cannot be more than 2000.";
  }

  return "";
}

export function validateRestaurantProfile(form) {
  const errors = {};

  if (!validateRequired(form.name)) errors.name = "Restaurant name is required.";
  if (!validateEmail(form.email)) errors.email = "Enter a valid email.";
  if (!validatePhone(form.phone)) errors.phone = "Enter a valid phone number.";
  if (!validateRequired(form.address)) errors.address = "Address is required.";
  if (!validateRequired(form.openingHours)) errors.openingHours = "Opening hours are required.";
  if (!validateRequired(form.cuisineType)) errors.cuisineType = "Select a cuisine type.";
  if (!validateNumber(form.latitude) || !validateNumber(form.longitude)) {
    errors.location = "Please select the restaurant location on the map.";
  }

  return errors;
}

export function validateFoodItem(form) {
  const errors = {};

  if (!validateRequired(form.name)) errors.name = "Food name is required.";
  if (!validateRequired(form.description)) errors.description = "Description is required.";
  if (!validateRequired(form.category)) errors.category = "Select a category.";
  const priceError = validateFoodPrice(form.price);
  if (priceError) errors.price = priceError;
  if (!validateRequired(form.image)) errors.image = "Food image is required.";
  if (!validateRequired(form.availability)) errors.availability = "Select availability.";

  return errors;
}
