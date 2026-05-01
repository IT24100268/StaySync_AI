import { validateEmail, validateRequired } from "../../../utils/validation";

export function validatePhone(phone) {
  return /^\+?[0-9\s-]{8,15}$/.test(String(phone || "").trim());
}

export function validateDeliveryProfile(form) {
  const errors = {};

  if (!validateRequired(form.name)) errors.name = "Full name is required.";
  if (!validateEmail(form.email)) errors.email = "Enter a valid email.";
  if (!validatePhone(form.phone)) errors.phone = "Enter a valid phone number.";
  if (!validateRequired(form.vehicleType)) errors.vehicleType = "Select a vehicle type.";
  if (!validateRequired(form.licenseId)) errors.licenseId = "License or ID is required.";

  return errors;
}
