import {
  validateAdminCode,
  validateBusinessName,
  validateEmail,
  validateMinLength,
  validateName,
  validatePassword,
  validatePhone,
  validateRequired,
  validateStrongPassword,
  validateUniversityName,
  validateVehicleType,
} from "./validation";
import { ROLES } from "../constants/auth";

export function validateLoginForm(form) {
  const errors = {};

  if (!validateEmail(form.email)) {
    errors.email = "Please enter a valid email.";
  }
  if (!validatePassword(form.password)) {
    errors.password = "Password must be at least 8 characters.";
  }

  return errors;
}

export function validateRegisterForm(role, form) {
  const errors = {};

  if (!validateRequired(form.name)) {
    errors.name = "This field is required.";
  } else if (!validateName(form.name)) {
    errors.name = "Enter a valid name using letters only.";
  }

  if (!validateEmail(form.email)) {
    errors.email = "Please enter a valid email.";
  }

  if (!form.isEmailVerified) {
    errors.emailOtp = "Please verify your email with OTP.";
  }

  if (!validateStrongPassword(form.password)) {
    errors.password = "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
  }

  if (!validateRequired(form.confirmPassword)) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (form.confirmPassword !== form.password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (role === ROLES.STUDENT) {
    if (!validateRequired(form.phone)) {
      errors.phone = "Phone number is required.";
    } else if (!validatePhone(form.phone)) {
      errors.phone = "Enter a valid phone number.";
    }

    if (!validateRequired(form.university)) {
      errors.university = "University is required.";
    } else if (!validateMinLength(form.university, 3) || !validateUniversityName(form.university)) {
      errors.university = "Enter a valid university name.";
    }

    if (!validateRequired(form.genderPreference)) {
      errors.genderPreference = "Gender preference is required.";
    }
  }

  if (role === ROLES.OWNER) {
    if (!validateRequired(form.phone)) {
      errors.phone = "Phone number is required.";
    } else if (!validatePhone(form.phone)) {
      errors.phone = "Enter a valid phone number.";
    }

    if (!validateRequired(form.hostelName)) {
      errors.hostelName = "Hostel or business name is required.";
    } else if (!validateMinLength(form.hostelName, 3) || !validateBusinessName(form.hostelName)) {
      errors.hostelName = "Enter a valid hostel or business name.";
    }
  }

  if (role === ROLES.RESTAURANT) {
    if (!validateRequired(form.phone)) {
      errors.phone = "Phone number is required.";
    } else if (!validatePhone(form.phone)) {
      errors.phone = "Enter a valid phone number.";
    }

    if (!validateRequired(form.address)) {
      errors.address = "Address is required.";
    } else if (!validateMinLength(form.address, 8)) {
      errors.address = "Enter a complete restaurant address.";
    }

    if (!validateRequired(form.cuisineType)) {
      errors.cuisineType = "Cuisine type is required.";
    } else if (!validateMinLength(form.cuisineType, 3)) {
      errors.cuisineType = "Enter a valid cuisine type.";
    }
  }

  if (role === ROLES.DELIVERY) {
    if (!validateRequired(form.phone)) {
      errors.phone = "Phone number is required.";
    } else if (!validatePhone(form.phone)) {
      errors.phone = "Enter a valid phone number.";
    }

    if (!validateRequired(form.vehicleType)) {
      errors.vehicleType = "Vehicle type is required.";
    } else if (!validateMinLength(form.vehicleType, 3) || !validateVehicleType(form.vehicleType)) {
      errors.vehicleType = "Enter a valid vehicle type.";
    }
  }

  if (role === ROLES.ADMIN) {
    if (!validateRequired(form.adminCode)) {
      errors.adminCode = "Admin code is required.";
    } else if (!validateAdminCode(form.adminCode)) {
      errors.adminCode = "Enter a valid admin code.";
    }
  }

  return errors;
}
