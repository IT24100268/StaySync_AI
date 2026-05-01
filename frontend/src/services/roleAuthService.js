import apiClient from "./apiClient";

const demoCredentials = [
  { role: "student", email: "student@staysync.ai", password: "password123" },
  { role: "owner", email: "owner@staysync.ai", password: "password123" },
  { role: "restaurant", email: "restaurant@staysync.ai", password: "password123" },
  { role: "delivery", email: "delivery@staysync.ai", password: "password123" },
  { role: "admin", email: "admin@staysync.ai", password: "Admin@12345" },
];

function normalizeRolePayload(payload) {
  if (payload.role === "student") {
    return {
      ...payload,
      institutionName: payload.university,
    };
  }

  if (payload.role === "owner") {
    return {
      ...payload,
      businessName: payload.name,
      city: payload.city || "",
    };
  }

  if (payload.role === "restaurant") {
    return {
      ...payload,
      restaurantName: payload.name,
      cuisineTypes: payload.cuisineType ? [payload.cuisineType] : [],
      city: payload.city || "",
    };
  }

  return payload;
}

function normalizeAuthUser(user) {
  return {
    id: user.id || user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || "",
    status: user.status || "",
  };
}

export async function loginWithRole({ email, password }) {
  const response = await apiClient.post("/auth/login", {
    email,
    password,
  });

  return {
    token: response.data.data.token,
    user: normalizeAuthUser(response.data.data.user),
  };
}

export async function sendRegistrationOtp({ email, name }) {
  const response = await apiClient.post("/auth/send-otp", {
    email,
    name,
  });

  return response.data.data;
}

export async function verifyRegistrationOtp({ email, otp }) {
  const response = await apiClient.post("/auth/verify-otp", {
    email,
    otp,
  });

  return response.data.data;
}

export async function requestPasswordReset({ email }) {
  const response = await apiClient.post("/auth/forgot-password", {
    email,
  });

  return response.data;
}

export async function resetPassword({ email, otp, password }) {
  const response = await apiClient.post("/auth/reset-password", {
    email,
    otp,
    password,
  });

  return response.data;
}

export async function registerWithRole(payload) {
  const normalizedPayload = normalizeRolePayload(payload);
  const response = await apiClient.post("/auth/register", normalizedPayload);

  return {
    token: response.data.data.token,
    user: normalizeAuthUser(response.data.data.user),
  };
}

export function getDemoCredentials() {
  return demoCredentials;
}
