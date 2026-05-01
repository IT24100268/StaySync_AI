export function validateEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

export function validateRequired(value) {
  return Boolean(String(value || "").trim());
}

export function validatePassword(value) {
  return String(value || "").trim().length >= 8;
}

export function validateStrongPassword(value) {
  const normalizedValue = String(value || "").trim();
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(normalizedValue);
}

export function validateBudgetRange(value) {
  const normalizedValue = String(value || "").trim();

  if (!/^\d+\s*-\s*\d+$/.test(normalizedValue)) {
    return false;
  }

  const [minimum, maximum] = normalizedValue.split("-").map((item) => Number(item.trim()));
  return minimum > 0 && maximum > minimum;
}

export function validateName(value) {
  return /^[A-Za-z][A-Za-z\s.'-]{1,}$/.test(String(value || "").trim());
}

export function validateUniversityName(value) {
  return /^[A-Za-z][A-Za-z\s.'&-]{2,}$/.test(String(value || "").trim());
}

export function validateBusinessName(value) {
  return /^[A-Za-z0-9][A-Za-z0-9\s.'&/-]{2,}$/.test(String(value || "").trim());
}

export function validateVehicleType(value) {
  return /^[A-Za-z][A-Za-z\s/-]{2,}$/.test(String(value || "").trim());
}

export function validateAdminCode(value) {
  return /^[A-Za-z0-9-]{4,}$/.test(String(value || "").trim());
}

export function validatePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

export function validateMinLength(value, minLength) {
  return String(value || "").trim().length >= minLength;
}
