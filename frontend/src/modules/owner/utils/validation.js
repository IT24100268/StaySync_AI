import { validateEmail, validateRequired } from "../../../utils/validation";

export function validatePhone(phone) {
  return /^\+?[0-9\s-]{8,15}$/.test(String(phone || "").trim());
}

export function validateNumber(value) {
  return !Number.isNaN(Number(value)) && String(value).trim() !== "";
}

function validateDigitsOnly(value) {
  return /^\d+$/.test(String(value || "").trim());
}

export function validateOwnerProfile(form) {
  const errors = {};

  if (!validateRequired(form.name)) errors.name = "Full name is required.";
  if (!validateEmail(form.email)) errors.email = "Enter a valid email.";
  if (!validatePhone(form.phone)) errors.phone = "Enter a valid phone number.";
  if (!validateRequired(form.hostelName)) errors.hostelName = "Business/hostel name is required.";

  return errors;
}

export function validateOwnerRoom(form) {
  const errors = {};

  if (!validateRequired(form.title)) errors.title = "Room title is required.";
  if (!validateRequired(form.description)) errors.description = "Description is required.";
  if (!validateRequired(form.rent)) {
    errors.rent = "Rent is required.";
  } else if (String(form.rent).trim().startsWith("-")) {
    errors.rent = "Rent cannot be negative.";
  } else if (!validateDigitsOnly(form.rent)) {
    errors.rent = "Rent must contain numbers only.";
  } else if (!validateNumber(form.rent)) {
    errors.rent = "Rent must be a valid number.";
  } else if (Number(form.rent) > 20000) {
    errors.rent = "Rent cannot be more than 20000.";
  }

  if (!validateRequired(form.deposit)) {
    errors.deposit = "Deposit is required.";
  } else if (String(form.deposit).trim().startsWith("-")) {
    errors.deposit = "Deposit cannot be negative.";
  } else if (!validateDigitsOnly(form.deposit)) {
    errors.deposit = "Deposit must contain numbers only.";
  } else if (!validateNumber(form.deposit)) {
    errors.deposit = "Deposit must be a valid number.";
  }
  if (!validateRequired(form.roomType)) errors.roomType = "Select a room type.";
  if (form.facilities.length === 0) errors.facilities = "Select at least one facility.";
  if (!validateRequired(form.genderAllowed)) errors.genderAllowed = "Select gender allowed.";
  if (!validateNumber(form.maxCapacity)) errors.maxCapacity = "Max capacity is required.";
  if (!validateRequired(form.rules)) errors.rules = "Rules are required.";
  if (!validateRequired(form.address)) errors.address = "Address is required.";
  if (form.images.length === 0) errors.images = "Add at least one image.";
  if (!validateRequired(form.status)) errors.status = "Select availability status.";

  return errors;
}
